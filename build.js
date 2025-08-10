import esbuild from 'esbuild';

const common = {
  entryPoints: ['src/toolkit.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: 'browser',
  target: ['es2022'],
  keepNames: true,
};

await Promise.all([
  esbuild.build({ 
    ...common,
    format: 'esm', 
    outfile: 'dist/toolkit.js'
  }),
  esbuild.build({
    ...common,
    format: 'iife',
    outfile: 'dist/toolkit.iife.js',
    globalName: 'Het'
  }),
]);
