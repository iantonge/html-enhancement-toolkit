import esbuild from 'esbuild';

const common = {
  entryPoints: ['src/het.js'],
  bundle: true,
};

const iife = {
  ...common,
  sourcemap: true,
  format: 'iife',
  globalName: 'HET',
}

await Promise.all([
  esbuild.build({
    ...common,
    format: 'esm',
    outfile: 'dist/het.js',
  }),
  esbuild.build({
    ...iife,
    outfile: 'dist/het.iife.js',
  }),
  esbuild.build({
    ...iife,
    minify: true,
    outfile: 'dist/het.iife.min.js',
  }),
]);
