import { createContext } from 'react'
import type { Path, PathRef } from 'slate'

/**
 * A pending drop/paste consumer that is currently running (`await consume()`
 * has not yet resolved or failed). Ephemeral state — never syncs to the
 * shared document.
 *
 * - `source: 'own'` marks a drop initiated by this session. Tracked locally
 *   via React state and a Slate `PathRef`.
 * - `source: 'peer'` marks a drop initiated by another peer, received via
 *   Yjs awareness. `peerId` is the Yjs client id; `peerData` is the peer's
 *   cursor data (typically `{ name, color, ... }` — whatever the consumer
 *   configured via `withCursors`).
 *
 * Peer drops vanish automatically when a peer disconnects — Yjs awareness
 * clears their state and broadcasts that clearance to everyone. No cleanup
 * code required.
 */
export interface PendingDrop {
  id: string
  source: 'own' | 'peer'
  path: Path
  kind?: string
  peerId?: number
  peerData?: unknown
}

/**
 * Write API attached to the editor by `PendingDropsProvider` so `pipes.ts`
 * (running from drop/paste event handlers without React context) can add and
 * remove entries. Also part of the context value below.
 */
export interface PendingDropsController {
  start: (opts: { pathRef: PathRef, kind?: string }) => string
  end: (id: string) => void
}

/**
 * Read + write access to the pending-drops store. Consumers (a marker
 * component) read `drops` and re-render when it changes.
 */
export interface PendingDropsContextValue extends PendingDropsController {
  drops: PendingDrop[]
}

export const PendingDropsContext = createContext<PendingDropsContextValue | null>(null)
