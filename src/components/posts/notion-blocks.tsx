import { Fragment, type ReactNode } from "react"
import type { BlockObjectResponse, RichTextItemResponse } from "@notionhq/client"

/**
 * Notion 본문 블록 렌더러 (글 상세 페이지 본문)
 *
 * Notion 페이지의 본문은 "블록(block)"의 배열이다. 블록은 단락·제목·목록·이미지처럼
 * 종류(type)가 다양하고, 각 종류마다 데이터 구조가 다르다.
 * 이 컴포넌트는 그 배열을 받아 종류별로 알맞은 HTML 로 그려준다.
 *
 * 상호작용이 없는 순수 표시용이라 서버 컴포넌트로 둔다(클라이언트 번들 절감).
 *
 * 비유: 블록 배열이 "레고 조각 상자"라면, 이 컴포넌트는 조각의 모양(type)을 보고
 *      알맞은 자리에 끼워 하나의 완성된 페이지를 만드는 조립 설명서다.
 *
 * 지원 범위(ROADMAP 확정 = 기본 블록만):
 *   단락 · 제목(h1~h3) · 불릿/번호 목록 · 코드 · 이미지 · 인용 · 구분선.
 *   그 외(callout/toggle/table/embed 등)는 조용히 건너뛴다(에러를 내지 않는다).
 */

// 이 컴포넌트가 받는 props — 그릴 블록 배열.
interface NotionBlocksProps {
  blocks: BlockObjectResponse[]
}

// 리스트 항목 블록의 type 값(불릿/번호). 그룹핑 전처리에서 사용한다.
type ListItemType = "bulleted_list_item" | "numbered_list_item"

/**
 * 렌더 단위(segment).
 * Notion 은 리스트 항목을 "각각 별개 블록" 으로 주기 때문에, 그대로 <li> 로 그리면
 * 부모 <ul>/<ol> 없는 고아 <li> 가 되어 무효 HTML 이 된다.
 * 그래서 렌더 전에 연속된 같은 종류의 리스트 항목을 하나의 list 세그먼트로 묶는다.
 *
 * - kind: "list"  → 같은 종류 리스트 항목들의 묶음(<ul> 또는 <ol> 한 덩어리)
 * - kind: "block" → 그 외 단일 블록(단락·제목·이미지 …)
 */
type Segment =
  | { kind: "list"; listType: ListItemType; items: BlockObjectResponse[] }
  | { kind: "block"; block: BlockObjectResponse }

/**
 * 블록 배열을 렌더 세그먼트 배열로 변환한다(연속 리스트 항목 묶기).
 *
 * 동작: 앞에서부터 훑으며, 직전 세그먼트가 "같은 종류의 리스트" 면 거기에 항목을 더하고,
 *       아니면 새 리스트 세그먼트를 시작한다. 리스트가 아닌 블록은 그대로 block 세그먼트로 둔다.
 *
 * @param blocks 원본 블록 배열
 * @returns 그룹핑된 세그먼트 배열
 */
function groupBlocks(blocks: BlockObjectResponse[]): Segment[] {
  const segments: Segment[] = []

  for (const block of blocks) {
    const isListItem =
      block.type === "bulleted_list_item" || block.type === "numbered_list_item"

    if (isListItem) {
      const listType = block.type as ListItemType
      const previous = segments[segments.length - 1] // 직전 세그먼트

      // 직전이 "같은 종류" 리스트면 이어 붙이고, 아니면 새 리스트를 시작한다.
      if (previous && previous.kind === "list" && previous.listType === listType) {
        previous.items.push(block)
      } else {
        segments.push({ kind: "list", listType, items: [block] })
      }
    } else {
      segments.push({ kind: "block", block })
    }
  }

  return segments
}

