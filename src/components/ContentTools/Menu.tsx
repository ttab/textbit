import React, {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import { GutterContext } from '@/components/GutterProvider/GutterProvider'
import { useFocused } from 'slate-react'

export const MenuContext = createContext<[boolean, Dispatch<SetStateAction<boolean>>]>([false, () => { }])

/**
 * Menu.root
 */
export const Menu = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const { offsetY, box } = useContext(GutterContext)
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const focused = useFocused()

  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false)
      }
    }

    addEventListener('scroll', handleScroll, {
      passive: true,
      capture: true
    })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [isOpen])

  if (!focused || !offsetY || !box?.top) {
    return <></>
  }

  // Related editor element offset minus gutter top
  const left = box.left
  const top = offsetY - box.top - window.scrollY

  return (
    <MenuContext.Provider value={[isOpen, setIsOpen]}>
      {
        <div
          ref={ref}
          style={{
            position: 'absolute',
            left: `${left}px`,
            top: `${top}px`
          }}
          className={className}
          data-state={isOpen ? 'open' : 'closed'}
        >
          {children}
        </div>
      }
    </MenuContext.Provider>
  )
}
