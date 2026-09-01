import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import * as Y from 'yjs'
import { slateNodesToInsertDelta } from '@slate-yjs/core'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable/TextbitEditable'
import { basicEditorContent } from './_fixtures'

function makeSharedType(): Y.XmlText {
  const doc = new Y.Doc()
  const sharedType = doc.get('content', Y.XmlText) as Y.XmlText
  sharedType.applyDelta(slateNodesToInsertDelta(basicEditorContent))
  return sharedType
}

describe('Textbit collaborative detection', () => {
  test('a Yjs value with null awareness renders as a plain editor (no remote-cursor overlay, no throw)', () => {
    const sharedType = makeSharedType()

    const { container } = render(
      <TextbitRoot value={sharedType} awareness={null}>
        <TextbitEditable />
      </TextbitRoot>
    )

    expect(container.querySelector('.textbit-y-overlay')).toBeNull()
    expect(screen.getByText('This is title')).toBeInTheDocument()
  })
})
