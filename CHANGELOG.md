# @ttab/textbit

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
