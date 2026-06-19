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

router.get('/nonce', (request, response) => {
  response.render('requests/headers/nonce/index', {
    title: 'Nonce header tests',
  });
});

router.get('/nonce/default', (request, response) => {
  response.render('requests/headers/nonce/default', {
    title: 'Default nonce header test',
  });
});

router.get('/nonce/custom-header', (request, response) => {
  response.render('requests/headers/nonce/custom-header', {
    title: 'Custom nonce header test',
  });
});

router.get('/nonce/preexisting-header', (request, response) => {
  response.render('requests/headers/nonce/preexisting-header', {
    title: 'Preexisting nonce header test',
  });
});

router.get('/nonce/responses/default', (request, response) => {
  response.render('requests/headers/nonce/responses/default', {
    title: 'Default nonce response',
  });
});

router.get('/nonce/responses/custom-header', (request, response) => {
  response.render('requests/headers/nonce/responses/custom-header', {
    title: 'Custom nonce response',
  });
});

router.get('/nonce/responses/preexisting', (request, response) => {
  response.render('requests/headers/nonce/responses/preexisting', {
    title: 'Preexisting nonce response',
  });
});

export default router;
