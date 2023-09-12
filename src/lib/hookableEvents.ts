import { Editor, Transforms } from "slate"
import { HistoryEditor } from "slate-history"
import * as uuid from 'uuid'

import { Registry } from "../components/editor/registry"
import { getNodeById, getSelectedNodeEntries } from "./utils"

export function findFileConsumers(files: FileList, ignoredFiles: string[], consumerPlugins: Map<any, any>) {
    for (const file of Array.from(files)) {
        const consumers = Registry.getConsumers(Registry.plugins, file, 'drop')

        if (!consumers.length) {
            ignoredFiles.push(file.name)
            continue
        }

        for (const consumer of consumers) {
            const name = consumer.plugin.name
            const consumerPlugin = consumerPlugins.get(name) || {
                plugin: consumer.plugin,
                produces: consumer.produces,
                files: [],
                fileTypes: new Set()
            }

            // TODO: Check "produces" and see if we have components for them,
            // TODO: otherwise add file to ignoredFiles
            consumerPlugin.files.push(file)
            consumerPlugin.fileTypes.add(file.type)

            consumerPlugins.set(name, consumerPlugin)
        }
    }
}

export async function handleFileDrop(
    editor: Editor,
    position: number,
    consumers: Array<{
        consume: Function,
        files: File[],
        bulk: boolean
    }>
) {
    if (!HistoryEditor.isHistoryEditor(editor)) {
        throw new Error('Editor is not a history editor. Unexpected weirdness is going on!')
    }

    for (const { files, bulk } of consumers) {
        if (bulk) {
            insertLoader(editor, position)
        }
        else {
            files.forEach(() => insertLoader(editor, position))
        }
    }

    try {
        let offset = 0
        for (const { consume, files, bulk } of consumers) {
            const result = await consume({ data: files })

            Transforms.insertNodes(
                editor, result, { at: [position + offset], select: false }
            )

            if (bulk) {
                offset++
                removeLoader(editor, position + offset)
            }
            else {
                offset += files.length
                files.forEach(() => {
                    removeLoader(editor, position + offset)
                })
            }
        }
    }
    catch (error: any) {
        if (typeof error === 'string') {
            console.error(error)
        }
        else if (error.message) {
            console.error(error.messsage)
        }
        else {
            console.error('Unknown error on drop')
        }
    }
}

function insertLoader(editor: Editor, position: number) {
    const id = uuid.v4()

    HistoryEditor.withoutSaving(editor, () => {
        Transforms.insertNodes(
            editor,
            [{
                id,
                class: 'void',
                type: 'core/loader',
                properties: {},
                children: [{ text: '' }]
            }],
            {
                at: [position],
                select: false
            }
        )
    })

    return id
}

function removeLoader(editor: Editor, identifier: string | number) {
    let position: number

    if (typeof identifier === 'number') {
        position = identifier
    }
    else if (typeof identifier === 'string') {
        const node = getNodeById(editor, identifier)
    }
    else {
        console.warn('Could not remove loader, identifier was neither number or string')
        return
    }

    HistoryEditor.withoutSaving(editor, () => {
        Transforms.removeNodes(editor, { at: [position] })
    })
}

export async function triggerFileInputEvent(editor: Editor, event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files

    if (!files || !files.length) {
        return
    }

    const { selection } = editor
    if (!selection) return false

    const entries = getSelectedNodeEntries(editor)
    if (!entries.length) {
        return
    }
    const [node, entry] = entries[entries.length - 1]

    const consumerPlugins = new Map()
    const ignoredFiles: string[] = []
    findFileConsumers(files, ignoredFiles, consumerPlugins)

    handleFileDrop(
        editor,
        entry[0] + 1,
        Array.from(consumerPlugins.values()).map(entry => {
            return {
                consume: entry.plugin.consumer.consume,
                files: entry.files,
                bulk: entry.plugin.consumer.bulk
            }
        })
    )
}
