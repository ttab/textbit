import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useContext,
  useRef,
  useState
} from 'react'
import { GutterContext } from '../../components/GutterProvider/GutterContext'
import { useTextbitSelectionBoundsState } from '../../hooks/useSelectionBounds'

// FIXME: Refactor out
export const MenuContext = createContext<[boolean, Dispatch<SetStateAction<boolean>>]>([false, () => { }])

/**
 * Menu.root
 */
export function Menu({ children, className }: {
  className?: string
  children?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const bounds = useTextbitSelectionBoundsState()
  const { gutterBox } = useContext(GutterContext)

  return (
    <MenuContext.Provider value={[isOpen, setIsOpen]}>
      {!!gutterBox && !!bounds && (
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
      )}
    </MenuContext.Provider>
  )
}
