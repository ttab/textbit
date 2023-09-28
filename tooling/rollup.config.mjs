import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import packageJson from "../package.json" assert { type: "json" }

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: packageJson.main,
                format: "cjs",
                sourcemap: true,
            },
            {
                file: packageJson.module,
                format: "esm",
                sourcemap: true,
            },
        ],
        plugins: [
            peerDepsExternal(),
            resolve(),
            commonjs(),
            typescript({ tsconfig: "./tsconfig.build.json" }),
            terser(),
            postcss({
                extract: true,
                minimize: false
            })
        ],
        onwarn: function (warning, handler) {
            // Ignore "<this> is not defined" warning (from react-icons et al)
            if (warning.code !== 'THIS_IS_UNDEFINED') {
                handler(warning)
            }
        }
    },
    {
        input: "dist/esm/types/index.d.ts",
        output: [{ file: "dist/index.d.ts", format: "esm" }],
        external: [/\.(sass|scss|css)$/] /* ignore style files */,
        plugins: [dts()]
    },
]