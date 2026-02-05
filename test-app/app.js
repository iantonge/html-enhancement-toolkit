import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import pageRoutes from './pages/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

app.set('views', path.join(__dirname, 'pages'));
app.set('view engine', 'hbs');

const upload = multer();

app.use(express.urlencoded({ extended: true }));
app.use(upload.none());
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
        'frame-ancestors': ["'none'"],
        'img-src': ["'self'", 'data:'],
        'object-src': ["'none'"],
        'script-src': [
          "'self'",
          (request, response) => `'nonce-${response.locals.cspNonce}'`,
        ],
        'style-src': ["'self'"],
      },
    },
  })
);

app.use('/css', express.static(path.join(__dirname, '../node_modules/bootstrap/dist/css')));
app.use('/js/het', express.static(path.join(__dirname, '../dist')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/', pageRoutes);

app.use((request, response) => {
  response.status(404).type('text/plain').send('Not found');
});

app.listen(port);
