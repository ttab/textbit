import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Editor, Path, PathRef } from 'slate'
import { Editor as SlateEditor } from 'slate'
import { useSlate } from 'slate-react'
import * as Y from 'yjs'
import {
  CursorEditor,
  slatePointToRelativePosition,
  relativePositionToSlatePoint
} from '@slate-yjs/core'
import { PendingDropsContext, type PendingDrop, type PendingDropsContextValue } from './PendingDropsContext'

interface Entry {
  pathRef: PathRef
  kind?: string
}

// Serialised shape broadcast in Yjs awareness under the `pendingDrops` field.
// RelativePosition bytes are transmitted as a plain number[] so awareness (which
// is JSON-syncing) can carry them without special encoding on the transport.
interface WirePendingDrop {
  id: string
  relPos: number[]
  kind?: string
}

// Peer state cached after each awareness change. Path is decoded lazily in the
// context value's useMemo so it re-resolves as the document evolves — a peer's
// RelativePosition may map to a different local path after a merge.
interface PeerEntry {
  peerId: number
  raw: WirePendingDrop
  peerData: unknown
}

/**
 * Owns the pending-drops store. Two responsibilities:
 *
 * 1. **Local state**: track drops initiated by this session via React state
 *    and a Slate `PathRef`. Attach a start/end API to the editor so `pipes.ts`
 *    (which runs from drop/paste event handlers without React context) can
 *    manage them.
 *
 * 2. **Peer visibility** (when the editor is a `CursorEditor`): mirror local
 *    drops to Yjs awareness so other peers can render an intent marker at the
 *    same position, and subscribe to peer awareness changes to surface their
 *    pending drops. Positions cross the wire as `Y.RelativePosition` so they
 *    stay stable across concurrent edits by any peer.
 *
 * Awareness clears automatically on peer disconnect (WebSocket drop, tab
 * close), so peer markers vanish for everyone the moment their owner is gone —
 * zero cleanup code required. This is the whole reason the loader moved off
 * the shared document.
 */
