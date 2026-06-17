// @ts-check
/**
 * Notion DB 속성 정합 + 샘플 글 시드 스크립트 (일회성 셋업)
 *
 * 목적:
 *   Q-1 블로커 해소 — "Posts" 데이터베이스에 PRD 5장 속성
 *   (Title/Category/Tags/Published/Status)을 코드로 추가하고,
 *   종단 렌더 확인용 샘플 발행 글 1개를 시드한다.
 *
 * 왜 MCP 가 아니라 이 스크립트인가:
 *   .mcp.json 의 notionApi 서버는 NOTION_TOKEN 에 ${NOTION_API_KEY} 를 주입하는데,
 *   현재 셸 세션에 그 환경변수가 없어 MCP 가 빈 토큰으로 떠 401 이 난다.
 *   verify-notion.mjs 처럼 .env.local 을 직접 파싱하면 이 문제를 우회할 수 있다.
 *
 * 설계 메모 (v5 API 2계층 구조):
 *   - @notionhq/client v5 는 "데이터베이스 → 데이터소스" 2계층이라,
 *     속성(스키마) 변경은 databases.update 가 아니라
 *     dataSources.update({ data_source_id, properties }) 를 쓴다.
 *   - title 타입 속성은 DB 당 정확히 1개만 존재할 수 있다. 그래서 새로 만들지 않고
 *     기존 title 속성의 "이름"을 PRD 사양인 "Title" 로 변경(rename)한다.
 *
 * 실행:
 *   node scripts/setup-notion-schema.mjs
 */

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { Client } from "@notionhq/client"

// 이 스크립트 파일 경로 → 프로젝트 루트(.. 상위) 기준으로 .env.local 을 찾는다.
const currentFilePath = fileURLToPath(import.meta.url) // 현재 파일 절대경로
const projectRootPath = resolve(dirname(currentFilePath), "..") // 프로젝트 루트 경로

