import type { Plugin } from '@ttab/textbit'

export const CodeBlockTitle = ({ children }: Plugin.ComponentProps): JSX.Element => {
  return (
    <div
      draggable={false}
      style={{
        border: '1px solid #aaa',
        backgroundColor: '#eee',
        fontFamily: 'sans-serif',
        padding: '2px 4px'
      }}
    >
      {children}
    </div>
  )
}
