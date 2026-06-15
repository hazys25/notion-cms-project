// @ts-check
/**
 * Notion 연결 검증 스크립트 (구현 2단계 안전장치)
 *
 * 목적:
 *   "Notion 통합 키 + 데이터베이스 ID + DB 속성 구조"가 PRD 5장 사양대로
 *   올바르게 연결됐는지를 3단계(글 목록 페이지) 구현 전에 한 번에 점검한다.
 *
 * 비유:
 *   이사 후 "전기/수도/가스가 다 들어오는지" 입주 전 한 번에 확인하는 것과 같다.
 *   여기서 OK 가 떠야 3단계에서 실제 조회 코드를 안심하고 올릴 수 있다.
 *
 * 실행:
 *   pnpm verify:notion        (= node scripts/verify-notion.mjs)
 *
 * 설계 메모:
 *   - 이 프로젝트엔 tsx/dotenv 가 없으므로, TypeScript 모듈을 import 하지 않고
 *     순수 Node(ESM)로 동작하도록 작성한다. .env.local 도 직접 파싱한다.
 *   - @notionhq/client v5 는 "데이터베이스 → 데이터소스(data source)" 2계층 구조라
 *     글 조회는 databases.query 가 아니라 dataSources.query({ data_source_id }) 를 쓴다.
 *     그래서 database_id 로부터 data_source_id 를 먼저 얻는 과정까지 검증한다.
 */

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { Client } from "@notionhq/client"

// 이 스크립트 파일이 있는 경로 → 프로젝트 루트(.. 상위)를 기준으로 .env.local 을 찾는다.
const currentFilePath = fileURLToPath(import.meta.url) // 현재 파일 절대경로
const projectRootPath = resolve(dirname(currentFilePath), "..") // 프로젝트 루트 경로

// ── 콘솔 출력용 색상 헬퍼 (가독성 목적, 의존성 없이 ANSI 코드 직접 사용) ──
const colorize = {
  green: (/** @type {string} */ text) => `\x1b[32m${text}\x1b[0m`, // 성공
  red: (/** @type {string} */ text) => `\x1b[31m${text}\x1b[0m`, // 실패
  yellow: (/** @type {string} */ text) => `\x1b[33m${text}\x1b[0m`, // 경고
  gray: (/** @type {string} */ text) => `\x1b[90m${text}\x1b[0m`, // 보조 정보
  bold: (/** @type {string} */ text) => `\x1b[1m${text}\x1b[0m`, // 강조
}

/**
 * .env.local 파일을 직접 파싱해 환경변수 객체로 반환한다.
 * (dotenv 미설치 환경이라 최소 기능만 직접 구현: KEY=VALUE 한 줄씩, 주석/빈 줄 무시)
 *
 * @returns {Record<string, string>} 키-값 환경변수 맵
 */
function loadEnvLocal() {
  // .env.local 절대경로 (프로젝트 루트 기준)
  const envFilePath = resolve(projectRootPath, ".env.local")

  let rawContent // 파일 원문
  try {
    rawContent = readFileSync(envFilePath, "utf8")
  } catch {
    // 파일이 아예 없으면 빈 객체를 반환하고, 검증 단계에서 친절히 안내한다.
    return {}
  }

  // 파싱 결과를 담을 맵
  const parsedEnv = /** @type {Record<string, string>} */ ({})

  for (const line of rawContent.split("\n")) {
    const trimmedLine = line.trim() // 앞뒤 공백 제거한 한 줄

    // 빈 줄·주석(#)은 건너뛴다.
    if (trimmedLine === "" || trimmedLine.startsWith("#")) continue

    // 첫 '=' 기준으로 키와 값을 분리한다(값 안에 '='가 있어도 안전).
    const separatorIndex = trimmedLine.indexOf("=")
    if (separatorIndex === -1) continue

    const key = trimmedLine.slice(0, separatorIndex).trim() // 변수명
    let value = trimmedLine.slice(separatorIndex + 1).trim() // 변수값

    // 따옴표로 감싼 값은 따옴표를 벗긴다.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    parsedEnv[key] = value
  }

  return parsedEnv
}

