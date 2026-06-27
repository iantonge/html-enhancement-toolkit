import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const app = express();
const port = process.env.PORT || 3001;

app.set('views', path.join(__dirname, 'pages'));
app.set('view engine', 'hbs');

app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((request, response, next) => {
  response.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'self'"],
        'base-uri': ["'self'"],
        'connect-src': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'self'"],
        'frame-src': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'object-src': ["'none'"],
        'script-src': [
          "'self'",
          (request, response) => `'nonce-${response.locals.cspNonce}'`,
        ],
        'style-src': [
          "'self'",
          (request, response) => `'nonce-${response.locals.cspNonce}'`,
        ],
        'trusted-types': ['dompurify', 'het'],
        'require-trusted-types-for': ["'script'"],
      },
    },
  })
);

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/css', express.static(path.join(rootDir, 'node_modules/bootstrap/dist/css')));
app.use('/js/dompurify', express.static(path.join(rootDir, 'node_modules/dompurify/dist')));
app.use('/js/het', express.static(path.join(rootDir, 'dist')));
app.use('/js/idiomorph', express.static(path.join(rootDir, 'node_modules/idiomorph/dist')));
app.use('/js/signals-core', express.static(path.join(rootDir, 'node_modules/@preact/signals-core/dist')));
app.use('/js/trusted-types', express.static(path.join(rootDir, 'node_modules/trusted-types/dist/es6')));
app.use('/vendor', express.static(path.join(rootDir, 'node_modules')));

app.get('/', (request, response) => {
  response.render('index', {
    title: 'Tutorials',
  });
});

app.get('/components', (request, response) => {
  response.render('components/index', {
    title: 'Components Tutorial',
  });
});

app.get('/requests', (request, response) => {
  response.render('requests/index', {
    title: 'Requests Tutorial',
  });
});

app.get('/:tutorialKey/:slug', (request, response, next) => {
  if (!['components', 'requests'].includes(request.params.tutorialKey)) {
    next();
    return;
  }

  if (!/^[a-z0-9-]+$/.test(request.params.slug)) {
    next();
    return;
  }

  const templatePath = path.join(
    __dirname,
    'pages',
    request.params.tutorialKey,
    `${request.params.slug}.hbs`
  );

  if (!fs.existsSync(templatePath)) {
    next();
    return;
  }

  response.render(`${request.params.tutorialKey}/${request.params.slug}`, {
    title: 'Tutorials',
  });
});

app.post('/preview', (request, response) => {
  response.type('html').send(getPreviewDocument({
    nonce: response.locals.cspNonce,
    html: request.body.html || '',
    js: request.body.js || '',
    css: request.body.css || '',
  }));
});

app.get('/reports', (request, response) => {
  response.render('mocks/reports', {
    title: 'Reports',
    layout: false,
    query: request.query.q || '',
  });
});

app.get('/reports/summary', (request, response) => {
  response.render('mocks/reports-summary', {
    title: 'Report Summary',
    layout: false,
  });
});

app.get('/search', (request, response) => {
  response.render('mocks/search', {
    title: 'Search',
    layout: false,
    query: request.query.q || '',
  });
});

app.post('/draft', (request, response) => {
  response.render('mocks/message', {
    layout: false,
    title: 'Draft saved',
    message: 'Draft saved.',
  });
});

app.post('/publish', (request, response) => {
  response.render('mocks/message', {
    layout: false,
    title: 'Published',
    message: 'Published.',
  });
});

app.use((request, response) => {
  response.status(404).type('text/plain').send('Not found');
});

app.listen(port, () => {
  console.log(`Tutorials app listening on http://127.0.0.1:${port}`);
});

function getPreviewDocument({ nonce, html, js, css }) {
  return `<!DOCTYPE html>
<html>
  <head>
    <title>Tutorial preview</title>
    <link rel="stylesheet" href="/css/bootstrap.css">
    <script nonce="${nonce}" type="importmap">
      {
        "imports": {
          "@preact/signals-core": "/js/signals-core/signals-core.mjs"
        }
      }
    </script>
    <script nonce="${nonce}" src="/js/het/het.iife.js"></script>
    <script nonce="${nonce}" src="/js/idiomorph/idiomorph.js"></script>
    <style nonce="${nonce}">${escapeStyle(css)}</style>
  </head>
  <body>
    ${html}
    <script
      nonce="${nonce}"
      src="/js/trusted-types/trustedtypes.build.js"
      data-csp="trusted-types het dompurify; require-trusted-types-for 'script'">
    </script>
    <script nonce="${nonce}" src="/js/dompurify/purify.min.js"></script>
    <script nonce="${nonce}">${escapeScript(js)}</script>
  </body>
</html>`;
}

function escapeScript(value) {
  return value.replaceAll('</script', '<\\/script');
}

function escapeStyle(value) {
  return value.replaceAll('</style', '<\\/style');
}
