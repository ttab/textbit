#!/usr/bin/env node

// const esbuildServe = require("esbuild-serve")

const esbuildServe = (...args) => import('esbuild-serve').then(({ default: serve }) => serve(...args));

esbuildServe(
    {
        logLevel: "info",
        entryPoints: ["./local/src/index.tsx"],
        bundle: true,
        outfile: "./local/www/build/index.js",
        sourcemap: true,
        platform: 'browser',
        target: ["esnext"],
        define: {
            'process.env.NODE_ENV': '"development"'
        },
        loader: {
            '.woff': 'dataurl',
            '.woff2': 'dataurl'
        }
    },
    {
        port: "3040",
        root: "local/www"
    }
)