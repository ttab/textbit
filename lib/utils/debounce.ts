export type DebounceFunction<T extends (...args: never[]) => void> = {
  (...args: Parameters<T>): void
  force: (...args: Parameters<T>) => void
  cancel: () => void
}

export const debounce = <T extends (...args: never[]) => void>(
  func: T,
  delay: number
): DebounceFunction<T> => {
  let timeoutId: NodeJS.Timeout | undefined

  const debouncedFn = (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }

  // Force immediate execution with provided args
  debouncedFn.force = (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    func(...args)
  }

  // Cancel pending execution
  debouncedFn.cancel = () => {
    clearTimeout(timeoutId)
  }

  return debouncedFn
}
