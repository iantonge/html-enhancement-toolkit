import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, 'pages')
const app = express()

app.use('/css', express.static(path.join(__dirname, '../node_modules/@picocss/pico/css')))
app.use('/js', express.static(path.join(__dirname, '../src')))

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