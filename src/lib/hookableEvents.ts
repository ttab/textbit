import { Editor, Transforms } from "slate"
import { HistoryEditor } from "slate-history"
import * as uuid from 'uuid'

import { EventHandler, DropEventFunction } from "../types"
import { Registry } from "../components/editor/registry"
import { getSelectedNodeEntries } from "./utils"


export async function handleDrop(
    editor: Editor,
    event: React.DragEvent,
    position: number,
    dropHandler: EventHandler
) {
    const fileList = (event.nativeEvent).dataTransfer?.files
    if (!fileList) {
        throw new Error('No files retrieved in drop')
    }

    return insertNode(editor, event, fileList, position, dropHandler)
}


export async function triggerFileInputEvent(
    editor: Editor,
    event: React.ChangeEvent<HTMLInputElement>
) {
    const fileList = event.target.files
    if (!fileList || !fileList.length) {
        return
    }

    const { selection } = editor
    if (!selection) return false

    const entries = getSelectedNodeEntries(editor)
    if (!entries.length) {
        return
    }

    const [node, entry] = entries[entries.length - 1]
    const fileInputHandler = Registry.events.find(dh => dh.on === 'fileinput' && dh.match && dh.match(event))
    if (!fileInputHandler) {
        return
    }

    return insertNode(editor, event, fileList, entry[0] + 1, fileInputHandler)
}


export async function insertNode(
    editor: Editor,
    event: React.DragEvent | React.ChangeEvent<HTMLInputElement>,
    fileList: FileList,
    position: number,
    eventHandler: EventHandler
) {
    if (!HistoryEditor.isHistoryEditor(editor)) {
        throw new Error('Editor is not a history editor. Unexpected weirdness is going on!')
    }

    HistoryEditor.withoutSaving(editor, () => {
        Transforms.insertNodes(
            editor,
            [{
                id: uuid.v4(),
                class: 'void',
                name: 'loader',
                properties: {},
                children: [{ text: '' }]
            }],
            {
                at: [position],
                select: false
            }
        )
    })

    try {
        const handler = (eventHandler.handler as DropEventFunction)
        const hooks = Registry.hooks.filter(hook => hook.on === 'receive' && hook.for.includes(eventHandler.name))

        if (hooks.length > 1) {
            console.warn('Drop does not support multiple hooks')
        }
        else if (hooks.length === 1) {
            const objects = await hooks[0].handler(fileList)
            const nodes = await handler(editor, event, objects)

            Transforms.insertNodes(
                editor, nodes, { at: [position], select: false }
            )
        }
        else {
            const nodes = await handler(editor, event)
            Transforms.insertNodes(
                editor, nodes, { at: [position], select: false }
            )
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
    finally {
        // @ts-ignore withoutSaving editor should be of type HistoryEditor. It is...
        HistoryEditor.withoutSaving(editor, () => {
            Transforms.removeNodes(editor, { at: [position + 1] })
        })
    }
}