export function PendingDropsProvider({ editor: editorProp, children }: {
  editor: Editor
  children: ReactNode
}) {
  // Subscribe to editor changes via slate-react's own store instead of
  // monkeypatching editor.onChange. `useSlate` re-renders the Provider on
  // every op, which lets `drops` recompute from live PathRef.current values.
  // It also returns the current editor; we prefer it over the prop so the
  // Provider stays reactive if the parent swaps the editor identity.
  const editor = useSlate()
  // Keep a safety net in case `useSlate` returns something unexpected (e.g.
  // during a mid-flight editor swap). The prop is the source of truth for
  // pipeline wiring.
  const activeEditor = editor ?? editorProp

  const [entries, setEntries] = useState<Map<string, Entry>>(() => new Map())

  // Snapshot ref so `end` can read the current entries without listing every
  // render in its useCallback deps.
  const entriesRef = useRef(entries)
  entriesRef.current = entries

  const start = useCallback((opts: { pathRef: PathRef, kind?: string }) => {
    const id = crypto.randomUUID()
    setEntries((prev) => {
      const next = new Map(prev)
      next.set(id, { pathRef: opts.pathRef, kind: opts.kind })
      return next
    })
    return id
  }, [])

  const end = useCallback((id: string) => {
    setEntries((prev) => {
      const entry = prev.get(id)
      if (!entry) return prev
      entry.pathRef.unref()
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  // Attach a stable-identity API to the editor so pipes.ts can call it.
  // useLayoutEffect runs synchronously after commit so the API is available
  // before any user event (drop/paste) can fire.
  useLayoutEffect(() => {
    activeEditor.pendingDrops = { start, end }
    return () => {
      delete activeEditor.pendingDrops
    }
  }, [activeEditor, start, end])

  // Release any lingering PathRefs on Provider unmount. In practice the pipe
  // machinery calls `end` on every exit path so this is defensive.
  useEffect(() => {
    return () => {
      for (const entry of entriesRef.current.values()) {
        entry.pathRef.unref()
      }
    }
  }, [])

  // ---- Awareness broadcast: local → peers ----------------------------------
  //
  // Whenever our local entries change, serialise them as WirePendingDrop
  // objects and set them on our awareness state under `pendingDrops`. Yjs
  // broadcasts to every connected peer. Skipped entirely when the editor
  // isn't a CursorEditor (non-collaborative mode).
  useEffect(() => {
    if (!CursorEditor.isCursorEditor(activeEditor)) return
    const awareness = activeEditor.awareness
    const sharedRoot = activeEditor.sharedRoot

    const outgoing: WirePendingDrop[] = []
    for (const [id, entry] of entries) {
      const path = entry.pathRef.current
      if (!path) continue
      try {
        const point = SlateEditor.start(activeEditor, path)
        const relPos = slatePointToRelativePosition(sharedRoot, activeEditor, point)
        outgoing.push({
          id,
          relPos: Array.from(Y.encodeRelativePosition(relPos)),
          kind: entry.kind
        })
      } catch {
        // Point may be transiently unresolvable during a rebase — skip and
        // let the next tick re-broadcast a valid position.
      }
    }

    // `null` (rather than []) leaves the field cleared when we have nothing to
    // broadcast, keeping the awareness footprint minimal.
    awareness.setLocalStateField('pendingDrops', outgoing.length ? outgoing : null)
  }, [activeEditor, entries])

  // Clear our field on Provider unmount so peers see it vanish immediately —
  // otherwise the state hangs around until the underlying awareness times out.
  useEffect(() => {
    if (!CursorEditor.isCursorEditor(activeEditor)) return
    const awareness = activeEditor.awareness
    return () => {
      awareness.setLocalStateField('pendingDrops', null)
    }
  }, [activeEditor])

  // ---- Awareness subscribe: peers → local ---------------------------------
  //
  // Only recompute peerEntries when a peer's `pendingDrops` field actually
  // changed. Awareness `change` fires on every cursor tick, so an unfiltered
  // subscription would recompute continuously. We keep a JSON snapshot of
  // the last-seen field per client and short-circuit when nothing meaningful
  // moved.
  const [peerEntries, setPeerEntries] = useState<PeerEntry[]>([])
  useEffect(() => {
    if (!CursorEditor.isCursorEditor(activeEditor)) return
    const awareness = activeEditor.awareness
    const localClientId = awareness.clientID

    // Client id → JSON-encoded `pendingDrops` field last observed.
    const lastSeen = new Map<number, string>()

    const rebuild = () => {
      const collected: PeerEntry[] = []
      const nextSeen = new Map<number, string>()
      const states = awareness.getStates() as Map<number, Record<string, unknown>>
      for (const [clientId, state] of states) {
        if (clientId === localClientId) continue
        const drops = state.pendingDrops
        if (!Array.isArray(drops)) continue
        nextSeen.set(clientId, JSON.stringify(drops))
        for (const raw of drops as WirePendingDrop[]) {
          if (!raw || typeof raw.id !== 'string' || !Array.isArray(raw.relPos)) continue
          collected.push({ peerId: clientId, raw, peerData: state.data })
        }
      }
      lastSeen.clear()
      for (const [k, v] of nextSeen) lastSeen.set(k, v)
      setPeerEntries(collected)
    }

    const onChange = (
      { added, updated, removed }: { added: number[], updated: number[], removed: number[] }
    ) => {
      // Removed peers vanish — dirty if any of them had pending drops.
      let dirty = removed.some((id) => lastSeen.has(id))

      if (!dirty) {
        const states = awareness.getStates() as Map<number, Record<string, unknown>>
        for (const id of added.concat(updated)) {
          if (id === localClientId) continue
          const state = states.get(id)
          const drops = state?.pendingDrops
          const key = Array.isArray(drops) ? JSON.stringify(drops) : ''
          if (key !== (lastSeen.get(id) ?? '')) {
            dirty = true
            break
          }
        }
      }

      if (dirty) rebuild()
    }

    rebuild()
    awareness.on('change', onChange)
    return () => {
      awareness.off('change', onChange)
    }
  }, [activeEditor])

  // Cache for decoded RelativePosition objects, keyed by the raw bytes joined
  // as a string. Decoding is pure per bytes-key, so this saves work across
  // re-renders and doesn't need invalidation. Peer path resolution still runs
  // every render because positions can drift on concurrent ops.
  const relPosCache = useRef(new Map<string, Y.RelativePosition>())
  const getRelPos = useCallback((raw: number[]): Y.RelativePosition => {
    const key = raw.join(',')
    let cached = relPosCache.current.get(key)
    if (!cached) {
      cached = Y.decodeRelativePosition(Uint8Array.from(raw))
      relPosCache.current.set(key, cached)
    }
    return cached
  }, [])

  // Compute `drops` inline on every render. `useSlate` above already ensures
  // we re-render on every editor op, so PathRef.current and peer position
  // resolutions are always current. A useMemo cache would need a
  // per-op invalidation token, which slate-react doesn't expose cheaply;
  // recomputing a short list is cheaper than tracking that token.
  const drops: PendingDrop[] = []

  for (const [id, entry] of entries) {
    const path = entry.pathRef.current
    if (!path) continue
    drops.push({ id, source: 'own', path, kind: entry.kind })
  }

  if (CursorEditor.isCursorEditor(activeEditor) && peerEntries.length) {
    const sharedRoot = activeEditor.sharedRoot
    for (const { peerId, raw, peerData } of peerEntries) {
      try {
        const relPos = getRelPos(raw.relPos)
        const point = relativePositionToSlatePoint(sharedRoot, activeEditor, relPos)
        if (!point) continue
        drops.push({
          id: `${peerId}:${raw.id}`,
          source: 'peer',
          path: point.path.slice(0, 1) as Path,
          kind: raw.kind,
          peerId,
          peerData
        })
      } catch {
        // Malformed / decode failure — skip this one.
      }
    }
  }

  const value: PendingDropsContextValue = { drops, start, end }

  return (
    <PendingDropsContext.Provider value={value}>
      {children}
    </PendingDropsContext.Provider>
  )
}
