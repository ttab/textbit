import React, {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useRef,
  useState
} from 'react'

import { GutterContext } from '@/components/GutterProvider/GutterProvider'
import { useFocused } from 'slate-react'

export const MenuContext = createContext<[boolean, Dispatch<SetStateAction<boolean>>]>([false, () => { }])

export const Menu = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const { offset } = useContext(GutterContext)
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const focused = useFocused()

  if (!focused || !offset?.top) {
    return <></>
  }

  return (
    <MenuContext.Provider value={[isOpen, setIsOpen]}>
      <div ref={ref} style={{ position: 'absolute', top: `${offset.top}px` }} className={className}>
        {children}
      </div>
    </MenuContext.Provider>
  )
}
