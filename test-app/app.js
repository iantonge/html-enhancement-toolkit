import express from 'express'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'url'
import helmet from "helmet"
import { buildComponents } from './init-components.js'
import hbs from 'hbs'
import crypto from 'node:crypto';
import glob from 'fast-glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, 'pages')
const routesDir = path.join(__dirname, 'routes')
const app = express()
const isDevelopment = app.get("env") === "development";

app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const providedNonce = req.get("X-HET-Nonce");
  res.locals.cspNonce =
    providedNonce && providedNonce.trim().length
      ? providedNonce
      : crypto.randomBytes(32).toString("hex");
  next();
});
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
        "style-src": ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
        "trusted-types": ["het", "dompurify"],
        "require-trusted-types-for": ["'script'"],
        "upgrade-insecure-requests": isDevelopment ? null : [],
      },
    },
  }),
);
app.use('/css', express.static(path.join(__dirname, '../node_modules/bootstrap/dist/css')))
app.use('/js/het', express.static(path.join(__dirname, '../dist')))
app.use('/js/idiomorph', express.static(path.join(__dirname, '../node_modules/idiomorph/dist')))
app.use('/js/preact-signals', express.static(path.join(__dirname, '../node_modules/@preact/signals-core/dist')))
app.use('/js/trusted-types', express.static(path.join(__dirname, '../node_modules/trusted-types/dist/es6')))
app.use('/js/dompurify', express.static(path.join(__dirname, '../node_modules/dompurify/dist')))

const normalizeRoutePath = (routePath) => routePath.startsWith('/') ? routePath : `/${routePath}`;

const routeFiles = await glob('**/*.js', { cwd: routesDir, absolute: true });
for (const routeFile of routeFiles) {
  const { path: routePath, router } = await import(pathToFileURL(routeFile));
  if (!router) throw new Error(`Route module missing exported "router": ${routeFile}`);
  if (!routePath) throw new Error(`Route module missing exported "path": ${routeFile}`);
  app.use(normalizeRoutePath(routePath), router);
}

const { partials, configBundle } = await buildComponents();
for (const [name, html] of Object.entries(partials)) {
  hbs.handlebars.registerPartial(name, html);
}
hbs.handlebars.registerPartial('het-components-config', configBundle);

app.set('views', pagesDir)
app.set('view engine', 'hbs')

app.listen(3000, () => {
  console.log(`Test app listening on port 3000`)
})
