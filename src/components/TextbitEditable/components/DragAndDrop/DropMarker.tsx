import React from 'react' // Necessary for esbuild
import { forwardRef } from "react"

const DropMarker = forwardRef((props, ref: React.Ref<HTMLDivElement>) => (
  <div
    ref={ref}
    className="editor-drop-marker"
    style={{ pointerEvents: 'none' }}
  />
))

export default DropMarker
