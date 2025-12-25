import esbuild from 'esbuild';

const common = {
  entryPoints: ['src/toolkit.js'],
  bundle: true,
  sourcemap: true,
  platform: 'browser',
  target: ['es2022'],
  keepNames: true,
  external: ['@preact/signals-core']
};

await Promise.all([
  esbuild.build({ 
    ...common,
    minify: false,
    format: 'esm', 
    outfile: 'dist/toolkit.js'
  }),
  esbuild.build({ 
    ...common,
    minify: true,
    format: 'esm', 
    outfile: 'dist/toolkit.min.js'
  })
]);
