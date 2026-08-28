/**
 * Collapses Windows (\r\n) and classic Mac (\r) line endings to plain \n so
 * that line break logic can be written against a single character.
 *
 * The alternation \r\n|\r matters: a character class like [\r\n] would treat a
 * single CRLF break as two separate breaks, which makes it indistinguishable
 * from a blank line.
 *
 * Deliberately narrow, this only unifies line endings. It does not touch the
 * unicode line/paragraph separators or any other whitespace, see
 * normalizeWhitespace() for that.
 */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n|\r/g, '\n')
}
