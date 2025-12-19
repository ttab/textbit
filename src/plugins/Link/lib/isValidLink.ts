/**
 * Validate that a string is using a allowed scheme or no scheme at all. If enforceScheme is true
 * it will require a valid scheme to be present. This is not 100% foolproof but ensures that some
 * attacks as adding javascript:// scheme to a link is not possible.
 *
 * @param str
 * @param enforceScheme
 * @returns
 */
export function isValidLink(link: string, enforceScheme: boolean = false): boolean {
  const allowedSchemes = ['http:', 'https:', 'mailto:', 'tel:']

  if (typeof link !== 'string') {
    return false
  }

  const sanitizedLink = link.trim()
  if (sanitizedLink === '') {
    return false
  }

  try {
    const url = new URL(sanitizedLink)
    return allowedSchemes.includes(url.protocol)
  } catch (ex) {
    if (enforceScheme) {
      return false
    }
  }

  try {
    const url = new URL(sanitizedLink, document.location.origin)
    return url.origin === document.location.origin && allowedSchemes.includes(url.protocol)
  } catch (ex) {
    return false
  }
}
