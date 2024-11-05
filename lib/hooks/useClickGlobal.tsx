import React, {
  useRef,
  useLayoutEffect,
  useEffect
} from 'react'

/**
 * Detect clicks/touch outside of specific component. Returns ref which should be
 * attached to an element which wants to detect click/touch events outside of it.
 */
export function useClickGlobal<T extends HTMLElement>(cb: (e: MouseEvent | TouchEvent) => void): React.MutableRefObject<null | T> {
  const ref = useRef<null | T>(null)
  const refCb = useRef(cb)

  useLayoutEffect(() => {
    refCb.current = cb
  })

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const element = ref?.current
      if (!element?.contains(e.target as Node)) {
        refCb.current(e)
      }
    }

    document.addEventListener("mousedown", handler)
    document.addEventListener("touchstart", handler)

    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("touchstart", handler)
    }
  }, [])

  return ref
}
