import type { SpellingError } from "../lib/types"

interface Suggestion {
  text: string
  description?: string
}

interface Suggestions {
  level: 'error' | 'suggestion'
  suggestions: Suggestion[]
}
export function spellChecker(text: string, lang: string): SpellingError[] {
  const result: SpellingError[] = []

  const svSuggestions: Record<string, Suggestions> = {
    korrrekt: {
      level: 'error',
      suggestions: [
        { text: 'korrekt' },
        { text: 'korrektur' }
      ]
    }
  }

  const enSuggestions: Record<string, Suggestions> = {
    wee: {
      level: 'error',
      suggestions: [
        { text: 'we', description: 'Alternative single word' },
        { text: 'teeny', description: 'Alternative single word' },
        { text: 'weeny', description: 'Alternative single word' },
        { text: 'a little', description: 'Alternative phrase for "wee bit"' }
      ]
    },
    fo: {
      level: 'error',
      suggestions: [
        { text: 'foo', description: 'Alternative single word' },
        { text: 'fool', description: 'Alternative single word' },
        { text: 'foolish', description: 'Alternative single word' },
        { text: 'foolishness', description: 'Alternative single word' }
      ]
    },
    emphasized: {
      level: 'suggestion',
      suggestions: [
        { text: 'emphasised', description: 'UK vs US spelling' }
      ]
    },
    'else where': {
      level: 'suggestion',
      suggestions: [
        { text: 'elsewhere', description: 'One word instead of two' }
      ]
    }
  }

  // Choose suggestions dict based on lang
  const suggestions = (lang.startsWith('sv')) ? svSuggestions : enSuggestions
  const texts = text.toLowerCase().split(' ')
  for (const misspelled of Object.keys(suggestions)) {
    if (texts.includes(misspelled.toLowerCase())) {
      result.push({
        id: '',
        text: misspelled,
        level: suggestions[misspelled].level,
        suggestions: suggestions[misspelled].suggestions
      })
    }
  }

  return result
}
