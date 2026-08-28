import { type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { usePendingDrops } from '../hooks/usePendingDrops'
import type { PendingDrop } from '../contexts/PendingDropsContext'

interface UploadMarkerProps {
  className?: string
  style?: CSSProperties
  /**
   * Reserved flow height per marker. The block at the drop position gets a
   * `margin-top` of this many pixels so the marker sits in real reserved
   * space rather than overlaying content. Consumers can override to match
   * their content's expected size. Defaults to 60px.
   */
  height?: number
  /**
   * Per-drop render override. Receives the pending drop and returns any React
   * node. When omitted, a minimal default is rendered (a thin gray chip) so
   * unstyled placements are visible without setup. Match the pattern of
   * `Textbit.DropMarker` — consumers own presentation.
   */
  children?: (drop: PendingDrop) => ReactNode
}

const DEFAULT_HEIGHT = 60

/**
 * Renders a marker at each pending drop position while `await consume()` is
 * running for that drop. User-composed — place inside `<Textbit.Editable>` to
 * opt in. Does nothing outside a `PendingDropsProvider` or when there are no
 * pending drops.
 *
 * Positioning combines two mechanisms so the marker takes up real flow space
 * instead of overlaying content:
 *
 * 1. **Space reservation**: apply an inline `margin-top` to the target block's
 *    DOM node equal to the marker `height`. Content below shifts down; when
 *    the marker vanishes (drop resolved or cancelled), the margin is removed
 *    and the layout snaps back.
 * 2. **Marker rendering**: an absolutely-positioned box fills the reserved
 *    space above the target block. Positioning is relative to the drag/drop
 *    wrapper (a `DragStateProvider` sets `position: relative` on its wrapper).
 *
 * Positions are re-measured on scroll (both the editable and its scrollable
 * ancestors) and on resize of the editable or any target block, so markers
 * stay aligned when the layout shifts underneath them.
 */
export function UploadMarker({ className, style, height = DEFAULT_HEIGHT, children }: UploadMarkerProps) {
  const editor = useSlateStatic()
  const drops = usePendingDrops()
  const ref = useRef<HTMLDivElement>(null)
  // The marker boxes are absolutely positioned, so their coordinates must be
  // relative to their offset parent (the nearest positioned ancestor), NOT the
  // editable. When the editable is inset from that ancestor (e.g. a left gutter
  // margin) the two differ, and measuring the editable would push markers into
  // the gutter. We therefore track the offset parent's rect as the origin.
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)

  // Apply the reserved-space margin to each target block. Cleanup restores
  // previous margins so removing a marker doesn't leave dead space behind.
  useLayoutEffect(() => {
    if (drops.length === 0) return
    const cleanups: Array<() => void> = []
    for (const drop of drops) {
      const dom = domNodeForPath(editor, drop.path)
      if (!dom) continue
      const previous = dom.style.marginTop
      dom.style.marginTop = `${height}px`
      cleanups.push(() => { dom.style.marginTop = previous })
    }
    return () => { for (const fn of cleanups) fn() }
  }, [drops, editor, height])

  // Measure the offset parent + observe every relevant DOM change that could
  // shift positions: window resize, scroll of any ancestor, and resize of the
  // offset parent, the editable, or any target block.
  useLayoutEffect(() => {
    if (!ref.current) return
    const container = ref.current.parentElement
    if (!container) return
    // The markers live inside a display:contents wrapper, so their offset
    // parent is the nearest positioned ancestor of `container`. Measure that
    // exact element so `rect - originRect` yields the marker's absolute
    // coordinates within its positioning context.
    const origin = nearestPositionedAncestor(container)
    if (!origin) return

    const measure = () => setOriginRect(origin.getBoundingClientRect())
    measure()

    if (drops.length === 0) return

    const observer = new ResizeObserver(measure)
    observer.observe(origin)
    const editable = Array.from(container.children).find(
      (child) => child.getAttribute('role') === 'textbox'
    ) as HTMLElement | undefined
    if (editable) observer.observe(editable)
    for (const drop of drops) {
      const dom = domNodeForPath(editor, drop.path)
      if (dom) observer.observe(dom)
    }

    // Capture: any scroll in the tree (including the window) fires and we
    // re-measure. Passive so we don't block scroll.
    window.addEventListener('scroll', measure, { passive: true, capture: true })
    window.addEventListener('resize', measure, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', measure, { capture: true } as EventListenerOptions)
      window.removeEventListener('resize', measure)
    }
  }, [drops, editor])

  // Screen-reader announcement of upload activity. Only counts own drops —
  // peer activity is intentionally silent because a screen reader user isn't
  // acting on it and doesn't need continuous updates about other users.
  const ownCount = drops.filter((d) => d.source === 'own').length
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => {
    if (ownCount === 0) {
      setAnnouncement('')
      return
    }
    setAnnouncement(
      ownCount === 1
        ? 'Upload in progress'
        : `${ownCount} uploads in progress`
    )
  }, [ownCount])

  if (drops.length === 0 || !originRect) {
    // Keep a hidden anchor so the useLayoutEffect can find the offset parent
    // on the next drop without waiting for a remount. Also carries
    // the aria-live region so screen readers pick up announcements even
    // when the visual chip is gone (e.g. transient errors).
    return (
      <div ref={ref} style={{ display: 'none' }}>
        <AnnouncementRegion text={announcement} />
      </div>
    )
  }

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      <AnnouncementRegion text={announcement} />
      {drops.map((drop) => {
        const rect = domRectForPath(editor, drop.path)
        if (!rect) return null

        const left = rect.left - originRect.left
        // Marker sits in the margin gap we reserved ABOVE the target block —
        // pull upward by exactly `height`.
        const top = rect.top - originRect.top - height

        const positional: CSSProperties = {
          position: 'absolute',
          left,
          top,
          width: rect.width,
          height,
          pointerEvents: 'none',
          userSelect: 'none'
        }

        return (
          <div
            key={drop.id}
            className={className}
            data-source={drop.source}
            data-kind={drop.kind ?? ''}
            style={{ ...defaultStyle, ...positional, ...style }}
          >
            {children ? children(drop) : null}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Visually hidden `aria-live` region for screen-reader announcements. The
 * text updates when the local upload count changes; assistive tech reads
 * the new text politely (won't interrupt other announcements).
 */
function AnnouncementRegion({ text }: { text: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={visuallyHidden}
    >
      {text}
    </div>
  )
}

const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0
}

// Minimal visible default — a subtle chip that outlines the reserved slot.
// Consumers restyle via className/style; the render-prop path bypasses this
// entirely.
const defaultStyle: CSSProperties = {
  background: 'rgba(191, 191, 191, 0.25)',
  border: '1px dashed rgba(128, 128, 128, 0.6)',
  borderRadius: 2
}

/**
 * Nearest ancestor (including `el` itself) with a non-static `position`, i.e.
 * the offset parent that an absolutely-positioned descendant is placed
 * against. Returns null if none is found (no positioned ancestor in the tree).
 */
function nearestPositionedAncestor(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el
  while (node) {
    if (getComputedStyle(node).position !== 'static') return node
    node = node.parentElement
  }
  return null
}

/**
 * Best-effort DOM node for a Slate path. Returns null when the path is
 * currently unreachable (e.g. the block was removed between drop start and
 * this render).
 */
function domNodeForPath(editor: ReturnType<typeof useSlateStatic>, path: number[]): HTMLElement | null {
  try {
    const [node] = editor.node(path)
    return ReactEditor.toDOMNode(editor, node) as HTMLElement
  } catch {
    return null
  }
}

function domRectForPath(editor: ReturnType<typeof useSlateStatic>, path: number[]): DOMRect | null {
  const dom = domNodeForPath(editor, path)
  return dom ? dom.getBoundingClientRect() : null
}
