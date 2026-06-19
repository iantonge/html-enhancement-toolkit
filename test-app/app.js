import express from 'express';

const app = express();
const port = 3000;

app.get('/', (request, response) => {
  response.type('html').send(`<!DOCTYPE html>
<html>
  <head>
    <title>html enhancement toolkit - HTML Enhancement Toolkit</title>
  </head>
  <body>
    <nav>
      <a href="/">HET Test Application</a>
    </nav>
    <main id="main">
      <section>
        <div>
          <h1>HTML Enhancement Toolkit</h1>
          <p>Project skeleton with build and test scaffolding.</p>
        </div>
      </section>
    </main>
  </body>
</html>`);
});

app.use((request, response) => {
  response.status(404).type('text/plain').send('Not found');
});

app.listen(port);