/**
 * 글자 단위 서식 조각(rich text)을 렌더한다.
 *
 * Notion 의 텍스트는 "조각(piece)" 의 배열이고, 각 조각마다 굵게/기울임/코드/링크 같은
 * 서식(annotations)·링크(href)가 따로 붙는다. 조각별로 알맞은 태그로 감싸 이어 붙인다.
 *
 * @param richText 서식 조각 배열(빈 배열이면 아무것도 렌더하지 않음)
 */
function renderRichText(richText: RichTextItemResponse[]): ReactNode {
  return richText.map((piece, index) => {
    const { bold, italic, strikethrough, underline, code } = piece.annotations

    // 안쪽(텍스트)부터 바깥(서식 태그)으로 차례로 감싼다.
    let node: ReactNode = piece.plain_text

    if (code) {
      // 인라인 코드: 옅은 배경의 등폭 글꼴로 강조
      node = (
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-[0.9em]">
          {node}
        </code>
      )
    }
    if (bold) node = <strong>{node}</strong>
    if (italic) node = <em>{node}</em>
    if (strikethrough) node = <s>{node}</s>
    if (underline) node = <u>{node}</u>

    // 링크가 있으면 가장 바깥을 <a> 로 감싼다(외부 링크는 새 탭 + 보안 속성).
    if (piece.href) {
      node = (
        <a
          href={piece.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2"
        >
          {node}
        </a>
      )
    }

    // 조각은 재정렬되지 않는 정적 배열이라 index 를 key 로 써도 안전하다.
    return <Fragment key={index}>{node}</Fragment>
  })
}

/**
 * image 블록에서 이미지 URL 을 추출한다.
 * 외부 이미지(external)는 원본 URL 을, 업로드 이미지(file)는 Notion 호스팅 URL 을 사용한다.
 *
 * @param image image 블록의 내용(판별 유니온)
 */
function extractImageUrl(image: Extract<BlockObjectResponse, { type: "image" }>["image"]): string {
  return image.type === "external" ? image.external.url : image.file.url
}

/**
 * 단일 블록 하나를 알맞은 HTML 로 렌더한다(리스트 항목 제외 — 그것은 묶음에서 처리).
 *
 * block.type 이 판별자라 switch 안에서 각 분기의 세부 속성에 타입 안전하게 접근할 수 있다.
 * 지원하지 않는 종류는 default 에서 null 을 반환해 "그리지 않되 에러도 내지 않는다".
 *
 * 제목은 h1 이 아니라 h2~h4 로 낮춰 그린다(페이지 제목이 이미 h1 이라, 문서의 제목 위계를
 * 한 단계씩 내려 접근성·SEO 의 단일 h1 원칙을 지킨다).
 *
 * @param block 렌더할 블록
 */
function renderBlock(block: BlockObjectResponse): ReactNode {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="my-4 leading-relaxed">
          {renderRichText(block.paragraph.rich_text)}
        </p>
      )

    case "heading_1":
      return (
        <h2 className="font-heading mt-8 mb-3 text-2xl font-bold tracking-tight">
          {renderRichText(block.heading_1.rich_text)}
        </h2>
      )

    case "heading_2":
      return (
        <h3 className="font-heading mt-7 mb-3 text-xl font-semibold tracking-tight">
          {renderRichText(block.heading_2.rich_text)}
        </h3>
      )

    case "heading_3":
      return (
        <h4 className="font-heading mt-6 mb-2 text-lg font-semibold tracking-tight">
          {renderRichText(block.heading_3.rich_text)}
        </h4>
      )

    case "quote":
      // 좌측 강조선 + 옅은 글자색으로 인용임을 시각적으로 구분
      return (
        <blockquote className="border-primary/40 text-muted-foreground my-4 border-l-4 pl-4 italic">
          {renderRichText(block.quote.rich_text)}
        </blockquote>
      )

    case "code":
      // 코드 블록: 가로 스크롤 가능한 등폭 글꼴 박스.
      // (언어(language) 라벨 표기는 MVP 범위 밖 — 필요 시 추후 추가)
      return (
        <pre className="bg-muted my-4 overflow-x-auto rounded-lg p-4 text-sm">
          <code className="font-mono">
            {block.code.rich_text.map((piece) => piece.plain_text).join("")}
          </code>
        </pre>
      )

    case "image": {
      const imageUrl = extractImageUrl(block.image) // 표시할 이미지 주소
      const caption = block.image.caption // 이미지 설명(서식 조각 배열)
      return (
        <figure className="my-6">
          {/*
            next/image 대신 일반 <img> 를 쓴다:
            Notion 업로드 이미지는 만료되는 임시 URL 이라 도메인 화이트리스트 관리가 번거롭고,
            ISR(60초) 재검증으로 URL 이 주기적으로 갱신되기 때문이다(MVP 결정).
            max-w-full h-auto: 컨테이너를 넘지 않게 반응형으로 축소.
          */}
          {/*
            alt: 캡션이 있으면 그 텍스트를, 없으면 빈 문자열(스크린리더가 장식 이미지로 처리).
            Notion 은 이미지에 별도 alt 필드를 제공하지 않아 캡션을 대체 텍스트로 쓰는 게 최선이다.
            join("") 이 이미 빈 문자열을 반환하므로 별도 기본값 처리는 불필요.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={caption.map((piece) => piece.plain_text).join("")}
            className="h-auto max-w-full rounded-lg"
          />
          {caption.length > 0 && (
            <figcaption className="text-muted-foreground mt-2 text-center text-sm">
              {renderRichText(caption)}
            </figcaption>
          )}
        </figure>
      )
    }

    case "divider":
      return <hr className="my-8" />

    // 미지원 블록(callout/toggle/table/embed 등): 그리지 않고 조용히 넘어간다.
    default:
      return null
  }
}

/**
 * 리스트 항목 하나를 <li> 로 렌더한다(불릿/번호 공통).
 * @param block 리스트 항목 블록(bulleted_list_item 또는 numbered_list_item)
 */
function renderListItem(block: BlockObjectResponse): ReactNode {
  // 두 리스트 타입의 rich_text 위치가 다르므로 타입별로 꺼낸다.
  const richText =
    block.type === "bulleted_list_item"
      ? block.bulleted_list_item.rich_text
      : block.type === "numbered_list_item"
        ? block.numbered_list_item.rich_text
        : []

  return (
    <li key={block.id} className="my-1 leading-relaxed">
      {renderRichText(richText)}
    </li>
  )
}

/**
 * 본문 블록 배열을 받아 글 상세 본문을 렌더한다.
 *
 * 1) groupBlocks 로 연속 리스트 항목을 묶고,
 * 2) 세그먼트 종류에 따라 <ul>/<ol> 또는 단일 블록으로 그린다.
 *
 * 각 세그먼트의 key 는 첫 블록의 안정적인 id 를 사용한다(재정렬·중복 없음).
 */
export function NotionBlocks({ blocks }: NotionBlocksProps) {
  const segments = groupBlocks(blocks) // 그룹핑된 렌더 세그먼트

  return (
    <>
      {segments.map((segment) => {
        if (segment.kind === "list") {
          // 불릿이면 <ul>, 번호면 <ol>. 들여쓰기·마커 스타일은 Tailwind 로 지정.
          const ListTag = segment.listType === "bulleted_list_item" ? "ul" : "ol"
          const listStyle =
            segment.listType === "bulleted_list_item" ? "list-disc" : "list-decimal"
          return (
            <ListTag
              key={segment.items[0].id}
              className={`my-4 ml-6 ${listStyle}`}
            >
              {segment.items.map(renderListItem)}
            </ListTag>
          )
        }

        // 단일 블록 세그먼트
        return (
          <Fragment key={segment.block.id}>{renderBlock(segment.block)}</Fragment>
        )
      })}
    </>
  )
}
