# @ttab/textbit

## 1.9.0

### Minor Changes

- Requires slate-react 0.147.6, which brings the selection up to date before a copy or cut. Textbit
  no longer does that itself, and only steps in when the DOM selection has no Slate range, as when
  it runs out of the editor: the browser copies it, and a cut is cancelled.

### Patch Changes

- dependencies updates:
    - Updated dependency [`slate-history@^0.144.0` ↗︎](https://www.npmjs.com/package/slate-history/v/0.144.0) (from `^0.113.1`, in `dependencies`)
    - Updated dependency [`slate@^0.147.4` ↗︎](https://www.npmjs.com/package/slate/v/0.147.4) (from `^0.126.2`, in `peerDependencies`)
    - Updated dependency [`slate-react@^0.147.3` ↗︎](https://www.npmjs.com/package/slate-react/v/0.147.3) (from `^0.126.4`, in `peerDependencies`)

- dependencies updates:
    - Updated dependency [`yjs@^13.6.33` ↗︎](https://www.npmjs.com/package/yjs/v/13.6.33) (from `^13.6.26`, in `peerDependencies`)

- Copy and cut take the selection from the DOM before writing the clipboard. A copy that arrived
  before slate-react had caught up with the selection wrote nothing and left the clipboard as it
  was, or wrote the previous selection. A selection running out of the editor, as one dragged
  past a read-only editor's end, is copied by the browser, and cutting it does nothing. With whole
  blocks selected, Ctrl/Cmd+C, X and V now work with Caps Lock on. With the caret beside a block,
  Ctrl/Cmd+V with Caps Lock or Shift pastes beside it rather than into the block.

## 1.8.0

### Minor Changes

- `Textbit.Editable` takes `isSpellingAccepted`, a predicate asked about every
  spelling error the spellchecker reported. A true answer marks the word
  `data-spelling-accepted` rather than leaving it to read as a correction, so an
  implementor can say a word is fine in this document without the spellchecker
  having to agree. Textbit knows nothing about where that decision is kept or who
  made it.

  Filtering the words out of what `onSpellcheck` returns is not the same thing:
  results are kept per node until that node's text changes, so a word accepted
  while reading would keep its old mark until the paragraph is edited. This runs
  on render, so the mark changes at once.

  The spelling hints from `useContextMenuHints` carry `accepted`, so a context
  menu can offer to take an acceptance back instead of offering it again.

- Ctrl+Shift+Space inserts a non-breaking space, the same shortcut as in Word. It is a base
  plugin, so it is there whatever plugins the implementor passes. There is no hotkey on
  macOS, where Option+Space already types a non-breaking space.

### Patch Changes

- A drop carrying nothing but a browser's own drag types no longer falls through
  to the default drop handling. Skipping those types can leave the pipe empty, a
  state it could not reach before, and the pipe claimed the event only when it had
  something to do - so the drop reached slate-react's own handler, which jumps the
  caret to the drop point. The event is now claimed whenever it is routed into the
  pipe.

- `ContextMenu.Root` stays inside the viewport. It is capped to the viewport
  height and scrolls when its content is taller, and it re-places itself when its
  content changes size, so a menu that grows after opening (e.g. spelling
  suggestions loaded on demand) flips above the cursor instead of running past
  the bottom edge.

- Drops no longer warn about the drag types a browser adds for its own
  bookkeeping. Chromium attaches `chromium/x-drag-id` to any drag started in the
  page, so every in-page drop logged "Ignored dropped data/files of type
  chromium/x-drag-id" alongside handling the real payload. Those types are
  skipped when the pipe is built. A real type that finds no consumer still warns.

- A consumer that throws no longer leaves the paste promise unsettled. The paste
  path now warns and settles the same way the drop path does, so the caller's
  continuation runs. On the typing path, where every character goes through the
  same helper, that means a typed character is inserted as-is instead of being
  lost when a consumer throws.

- Guards against the @slate-yjs/core delta-reversal defect: the library reverses
  a remote text event's delta in place, so two editors bound to one shared root
  apply changes at the wrong offset. The monorepo patches the dependency and a
  test in textbit fails if the patch stops applying. @slate-yjs/core is a peer
  dependency, so consumers outside this repository need the same patch on their
  own @slate-yjs/core@1.0.2 install.

## 1.7.0

### Minor Changes

- Soft break on Shift+Enter with a visible newline chip, visualized non-breaking spaces, ephemeral pending-drop markers with an UploadMarker component, and a hook reporting selected characters and words. Paste no longer introduces excessive newlines, the drop marker positions against its offset parent, read only block elements allow text selection, and a typeless top-level element is repaired rather than left broken. The slate-react peer moves to ^0.125.1, which is disjoint from the ^0.124.0 that 1.6.0 required.

### Patch Changes

- dependencies updates:
    - Updated dependency [`slate@^0.126.2` ↗︎](https://www.npmjs.com/package/slate/v/0.126.2) (from `^0.124.1`, in `peerDependencies`)
    - Updated dependency [`slate-react@^0.126.4` ↗︎](https://www.npmjs.com/package/slate-react/v/0.126.4) (from `^0.125.1`, in `peerDependencies`)

- Moves the package's repository link on GitHub Packages to the monorepo. The manifest already names it; a publish is what makes the registry act on it, and publish permission follows that link.

## 1.7.0-beta.3

### Patch Changes

- dependencies updates:
    - Updated dependency [`slate@^0.126.2` ↗︎](https://www.npmjs.com/package/slate/v/0.126.2) (from `^0.124.1`, in `peerDependencies`)
    - Updated dependency [`slate-react@^0.126.4` ↗︎](https://www.npmjs.com/package/slate-react/v/0.126.4) (from `^0.125.1`, in `peerDependencies`)

## 1.7.0-beta.2

### Patch Changes

- Moves the package's repository link on GitHub Packages to the monorepo. The manifest already names it; a publish is what makes the registry act on it, and publish permission follows that link.

## 1.7.0-beta.0

### Minor Changes

- Soft break on Shift+Enter with a visible newline chip, visualized non-breaking spaces, ephemeral pending-drop markers with an UploadMarker component, and a hook reporting selected characters and words. Paste no longer introduces excessive newlines, the drop marker positions against its offset parent, read only block elements allow text selection, and a typeless top-level element is repaired rather than left broken. The slate-react peer moves to ^0.125.1, which is disjoint from the ^0.124.0 that 1.6.0 required.
