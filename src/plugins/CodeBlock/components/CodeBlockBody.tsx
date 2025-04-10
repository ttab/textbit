import type { Plugin } from '@ttab/textbit'

// TODO: Use https://prismjs.com/ to display code
export const CodeBlockBody = ({ children }: Plugin.ComponentProps): JSX.Element => {
  return (
    <code style={{
      display: 'block',
      whiteSpace: 'pre',
      padding: '4px',
      fontSize: '80%',
      backgroundColor: '#eee',
      fontFamily: 'monospace'
    }}
    >
      {children}
    </code>
  )
}
