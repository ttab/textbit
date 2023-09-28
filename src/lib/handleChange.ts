import { Editor, Descendant } from "slate"

export default function handleChange(editor: Editor, cb: Function | null, value: Descendant[]): Descendant[] {
    const isAstChange = editor.operations.some(
        op => 'set_selection' !== op.type
    )

    if (isAstChange && cb !== null) {
        // TODO: Future local storage safety
        // const content = JSON.stringify(value, null, '  ')
        // localStorage.setItem('content', content)
        // console.log(JSON.stringify(value, null, 2))

        // onChange(value, serializeHtml(value as Textbit[]))
        cb(value)
    }

    return value
}