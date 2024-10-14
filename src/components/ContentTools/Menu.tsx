import React, {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import { createPortal } from 'react-dom'

import { GutterContext } from '@/components/GutterProvider/GutterProvider'
import { useFocused } from 'slate-react'

export const MenuContext = createContext<[boolean, Dispatch<SetStateAction<boolean>>]>([false, () => { }])

export const Menu = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const { offsetY, box } = useContext(GutterContext)
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const focused = useFocused()

  if (!focused || !offsetY || !box?.top) {
    return <></>
  }

  const top = offsetY + window.scrollY
  const left = box.left + window.scrollX

  return (
    <MenuContext.Provider value={[isOpen, setIsOpen]}>
      {createPortal(
        <div ref={ref} style={{ position: 'absolute', top: `${top}px`, 'left': `${left}px` }} className={className} data-state={isOpen ? 'open' : 'closed'}>
          {children}
        </div>,
        document.body
      )}
    </MenuContext.Provider>
  )
}
