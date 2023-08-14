import React, { useState, useEffect, useMemo } from 'react'
import './themeSwitcher.css'

export function ThemeSwitcher(): JSX.Element {
    const [theme, setTheme] = useState(localStorage.getItem('theme') ? localStorage.getItem('theme') : 'light')

    useEffect(() => { toggleTheme(theme || 'light') }, [theme])

    return <div className="theme-switch-container">

        <div className="theme-switch-wrapper">
            <label
                onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark')
                }}
                className={`theme-switch`}
                htmlFor="checkbox2"
            >
                <input
                    type="checkbox2"
                    onChange={() => { }}
                    checked={theme === 'dark' ? true : false}
                />
                <div className={`slider round ${theme === 'dark' ? 'checked' : ''}`}></div>
            </label>
        </div>
    </div >
}


function toggleTheme(theme: string) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
}

// function setColorScheme() {
//     const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
//     const isLightMode = window.matchMedia("(prefers-color-scheme: light)").matches
//     const isNotSpecified = window.matchMedia("(prefers-color-scheme: no-preference)").matches

//     window.matchMedia("(prefers-color-scheme: dark)").addListener(e => e.matches && activateDarkMode())
//     window.matchMedia("(prefers-color-scheme: light)").addListener(e => e.matches && activateLightMode())

//     if (isDarkMode) activateDarkMode()
//     if (isLightMode) activateLightMode()
// }