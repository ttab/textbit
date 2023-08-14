import React from 'react' // Necessary for esbuild
import './footer.css'

type FooterProps = {
    stats: {
        words: number
        characters: number
    }
}

export const Footer = ({ stats }: FooterProps) => {
    return (
        <div
            className="mimer-editor-footer text-ui text-sm fg-base bg-base-20 b-weak"
        >
            <div>
                Words: <strong>{stats.words}</strong>
            </div>
            <div>
                Characters: <strong>{stats.characters}</strong>
            </div>
        </div>
    )
}