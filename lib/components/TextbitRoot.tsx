import type { PlaceholdersVisibility } from '../contexts/TextbitContext'
import { TextbitProvider } from '../contexts/TextbitProvider'
import { PluginRegistryProvider } from '../contexts/PluginRegistry/PluginRegistryProvider'
import type { PluginDefinition, SpellingError } from '../types'
import { Awareness } from 'y-protocols/awareness'

import { basePlugins, StandardPlugins } from './core'
import { ContextMenuHintsProvider } from './ContextMenu/ContextMenuHintsProvider'
import { SelectionBoundsProvider } from '../contexts/SelectionBoundsProvider'
import { Descendant } from 'slate'
import * as Y from 'yjs'
import { SlateContainer } from './SlateContainer'
import { GutterProvider } from './GutterProvider/GutterProvider'

interface TextbitRootBaseProps {
  children: React.ReactNode
  verbose?: boolean
  debounce?: number
  readOnly?: boolean
  onSpellcheck?: (texts: { lang: string, text: string }[]) => Promise<Omit<SpellingError, 'id'>[][]>
  spellcheckDebounce?: number
  placeholders?: PlaceholdersVisibility
  placeholder?: string
  plugins?: PluginDefinition[]
  className?: string
  style?: React.CSSProperties
  dir?: 'ltr' | 'rtl'
  lang?: string
}

interface TextbitRootStringProps extends TextbitRootBaseProps {
  value: string
  onChange?: (value: string) => void
}
interface TextbitRootDefaultProps extends TextbitRootBaseProps {
  value: Descendant[]
  onChange?: (value: Descendant[]) => void
}
interface TextbitRootYjsProps extends TextbitRootBaseProps {
  value: Y.XmlText
  onChange?: undefined
}
interface TextbitRootCollaborationProps extends TextbitRootYjsProps {
  awareness?: Awareness | null
  cursor?: {
    stateField?: string
    dataField?: string
    autoSend?: boolean
    data: Record<string, unknown>
  }
}
type TextbitRootProps = TextbitRootStringProps | TextbitRootDefaultProps | TextbitRootYjsProps | TextbitRootCollaborationProps

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
    style: inStyle,
    placeholder
  } = props

  const style: React.CSSProperties = {
    boxSizing: 'border-box',
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    ...inStyle,
  }

  return (
    <div className={className} style={style}>
      <TextbitProvider
        verbose={!!verbose}
        readOnly={readOnly}
        collaborative={!readOnly && isTextbitRootCollaborationProps(props)}
        debounce={debounce}
        spellcheckDebounce={spellcheckDebounce}
        placeholders={placeholders}
        placeholder={placeholder}
        dir={props.dir}
        lang={props.lang}
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
            <SelectionBoundsProvider>
              <ContextMenuHintsProvider>
                <GutterProvider>
                  {children}
                </GutterProvider>
              </ContextMenuHintsProvider>
            </SelectionBoundsProvider>
          </SlateContainer>
        </PluginRegistryProvider>
      </TextbitProvider>
    </div>
  )
}

function isTextbitRootCollaborationProps(
  props: TextbitRootProps
): props is TextbitRootCollaborationProps {
  return props.value instanceof Y.XmlText && 'awareness' in props
}
