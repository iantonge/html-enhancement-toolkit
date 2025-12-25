import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'url'
import helmet from "helmet"
import { buildComponents } from './init-components.js'
import hbs from 'hbs'
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, 'pages')
const app = express()
const isDevelopment = app.get("env") === "development";

app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(32).toString("hex");
  next();
});
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
        "style-src": ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
        "upgrade-insecure-requests": isDevelopment ? null : [],
      },
    },
  }),
);
app.use('/css', express.static(path.join(__dirname, '../node_modules/simpledotcss')))
app.use('/het', express.static(path.join(__dirname, '../dist')))
app.use('/preact-signals', express.static(path.join(__dirname, '../node_modules/@preact/signals-core/dist')))

const { partials, configBundle } = await buildComponents();
for (const [name, html] of Object.entries(partials)) {
  console.log(name)
  hbs.handlebars.registerPartial(name, html);
}
hbs.handlebars.registerPartial('het-components-config', configBundle);

app.set('views', pagesDir)
app.set('view engine', 'hbs')

fs.readdirSync(pagesDir, { recursive: true })
  .forEach(file => {
    if (file.endsWith('.js')) {
      const routePath = '/' + file.replace('.js', '').replace('\\', '/')
      import(pathToFileURL(path.join(pagesDir, file)))
        .then(module => {
          const router = module.default
          app.use(routePath.endsWith('/index') ? routePath.slice(0, -5) : routePath, router)
        })
    }
  })

app.listen(3000, () => {
  console.log(`Test app listening on port 3000`)
})