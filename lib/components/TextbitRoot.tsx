import type { PlaceholdersVisibility } from '../contexts/TextbitContext'
import { TextbitProvider } from '../contexts/TextbitProvider'
import { PluginRegistryProvider } from '../contexts/PluginRegistry/PluginRegistryProvider'
import type { PluginDefinition, SpellingError } from '../types'
import type { Awareness } from 'y-protocols/awareness'

import { basePlugins, StandardPlugins } from './core'
import { ContextMenuHintsProvider } from './ContextMenu/ContextMenuHintsProvider'
import { TextbitSelectionBoundsProvider } from '../contexts/SelectionBoundsProvider'
import { Descendant } from 'slate'
import * as Y from 'yjs'
import { SlateContainer } from './SlateContainer'

interface TextbitRootBaseProps {
  children: React.ReactNode
  verbose?: boolean
  debounce?: number
  readOnly?: boolean
  onSpellcheck?: (texts: { lang: string, text: string }[]) => Promise<Omit<SpellingError, 'id'>[][]>
  spellcheckDebounce?: number
  placeholders?: PlaceholdersVisibility
  plugins?: PluginDefinition[]
  className?: string
  style?: React.CSSProperties
}

interface TextbitRootStringProps extends TextbitRootBaseProps {
  value: string
  onChange?: (value: string) => void
}
interface TextbitRootDefaultProps extends TextbitRootBaseProps {
  value: Descendant[]
  onChange?: (value: Descendant[]) => void
}
interface TextbitRootCollaborationProps extends TextbitRootBaseProps {
  value: Y.XmlText
  awareness?: Awareness
  cursor?: {
    stateField?: string
    dataField?: string
    autoSend?: boolean
    data: Record<string, unknown>
  }
  onChange?: undefined
}
type TextbitRootProps = TextbitRootStringProps | TextbitRootDefaultProps | TextbitRootCollaborationProps

export function TextbitRoot(props: TextbitRootStringProps): React.ReactElement
export function TextbitRoot(props: TextbitRootDefaultProps): React.ReactElement
export function TextbitRoot(props: TextbitRootCollaborationProps): React.ReactElement
export function TextbitRoot(props: TextbitRootProps) {
  const {
    children,
    verbose,
    readOnly,
    debounce,
    spellcheckDebounce,
    placeholders,
    plugins,
    className,
    style: inStyle
  } = props

  const style: React.CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    ...inStyle,
  }

  return (
    <div className={className} style={style}>
      <TextbitSelectionBoundsProvider>
        <TextbitProvider
          verbose={!!verbose}
          readOnly={readOnly}
          collaborative={props.value instanceof Y.XmlText && !readOnly}
          debounce={debounce}
          spellcheckDebounce={spellcheckDebounce}
          placeholders={placeholders}
        >
          <PluginRegistryProvider
            verbose={!!verbose}
            plugins={[
              ...basePlugins.map((p) => p()),
              ...Array.isArray(plugins) && plugins.length ? plugins : StandardPlugins.map((sp) => sp())
            ]}
          >
            {/* @ts-expect-error - Props are correctly typed at the public interface level */}
            <SlateContainer {...props}>
              <ContextMenuHintsProvider>
                {children}
              </ContextMenuHintsProvider>
            </SlateContainer>
          </PluginRegistryProvider>
        </TextbitProvider>
      </TextbitSelectionBoundsProvider>
    </div>
  )
}
