import React from 'react' // Necessary for esbuild

import { MimerPlugin, RenderElementFunction } from '../../../types'

import './style.css'

const render: RenderElementFunction = ({ children }) => {
    const style = {
        minHeight: '10rem'
    }

    return (
        <div className="appear-loading" style={style}>
            <div>
                <div className="dot dot-1"></div>
                <div className="dot dot-2"></div>
                <div className="dot dot-3"></div>
            </div>
            <svg style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg" version="1.1">
                <defs>
                    <filter id="goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                    </filter>
                </defs>
            </svg>
        </div>
    )
    // return <div style={style}>
    //     <LoaderElement />
    //     {children}
    // </div>
}

export const Loader: MimerPlugin = {
    class: 'void',
    name: 'core/loader',
    component: {
        render
    }
}