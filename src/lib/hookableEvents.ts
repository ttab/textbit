import { Editor } from "slate"
import { getSelectedNodeEntries } from "./utils"

export async function triggerFileInputEvent(editor: Editor, event: React.ChangeEvent<HTMLInputElement>) {
    // const files = event.target.files

    // if (!files || !files.length) {
    //     return
    // }

    // const { selection } = editor
    // if (!selection) return false

    // const entries = getSelectedNodeEntries(editor)
    // if (!entries.length) {
    //     return
    // }
    // const [node, entry] = entries[entries.length - 1]

    // const consumerPlugins = new Map()
    // const ignoredFiles: string[] = []
    // findFileConsumers(files, consumerPlugins, ignoredFiles)

    // handleFileDrop(
    //     editor,
    //     entry[0] + 1,
    //     Array.from(consumerPlugins.values()).map(entry => {
    //         return {
    //             consume: entry.plugin.consumer.consume,
    //             files: entry.files,
    //             bulk: entry.plugin.consumer.bulk
    //         }
    //     })
    // )
}
