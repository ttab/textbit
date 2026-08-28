// Non-breaking space (U+00A0). Built from its char code so the source stays
// ASCII and a regular space is never confused with a non-breaking one.
const NBSP = String.fromCharCode(0xa0)

/**
 * Normalizes whitespace so a string cannot break into multiple lines or
 * paragraphs, while keeping non-breaking spaces intact.
 *
 * Every run of whitespace (spaces, tabs, line breaks, non-breaking spaces and
 * so on) is collapsed to a single character. When the run contains a
 * non-breaking space (U+00A0) the survivor is a non-breaking space, so grouped
 * numbers like "1 000" stay together. Otherwise a regular space is used.
 */
export function normalizeWhitespace(text: string): string {
  if (!text) {
    return text
  }

  return text.replace(/\s+/g, (run) => (run.includes(NBSP) ? NBSP : ' '))
}
