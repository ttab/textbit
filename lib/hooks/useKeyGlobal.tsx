import React, {
  useRef,
  useLayoutEffect,
  useEffect
} from 'react'

/**
 * Hijack keydown events outside of specific component. Returns ref which should
 * be attached to an element which wants to hijack keydown events outside of it.
 */
export function useKeydownGlobal<T extends HTMLElement>(cb: (e: KeyboardEvent) => void): React.MutableRefObject<null | T> {
  const ref = useRef<null | T>(null)
  const refCb = useRef(cb)

  useLayoutEffect(() => {
    refCb.current = cb
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const element = ref?.current
      if (!element?.contains(e.target as Node)) {
        refCb.current(e)
      }
    }

    document.addEventListener("keydown", handler, { capture: true })

    return () => {
      document.removeEventListener("keydown", handler, { capture: true })
    }
  }, [])

  return ref
}
