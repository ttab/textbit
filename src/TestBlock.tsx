import type { TBPluginInitFunction } from '../lib/main'
import type { TBComponentProps } from '../lib/main'
import { Editor, Transforms } from 'slate'
import type { ActionHandlerArgs } from '../lib/types'

// TestBlock Component
const TestBlockComponent = ({ children, element, attributes }: TBComponentProps) => {
  return (
    <div
      {...attributes}
      className="test-block"
      style={{
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        minHeight: '60px',
        position: 'relative'
      }}
    >
      {/* Block label */}
      <div
        contentEditable={false}
        className="test-block-label"
        style={{
          position: 'absolute',
          top: '4px',
          right: '8px',
          fontSize: '10px',
          color: '#64748b',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          userSelect: 'none'
        }}
      >
        Test Block
      </div>

      {/* Content area */}
      <div style={{ paddingTop: '4px' }}>
        {children}
      </div>

      {/* Block info */}
      <div
        contentEditable={false}
        className="test-block-id"
        style={{
          position: 'absolute',
          bottom: '4px',
          left: '8px',
          fontSize: '9px',
          color: '#94a3b8',
          fontFamily: 'monospace',
          userSelect: 'none'
        }}
      >
        ID: {element.id?.slice(-8)}
      </div>
    </div>
  )
}

// Insert TestBlock handler
const insertTestBlock = ({ editor }: ActionHandlerArgs): boolean => {
  const testBlock = {
    id: crypto.randomUUID(),
    type: 'test/block',
    class: 'block' as const,
    children: [
      {
        id: crypto.randomUUID(),
        type: 'core/text',
        class: 'text' as const,
        children: [{ text: 'This is editable text inside the test block. Use arrow keys to navigate around this block!' }]
      }
    ]
  }

  // Insert after current selection
  if (editor.selection) {
    try {
      const [, path] = Editor.node(editor, editor.selection)
      const insertPath = [path[0] + 1]
      Transforms.insertNodes(editor, testBlock, { at: insertPath })

      // Select the new block's text content
      Transforms.select(editor, {
        anchor: { path: [...insertPath, 0, 0], offset: 0 },
        focus: { path: [...insertPath, 0, 0], offset: 0 }
      })
    } catch {
      // Fallback: insert at end
      Transforms.insertNodes(editor, testBlock)
    }
  } else {
    Transforms.insertNodes(editor, testBlock)
  }

  return false // Prevent default
}

// TestBlock Plugin
export const TestBlock: TBPluginInitFunction = () => {
  return {
    class: 'block',
    name: 'test/block',
    componentEntry: {
      class: 'block',
      component: TestBlockComponent
    },
    actions: [{
      name: 'insert-test-block',
      tool: [
        () => <span style={{ fontWeight: 'bold' }}>□</span>,
        () => (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px'
          }}>
            <span style={{ fontSize: '14px' }}>□</span>
            <span>Test Block</span>
            <kbd style={{
              fontSize: '10px',
              backgroundColor: '#f1f5f9',
              padding: '2px 4px',
              borderRadius: '2px',
              border: '1px solid #e2e8f0'
            }}>
              ⌘T
            </kbd>
          </div>
        )
      ],
      hotkey: 'mod+t',
      handler: insertTestBlock
    }]
  }
}
