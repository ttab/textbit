import { BlockSelectionContext, type BlockSelectionState } from './BlockSelectionContext'

export function BlockSelectionProvider({ value, children }: {
  value: BlockSelectionState | null
  children: React.ReactNode
}) {
  return (
    <BlockSelectionContext.Provider value={value}>
      {children}
    </BlockSelectionContext.Provider>
  )
}
