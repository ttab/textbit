/**
 * Normalizes all whitespace in a string by making sure it cannot break
 * into multiple paragraphs.
 *
 * Tabs are removed as they normally are problematic in a single line
 * context in a field etc in the editor.
 *
 * We specifically don't want to remove non breaking spaces (\u00A0)
 * or any other specialized spacers that are used to keep numbers
 * together or used in different languages.
 *
 * 1. Replacing all whitespace characters (tabs, line breaks, etc.) with spaces
 * 2. Reducing multiple consecutive spaces to a single space
 */
export function normalizeWhitespace(text: string): string {
  if (!text) {
    return text
  }

  // Replace all whitespace characters with a regular space
  // - \n (line feed)
  // - \r (carriage return)
  // - \t (tab)
  // - \f (form feed)
  // - \v (vertical tab)
  // - \u2028 (line separator)
  // - \u2029 (paragraph separator)
  const replacedWhitespace = text.replace(/[\n\r\t\f\v\u2028\u2029]+/g, ' ')

  // Then, replace any sequences of spaces with a single space
  return replacedWhitespace.replace(/\s+/g, ' ')
}
