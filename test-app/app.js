import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
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
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/', pageRoutes);

app.use((request, response) => {
  response.status(404).type('text/plain').send('Not found');
});

app.listen(port);
