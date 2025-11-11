import { useEffect, useRef, useState } from 'react'
import { useSelectionBounds } from '../../hooks/useSelectionBounds'
import { useFocused } from 'slate-react'
import { MenuContext } from './MenuContext'

/**
 * Menu.root
 */
 export function Menu({ children, className, style: inStyle = {} }: {
   className?: string
   style?: React.CSSProperties
   children?: React.ReactNode
 }) {
   const [isOpen, setIsOpen] = useState(false)
   const ref = useRef<HTMLDivElement>(null)
   const bounds = useSelectionBounds()
   const isFocused = useFocused()

   // Calculate position relative to the positioned container
   const [containerOffset, setContainerOffset] = useState({ top: 0, left: 0 })
   useEffect(() => {
     if (ref.current) {
       const offsetParent = ref.current.offsetParent as HTMLElement
       if (offsetParent) {
         const rect = offsetParent.getBoundingClientRect()
         setContainerOffset({
           top: rect.top,
           left: rect.left
         })
       }
     }
   }, [bounds])

   const top = (bounds) ? bounds.box?.top ?? bounds.top : undefined
   const calculatedTop = (top !== undefined) ? top - containerOffset.top : undefined

   const style: React.CSSProperties = (calculatedTop !== undefined)
     ? {
       position: 'absolute',
       top: calculatedTop,
       zIndex: 9909,
       ...inStyle
     }
     : inStyle

   // Only show menu if this editor is focused
   if (!isFocused || !bounds) {
     return null
   }

   return (
     <MenuContext.Provider value={[isOpen, setIsOpen]}>
       <div
         ref={ref}
         className={className}
         data-state={isOpen ? 'open' : 'closed'}
         style={style}
       >
         {children}
       </div>
     </MenuContext.Provider>
   )
 }
