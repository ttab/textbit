import React from 'react' // Necessary for esbuild
import { render, screen } from "@testing-library/react"
import { Editor as MimerEditor } from "../"
import 'jest'
import { Descendant } from 'slate'

describe("MimerEditor", () => {
    const initialValue: Descendant[] = [
        {
            type: 'core/heading-1',
            id: '538345e5-bacc-48f9-8ef1-a219891b60eb',
            class: 'text',
            children: [
                { text: 'This is title' }
            ]
        },
        {
            type: 'core/paragraph',
            children: [{ text: 'This is paragraph' }],
        }
    ]

    test("renders the MimerEditor component", () => {
        render(<MimerEditor value={initialValue} onChange={() => { return }} />)

        expect(screen.getByRole('textbox'))
        expect(screen.getByText('This is title'))
        expect(screen.getByText('This is paragraph'))
    })
})