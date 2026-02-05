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

router.get('/het-target-override', (request, response) => {
  response.render('requests/headers/het-target-override/index', {
    title: 'X-HET-Target-Override tests',
  });
});

router.get('/het-target-override/link', (request, response) => {
  response.render('requests/headers/het-target-override/link', {
    title: 'X-HET-Target-Override link test',
  });
});

router.get('/het-target-override/form', (request, response) => {
  response.render('requests/headers/het-target-override/form', {
    title: 'X-HET-Target-Override form test',
  });
});

router.get('/het-target-override/responses/link', (request, response) => {
  response
    .set('X-HET-Target-Override', 'child')
    .render('requests/headers/het-target-override/responses/link', {
      title: 'X-HET-Target-Override link response',
    });
});

router.get('/het-target-override/responses/form', (request, response) => {
  response
    .set('X-HET-Target-Override', 'child')
    .render('requests/headers/het-target-override/responses/form', {
      title: 'X-HET-Target-Override form response',
    });
});

export default router;