/**
 * PRD 5장에서 정의한 Notion 데이터베이스 속성 사양.
 * key = Notion 속성명(Property), type = 기대하는 Notion 속성 타입.
 * 검증 시 실제 DB 속성과 대조해 누락/타입 불일치를 잡아낸다.
 */
const EXPECTED_PROPERTIES = [
  { name: "Title", type: "title", description: "게시글 제목" },
  { name: "Category", type: "select", description: "카테고리(단일 선택)" },
  { name: "Tags", type: "multi_select", description: "태그(복수 선택)" },
  { name: "Published", type: "date", description: "기사 작성일(정렬 기준)" },
  { name: "Status", type: "select", description: "상태(초안/발행됨)" },
]

/**
 * 데이터베이스 객체에서 data_source_id(서랍 ID)를 추출한다.
 * v5 API 응답에는 data_sources 배열이 포함된다. 만약 없다면(구버전/단일소스),
 * database_id 자체를 fallback 으로 사용한다.
 *
 * @param {any} database databases.retrieve 응답
 * @param {string} databaseId 환경변수의 DB ID
 * @returns {{ id: string, source: string }} 사용할 data_source_id 와 출처 설명
 */
function resolveDataSourceId(database, databaseId) {
  // v5: { data_sources: [{ id, name }, ...] }
  if (Array.isArray(database?.data_sources) && database.data_sources.length > 0) {
    return { id: database.data_sources[0].id, source: "database.data_sources[0]" }
  }
  // fallback: 데이터소스 정보가 없으면 DB ID 를 그대로 시도한다.
  return { id: databaseId, source: "database_id(fallback)" }
}

/**
 * 메인 검증 루틴.
 * 단계별로 점검하고, 실패 시 원인과 해결법을 함께 출력한다.
 */
