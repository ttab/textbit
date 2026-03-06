import { AdjacentBlockContext, type AdjacentBlockState  } from './AdjacentBlockContext'

export function AdjacentBlockProvider({ value, children }: {
  value: AdjacentBlockState | null
  children: React.ReactNode
}) {
  return (
    <AdjacentBlockContext.Provider value={value}>
      {children}
    </AdjacentBlockContext.Provider>
  )
}