// ── 콘솔 색상 헬퍼 (의존성 없이 ANSI 직접 사용) ──
const colorize = {
  green: (/** @type {string} */ t) => `\x1b[32m${t}\x1b[0m`,
  red: (/** @type {string} */ t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (/** @type {string} */ t) => `\x1b[33m${t}\x1b[0m`,
  gray: (/** @type {string} */ t) => `\x1b[90m${t}\x1b[0m`,
  bold: (/** @type {string} */ t) => `\x1b[1m${t}\x1b[0m`,
}

/**
 * .env.local 을 직접 파싱한다(dotenv 미설치 환경 대응).
 * @returns {Record<string, string>} 키-값 환경변수 맵
 */
function loadEnvLocal() {
  const envFilePath = resolve(projectRootPath, ".env.local") // .env.local 절대경로
  let rawContent // 파일 원문
  try {
    rawContent = readFileSync(envFilePath, "utf8")
  } catch {
    return {}
  }

  const parsedEnv = /** @type {Record<string, string>} */ ({})
  for (const line of rawContent.split("\n")) {
    const trimmedLine = line.trim()
    if (trimmedLine === "" || trimmedLine.startsWith("#")) continue
    const separatorIndex = trimmedLine.indexOf("=")
    if (separatorIndex === -1) continue
    const key = trimmedLine.slice(0, separatorIndex).trim()
    let value = trimmedLine.slice(separatorIndex + 1).trim()
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
 * Notion API 에러를 읽기 좋게 출력한다.
 * @param {any} error
 */
function printNotionError(error) {
  console.log(colorize.gray(`   code=${error?.code ?? "(없음)"} status=${error?.status ?? "(없음)"}`))
  console.log(colorize.gray(`   message=${error?.message ?? String(error)}`))
}

async function main() {
  console.log(colorize.bold("\n🛠️  Notion DB 속성 정합 + 샘플 글 시드를 시작합니다...\n"))

  // ── 1) 환경변수 로드 ──────────────────────────────────────────
  const env = loadEnvLocal()
  const notionApiKey = env.NOTION_API_KEY // 통합 시크릿 키
  const notionDatabaseId = env.NOTION_DATABASE_ID // 게시글 DB ID
  if (!notionApiKey || !notionDatabaseId) {
    console.log(colorize.red("❌ .env.local 에 NOTION_API_KEY / NOTION_DATABASE_ID 가 필요합니다."))
    process.exit(1)
  }
  const notion = new Client({ auth: notionApiKey }) // Notion 클라이언트

  // ── 2) database → data_source_id 확보 (v5 2계층) ──────────────
  const database = await notion.databases.retrieve({ database_id: notionDatabaseId })
  const dataSources = /** @type {any} */ (database).data_sources // [{ id, name }, ...]
  if (!Array.isArray(dataSources) || dataSources.length === 0) {
    console.log(colorize.red("❌ data_sources 를 찾을 수 없습니다(예상치 못한 응답 구조)."))
    process.exit(1)
  }
  const dataSourceId = dataSources[0].id // 첫 데이터소스 ID
  console.log(`${colorize.green("✓")} data_source_id = ${dataSourceId}`)

  // ── 3) 현재 데이터소스 속성 조회 → 기존 title 속성 이름 찾기 ──
  const dataSource = await notion.dataSources.retrieve({ data_source_id: dataSourceId })
  const currentProperties = /** @type {any} */ (dataSource).properties ?? {} // 현재 속성 맵

  // title 타입 속성은 DB 당 1개. 그 "현재 이름"을 찾아 "Title" 로 rename 한다.
  let existingTitlePropertyName = null // 기존 title 속성의 현재 이름
  for (const [propertyName, propertyValue] of Object.entries(currentProperties)) {
    if (/** @type {any} */ (propertyValue)?.type === "title") {
      existingTitlePropertyName = propertyName
      break
    }
  }
  console.log(
    colorize.gray(
      `   현재 속성: ${Object.keys(currentProperties).join(", ") || "(없음)"}\n` +
        `   기존 title 속성 이름: ${existingTitlePropertyName ?? "(없음)"}`,
    ),
  )

  // ── 4) 속성 스키마 업데이트 payload 구성 ──────────────────────
  // PRD 5장: Title(title)/Category(select)/Tags(multi_select)/Published(date)/Status(select)
  const propertiesUpdate = /** @type {Record<string, any>} */ ({
    // 카테고리(단일 선택): 관심주식 뉴스 큐레이션 맥락의 예시 옵션
    Category: {
      select: {
        options: [
          { name: "시장동향", color: "blue" },
          { name: "종목분석", color: "green" },
          { name: "경제일반", color: "orange" },
        ],
      },
    },
    // 태그(복수 선택): 종목/키워드 예시 옵션
    Tags: {
      multi_select: {
        options: [
          { name: "삼성전자", color: "blue" },
          { name: "반도체", color: "purple" },
          { name: "코스피", color: "yellow" },
          { name: "실적", color: "pink" },
        ],
      },
    },
    // 기사 작성일(정렬 기준)
    Published: { date: {} },
    // 상태(초안/발행됨) — PRD 는 select 타입으로 정의
    Status: {
      select: {
        options: [
          { name: "초안", color: "gray" },
          { name: "발행됨", color: "green" },
        ],
      },
    },
  })

  // 기존 title 속성을 "Title" 로 rename (이름이 이미 "Title" 이면 생략).
  if (existingTitlePropertyName && existingTitlePropertyName !== "Title") {
    propertiesUpdate[existingTitlePropertyName] = { name: "Title" }
  }

  console.log(colorize.bold("\n📝 속성 스키마 업데이트 중..."))
  try {
    await notion.dataSources.update({
      data_source_id: dataSourceId,
      // @ts-expect-error v5 properties 스키마는 런타임에서 유효(타입 정의가 광범위)
      properties: propertiesUpdate,
    })
  } catch (error) {
    console.log(colorize.red("❌ 속성 업데이트 실패"))
    printNotionError(error)
    process.exit(1)
  }
  console.log(`${colorize.green("✓")} 속성 추가/정합 완료 (Title/Category/Tags/Published/Status)`)

  // ── 5) 샘플 발행 글 1개 시드 (종단 렌더 확인용) ───────────────
  // NotionBlocks 렌더러를 폭넓게 검증하도록 여러 블록 타입을 섞어 넣는다.
  console.log(colorize.bold("\n🌱 샘플 발행 글 시드 중..."))
  try {
    const createdPage = await notion.pages.create({
      // v5: 페이지의 parent 로 data_source_id 를 지정
      parent: { type: "data_source_id", data_source_id: dataSourceId },
      properties: {
        Title: {
          title: [{ text: { content: "삼성전자, 반도체 업황 회복 기대감에 강세" } }],
        },
        Category: { select: { name: "종목분석" } },
        Tags: { multi_select: [{ name: "삼성전자" }, { name: "반도체" }, { name: "실적" }] },
        Published: { date: { start: "2026-06-17" } },
        Status: { select: { name: "발행됨" } },
      },
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: "요약" } }] },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              { type: "text", text: { content: "삼성전자가 메모리 반도체 가격 반등 기대감에 " } },
              { type: "text", text: { content: "장 초반 강세" }, annotations: { bold: true } },
              { type: "text", text: { content: "를 보이고 있다." } },
            ],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: "DRAM 현물가 3주 연속 상승" } }],
          },
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: "외국인 순매수 전환" } }],
          },
        },
        {
          object: "block",
          type: "quote",
          quote: {
            rich_text: [
              { type: "text", text: { content: "하반기 업황 회복이 가시화되고 있다 — 증권가 코멘트" } },
            ],
          },
        },
        { object: "block", type: "divider", divider: {} },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              { type: "text", text: { content: "(본 글은 종단 렌더 확인용 샘플 데이터입니다.)" } },
            ],
          },
        },
      ],
    })
    console.log(`${colorize.green("✓")} 샘플 글 생성 완료: ${colorize.gray(/** @type {any} */ (createdPage).id)}`)
  } catch (error) {
    console.log(colorize.red("❌ 샘플 글 생성 실패"))
    printNotionError(error)
    process.exit(1)
  }

  console.log(
    colorize.green(colorize.bold("\n✅ 완료! 이제 `pnpm verify:notion` 으로 정합을 확인하세요.")),
  )
}

main().catch((error) => {
  console.log(colorize.red("\n❌ 예기치 못한 오류로 셋업이 중단됐습니다."))
  console.log(colorize.gray(String(error?.stack ?? error)))
  process.exit(1)
})
