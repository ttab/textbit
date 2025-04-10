import type { Plugin } from '@ttab/textbit'

export const CodeBlock = ({ children }: Plugin.ComponentProps): JSX.Element => {
  return (
    <div style={{
      border: '1px solid gray',
      borderRadius: '6px',
      padding: '2px 4px'
    }}
    >
      {children}
    </div>
  )
}
