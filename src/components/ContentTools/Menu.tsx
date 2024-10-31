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
import { useTextbitSelectionBoundsState } from '../TextbitRoot'

export const MenuContext = createContext<[boolean, Dispatch<SetStateAction<boolean>>]>([false, () => { }])

/**
 * Menu.root
 */
export const Menu = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const bounds = useTextbitSelectionBoundsState()
  const { gutterBox } = useContext(GutterContext)

  return (
    <MenuContext.Provider value={[isOpen, setIsOpen]}>
      {!!gutterBox && !!bounds &&
        <div
          ref={ref}
          className={className}
          data-state={isOpen ? 'open' : 'closed'}
          style={{
            position: 'absolute',
            top: `${bounds.top - gutterBox.top - window.scrollY}px`
          }}
        >
          {children}
        </div>
      }
    </MenuContext.Provider>
  )
}
