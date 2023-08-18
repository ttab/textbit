import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Editor as MimerEditor } from '../../src'
import { ThemeSwitcher } from './themeSwitcher'
import { Descendant } from 'slate'

const initialValue: Descendant[] = [
    {
        type: 'core/heading-1',
        id: '538345e5-bacc-48f9-8ef1-a219891b60eb',
        class: 'text',
        children: [
            { text: 'Better music?' }
        ]
    },
    {
        type: 'core/preamble',
        id: '538345e5-bacc-48f9-9ed2-b219892b51dc',
        class: 'text',
        children: [
            { text: 'It is one of those days when better music makes all the difference in the world. At least to me, my inner and imaginary friend.' }
        ]
    },
    {
        type: 'core/dateline',
        id: '538345e5-cadd-4558-9ed2-a219892b51dc',
        class: 'text',
        children: [
            { text: 'Kalmar' }
        ]
    },
    {
        type: 'core/paragraph',
        id: '538345e5-bacc-48f9-8ef0-1219891b60ef',
        class: 'text',
        children: [
            { text: 'An example paragraph that contains text that is a wee bit ' },
            { text: 'stronger', formats: ['bold'] },
            { text: ' than normal but also text that is somewhat ' },
            { text: 'emphasized', formats: ['italic'] },
            { text: ' compared to the normal styled text found elsewhere in the document.' },
        ],
    },
    {
        type: 'core/blockquote',
        class: 'textblock',
        id: '538345e5-bacc-48f9-8ef1-1214443a32da',
        children: [
            {
                type: 'core/blockquote/body',
                children: [
                    { text: 'Just a regular paragraph that contains some nonsensical writing' }
                ]
            },
            {
                type: 'core/blockquote/caption',
                children: [
                    { text: 'Mr Smith' }
                ]
            }
        ]
    },
    {
        type: 'core/paragraph',
        class: 'text',
        id: '538345e5-bacc-48f9-8ef1-1215892b61ed',
        children: [
            { text: 'This, here now is just a regular paragraph that contains some nonsensical writing written by me.' },
        ],
    },
    {
        type: 'core/paragraph',
        id: '538343b5-badd-48f9-8ef0-1219891b60ef',
        class: 'text',
        children: [
            { text: 'An example paragraph that contains text that is a wee bit ' },
            { text: 'stronger', formats: ['bold'] },
            { text: ' than normal but also text that is somewhat ' },
            { text: 'emphasized', formats: ['italic'] },
            { text: ' compared to the normal styled text found elsewhere in the document.' },
        ],
    }
]

function App() {
    const [value, setValue] = useState<Descendant[]>(initialValue)

    return (
        <div style={{ position: 'relative', height: '1200px' }}>
            <ThemeSwitcher />

            <MimerEditor

                value={initialValue}
                onChange={value => {
                    setValue(value)
                }}
                hooks={[{
                    on: 'drop',   // Event type
                    for: ['image'], // Handling plugin
                    handler: (e) => {
                        return new Promise((resolve, reject) => {
                            // Upload and fetch data
                            resolve([
                                {
                                    type: 'image/png',
                                    src: 'https://www.evenemang.se/_next/image?url=https%3A%2F%2Fs3.eu-central-1.amazonaws.com%2Fse.evse.image%2F0bdf0999-5003-52ff-9bb3-ab8b73f85252-1280-640.jpg&w=3840&q=75',
                                    title: 'name',
                                    size: '1000',
                                    width: 640,
                                    height: 1280
                                }
                            ])
                        })
                    }

                }]}
            />
        </div>
    )
}

const container = document.getElementById('app')
const root = createRoot(container!)
root.render(<App />)
