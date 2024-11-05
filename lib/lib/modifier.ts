export function isMac() {
  return !!navigator.userAgent.match('Mac OS X')?.length || false
}

export function modifier(modifier: string) {
  const mods = modifier.split('+')
  if (!mods?.length) {
    return ''
  }

  const foo = mods.map((mod) => {
    switch (mod) {
      case 'mod':
        return '⌘'
      case 'shift':
        return '⇧'
      case 'ctrl':
        return '⌃'
      case 'alt':
      case 'option':
        return '⌥'
      case 'up':
        return '↑'
      case 'down':
        return '↓'
      case 'right':
        return '→'
      case 'left':
        return '←'
      default:
        return mod
    }
  })
  return foo.join('')
}
