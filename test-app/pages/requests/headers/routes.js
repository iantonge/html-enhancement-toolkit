import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/headers/index', {
    title: 'Header tests',
  });
});

router.get('/het-target/link', (request, response) => {
  response.render('requests/headers/link', {
    title: 'X-HET-Target link test',
  });
});

router.get('/het-target/form', (request, response) => {
  response.render('requests/headers/form', {
    title: 'X-HET-Target form test',
  });
});

router.get('/het-target/responses/link', (request, response) => {
  response.render('requests/headers/responses/link', {
    title: 'X-HET-Target link response',
  });
});

router.get('/het-target/responses/form', (request, response) => {
  response.render('requests/headers/responses/form', {
    title: 'X-HET-Target form response',
  });
});

export default router;