async function main() {
  console.log(colorize.bold("\n🔎 Notion 연결 검증을 시작합니다...\n"))

  // ── 1단계: 환경변수 로드 ──────────────────────────────────────
  const env = loadEnvLocal()
  const notionApiKey = env.NOTION_API_KEY // 통합 시크릿 키
  const notionDatabaseId = env.NOTION_DATABASE_ID // 게시글 DB ID

  if (!notionApiKey || !notionDatabaseId) {
    console.log(colorize.red("❌ 환경변수 누락"))
    if (!notionApiKey) console.log("   - NOTION_API_KEY 가 .env.local 에 없습니다.")
    if (!notionDatabaseId) console.log("   - NOTION_DATABASE_ID 가 .env.local 에 없습니다.")
    console.log(
      colorize.gray(
        "\n   .env.example 을 참고해 .env.local 에 두 값을 채운 뒤 다시 실행하세요.",
      ),
    )
    process.exit(1)
  }

  console.log(`${colorize.green("✓")} 환경변수 로드 완료`)
  console.log(colorize.gray(`   NOTION_API_KEY      = ${maskSecret(notionApiKey)}`))
  console.log(colorize.gray(`   NOTION_DATABASE_ID  = ${notionDatabaseId}\n`))

  // ── 2단계: Notion 클라이언트로 데이터베이스 조회 ───────────────
  const notion = new Client({ auth: notionApiKey })

  let database // databases.retrieve 응답
  try {
    database = await notion.databases.retrieve({ database_id: notionDatabaseId })
  } catch (error) {
    console.log(colorize.red("❌ 데이터베이스 조회 실패"))
    printNotionError(error)
    console.log(
      colorize.yellow(
        "\n   가장 흔한 원인: 통합(Integration)을 해당 데이터베이스에 연결(Connection)하지 않음.\n" +
          "   → Notion 에서 DB 우측 상단 ⋯ 메뉴 > Connections > 통합 추가 후 다시 시도하세요.",
      ),
    )
    process.exit(1)
  }

  // 데이터베이스 제목 추출(여러 rich_text 조각을 이어붙임)
  const databaseTitle =
    (database.title ?? []).map((/** @type {any} */ part) => part.plain_text).join("") ||
    "(제목 없음)"
  console.log(`${colorize.green("✓")} 데이터베이스 접근 성공: ${colorize.bold(databaseTitle)}\n`)

  // ── 3단계: 속성(컬럼) 구조 검증 ───────────────────────────────
  console.log(colorize.bold("📋 속성 구조 점검 (PRD 5장 기준)"))
  const actualProperties = database.properties ?? {} // 실제 DB 속성 맵
  let hasSchemaProblem = false // 하나라도 문제가 있으면 true

  for (const expected of EXPECTED_PROPERTIES) {
    const actual = actualProperties[expected.name] // 실제 속성 정의

    if (!actual) {
      // 속성 자체가 없음
      hasSchemaProblem = true
      console.log(
        `   ${colorize.red("✗")} ${expected.name} ${colorize.gray(`(${expected.description})`)} — 속성이 없습니다. 기대 타입: ${expected.type}`,
      )
    } else if (actual.type !== expected.type) {
      // 속성은 있으나 타입이 다름
      hasSchemaProblem = true
      console.log(
        `   ${colorize.yellow("!")} ${expected.name} — 타입 불일치: 실제 ${colorize.yellow(actual.type)} / 기대 ${colorize.green(expected.type)}`,
      )
    } else {
      console.log(
        `   ${colorize.green("✓")} ${expected.name} ${colorize.gray(`(${actual.type})`)}`,
      )
    }
  }
  console.log("")

  // ── 4단계: data_source_id 확보 후 실제 조회 테스트 ────────────
  const { id: dataSourceId, source: dataSourceOrigin } = resolveDataSourceId(
    database,
    notionDatabaseId,
  )
  console.log(colorize.bold("🗄️  데이터소스 조회 테스트"))
  console.log(colorize.gray(`   data_source_id = ${dataSourceId}  [${dataSourceOrigin}]`))

  try {
    // page_size=1 로 가볍게 "조회 가능 여부"만 확인한다(전체 데이터를 끌어오지 않음).
    const queryResult = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 1,
    })
    const fetchedCount = queryResult.results.length // 이번 호출로 가져온 행 수(최대 1)
    console.log(
      `${colorize.green("✓")} 데이터소스 조회 성공 (현재 행 ${fetchedCount === 0 ? "0개 — 빈 DB" : fetchedCount + "개+ 확인"})\n`,
    )
  } catch (error) {
    console.log(colorize.red("❌ 데이터소스 조회 실패"))
    printNotionError(error)
    process.exit(1)
  }

  // ── 최종 결과 ────────────────────────────────────────────────
  if (hasSchemaProblem) {
    console.log(
      colorize.yellow(
        "⚠️  연결은 성공했지만 속성 구조가 PRD 사양과 다릅니다.\n" +
          "    Notion DB 속성명/타입을 위 표시대로 맞추면 3단계 구현이 매끄럽습니다.",
      ),
    )
    process.exit(1)
  }

  console.log(
    colorize.green(colorize.bold("✅ 모든 검증 통과! 3단계(글 목록 페이지)로 진행할 준비가 됐습니다.")),
  )
  // 3단계에서 쓸 data_source_id 를 안내한다.
  console.log(
    colorize.gray(`\n   참고: 3단계 조회에서 사용할 data_source_id = ${dataSourceId}`),
  )
}

/**
 * 시크릿 키를 로그에 안전하게 보여주기 위해 일부만 노출하고 나머지는 가린다.
 * @param {string} secret 원본 시크릿
 * @returns {string} 마스킹된 문자열 (예: ntn_1234********)
 */
function maskSecret(secret) {
  if (secret.length <= 8) return "********"
  return `${secret.slice(0, 8)}${"*".repeat(8)}`
}

/**
 * Notion API 에러를 사람이 읽기 좋게 출력한다.
 * @param {any} error catch 로 잡은 에러
 */
function printNotionError(error) {
  // Notion SDK 에러는 code/status/message 를 가진다.
  const code = error?.code ?? "(코드 없음)"
  const status = error?.status ?? "(상태 없음)"
  const message = error?.message ?? String(error)
  console.log(colorize.gray(`   code=${code} status=${status}`))
  console.log(colorize.gray(`   message=${message}`))
}

// 스크립트 진입점: 예기치 못한 에러도 깔끔히 처리한다.
main().catch((error) => {
  console.log(colorize.red("\n❌ 예기치 못한 오류로 검증이 중단됐습니다."))
  console.log(colorize.gray(String(error?.stack ?? error)))
  process.exit(1)
})
