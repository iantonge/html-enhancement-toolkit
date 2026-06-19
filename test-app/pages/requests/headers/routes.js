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

router.get('/x-het-target-override', (request, response) => {
  response.render('requests/headers/x-het-target-override/index', {
    title: 'X-HET-Target-Override tests',
  });
});

router.get('/x-het-target-override/link', (request, response) => {
  response.render('requests/headers/x-het-target-override/link', {
    title: 'X-HET-Target-Override link test',
  });
});

router.get('/x-het-target-override/form', (request, response) => {
  response.render('requests/headers/x-het-target-override/form', {
    title: 'X-HET-Target-Override form test',
  });
});

router.get('/x-het-target-override/responses/link', (request, response) => {
  response
    .set('X-HET-Target-Override', 'child')
    .render('requests/headers/x-het-target-override/responses/link', {
      title: 'X-HET-Target-Override link response',
    });
});

router.get('/x-het-target-override/responses/form', (request, response) => {
  response
    .set('X-HET-Target-Override', 'child')
    .render('requests/headers/x-het-target-override/responses/form', {
      title: 'X-HET-Target-Override form response',
    });
});

router.get('/x-het-select-override', (request, response) => {
  response.render('requests/headers/x-het-select-override/index', {
    title: 'X-HET-Select-Override tests',
  });
});

router.get('/x-het-select-override/link', (request, response) => {
  response.render('requests/headers/x-het-select-override/link', {
    title: 'X-HET-Select-Override link test',
  });
});

router.get('/x-het-select-override/form', (request, response) => {
  response.render('requests/headers/x-het-select-override/form', {
    title: 'X-HET-Select-Override form test',
  });
});

router.get('/x-het-select-override/responses/link', (request, response) => {
  response
    .set('X-HET-Select-Override', 'primary-content')
    .render('requests/headers/x-het-select-override/responses/link', {
      title: 'X-HET-Select-Override link response',
    });
});

router.get('/x-het-select-override/responses/link-clear', (request, response) => {
  response
    .set('X-HET-Select-Override', '')
    .render('requests/headers/x-het-select-override/responses/link', {
      title: 'X-HET-Select-Override clear link response',
    });
});

router.get('/x-het-select-override/responses/form', (request, response) => {
  response
    .set('X-HET-Select-Override', 'primary-content')
    .render('requests/headers/x-het-select-override/responses/form', {
      title: 'X-HET-Select-Override form response',
    });
});

router.get('/x-het-select-override/responses/form-clear', (request, response) => {
  response
    .set('X-HET-Select-Override', '')
    .render('requests/headers/x-het-select-override/responses/form', {
      title: 'X-HET-Select-Override clear form response',
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
