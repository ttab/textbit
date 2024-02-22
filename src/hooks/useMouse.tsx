import {
  useState,
  useRef,
  useLayoutEffect
} from 'react'


export type MousePosition = {
  x: number;
  y: number;
  elementX: number;
  elementY: number;
  elementPositionX: number;
  elementPositionY: number;
}


export function useMouse<T extends Element>(): [
  MousePosition,
  React.MutableRefObject<T | undefined>
] {
  const [state, setState] = useState<MousePosition>({
    x: 0,
    y: 0,
    elementX: 0,
    elementY: 0,
    elementPositionX: 0,
    elementPositionY: 0,
  })

  const ref = useRef<T | undefined>()

  useLayoutEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      let newState: Partial<MousePosition> = {
        x: event.pageX,
        y: event.pageY,
      };

      if (ref.current?.nodeType === Node.ELEMENT_NODE) {
        const { left, top } = ref.current.getBoundingClientRect()
        const elementPositionX = left + window.scrollX
        const elementPositionY = top + window.scrollY
        const elementX = event.pageX - elementPositionX
        const elementY = event.pageY - elementPositionY

        newState.elementX = elementX
        newState.elementY = elementY
        newState.elementPositionX = elementPositionX
        newState.elementPositionY = elementPositionY
      }

      setState((s) => {
        return {
          ...s,
          ...newState,
        }
      })
    }

    document.addEventListener("mousemove", handleMouseMove)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return [state, ref]
}
