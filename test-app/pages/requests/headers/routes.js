import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/headers/index', {
    title: 'Header tests',
  });
});

router.get('/x-het-target', (request, response) => {
  response.render('requests/headers/x-het-target/index', {
    title: 'X-HET-Target tests',
  });
});

router.get('/x-het-target/link', (request, response) => {
  response.render('requests/headers/x-het-target/link', {
    title: 'X-HET-Target link test',
  });
});

router.get('/x-het-target/form', (request, response) => {
  response.render('requests/headers/x-het-target/form', {
    title: 'X-HET-Target form test',
  });
});

router.get('/x-het-target/responses/link', (request, response) => {
  response.render('requests/headers/x-het-target/responses/link', {
    title: 'X-HET-Target link response',
  });
});

router.get('/x-het-target/responses/form', (request, response) => {
  response.render('requests/headers/x-het-target/responses/form', {
    title: 'X-HET-Target form response',
  });
});

export default router;
