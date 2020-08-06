import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from '@rollup/plugin-babel';

export default {
  input: 'index.js',
  output: {
    file: 'index.build.js',
    format: 'umd',
    name: 'Progress',
  },
  plugins: [
    resolve(),
    commonjs(),
    babel({
      exclude: 'node_modules/**', // 只编译我们的源代码
      babelHelpers: 'bundled',
    }),
  ],
};
