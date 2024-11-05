
type DebounceFunction<T extends (...args: never[]) => void> = (...args: Parameters<T>) => void

export const debounce = <T extends (...args: never[]) => void>(func: T, delay: number): DebounceFunction<T> => {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}
