export function isMac(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string }
  }
  const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent || ''
  return /\bmac/i.test(platform)
}

const IS_MAC = isMac()

const SHARED: Record<string, string> = {
  up: '↑',
  down: '↓',
  right: '→',
  left: '←'
}

const MAC: Record<string, string> = {
  mod: '⌘',
  shift: '⇧',
  ctrl: '⌃',
  control: '⌃',
  alt: '⌥',
  opt: '⌥',
  option: '⌥'
}

const PC: Record<string, string> = {
  mod: 'Ctrl',
  ctrl: 'Ctrl',
  control: 'Ctrl',
  shift: 'Shift',
  alt: 'Alt',
  opt: 'Alt',
  option: 'Alt'
}

export function modifier(hotkey: string, mac: boolean = IS_MAC): string {
  if (!hotkey) return ''
  const tokens = hotkey
    .split('+')
    .map((token) => formatToken(token, mac))
    .filter(Boolean)
  return tokens.join(mac ? '' : '+')
}

function formatToken(token: string, mac: boolean): string {
  const t = token.toLowerCase()
  const mapped = (mac ? MAC : PC)[t] ?? SHARED[t]
  if (mapped) return mapped
  return token.length === 1 ? token.toUpperCase() : token
}
