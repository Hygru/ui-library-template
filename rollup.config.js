import fs from 'fs'
import path from 'path'
import clear from 'rollup-plugin-clear'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'
import styles from 'rollup-plugin-styles'
import image from '@rollup/plugin-image'
import progress from 'rollup-plugin-progress'

const entryFile = 'src/index.ts'
const componentDir = 'src/components'
const cModuleNames = fs.readdirSync(path.resolve(componentDir))
const componentEntryFiles = cModuleNames
    .map((name) => (/^[A-Z]\w*/.test(name) ? `${componentDir}/${name}/index.ts` : undefined))
    .filter((n) => !!n)

export default {
    input: [entryFile, ...componentEntryFiles],
    output: [
        {
            dir: 'lib/esm',
            format: 'esm',
            preserveModules: true,
            preserveModulesRoot: 'src',
            exports: 'named',
            assetFileNames: ({ name }) => {
                // 抽离后的样式文件会作为 asset 输出，这里可以配置一下 样式文件的输出位置（为 babel-plugin-import 做准备）
                const { ext, dir, base } = path.parse(name)
                if (ext !== '.css') return '[name].[ext]'
                // 规范 style 的输出格式
                return path.join(dir, 'style', base)
            }
        },
        {
            dir: 'lib/cjs',
            format: 'cjs',
            preserveModules: true,
            preserveModulesRoot: 'src',
            exports: 'named',
            assetFileNames: ({ name }) => {
                // 抽离后的样式文件会作为 asset 输出，这里可以配置一下 样式文件的输出位置（为 babel-plugin-import 做准备）
                const { ext, dir, base } = path.parse(name)
                if (ext !== '.css') return '[name].[ext]'
                // 规范 style 的输出格式
                return path.join(dir, 'style', base)
            }
        }
    ],
    external: ['react', 'react-dom'],
    plugins: [
        progress(),
        clear({ targets: ['lib'] }),
        styles({
            mode: 'extract',
            sass: { javascriptEnabled: true },
            extensions: ['.scss', '.css'],
            use: ['sass'],
            url: { inline: true }, // inline 表示 资源会被打包在 css 中
            sourceMap: true, // 必须开启，否则 rollup-plugin-styles 会有 bug
            onExtract(data) {
                // 以下操作用来确保每个组件目录只输出一个 index.css，实际上每一个 子级组件都会输出样式文件，index.css 会包含所有子一个组件的样式
                const { name } = data
                const { base } = path.parse(name)
                if (base !== 'index.css') return false
                return true
            }
        }),
        image(),
        typescript(),
        resolve(),
        commonjs(),
        babel({
            runtimeHelpers: true,
            exclude: 'node_modules/**',
            externalHelpers: true
        }),
        terser()
    ]
}
