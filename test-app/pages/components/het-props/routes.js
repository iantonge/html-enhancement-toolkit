import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/het-props/index', {
    title: 'het-props',
  });
});

router.get('/binds-signal', (request, response) => {
  response.render('components/het-props/binds-signal', {
    title: 'Binds signal',
  });
});

router.get('/missing-signal', (request, response) => {
  response.render('components/het-props/missing-signal', {
    title: 'Missing signal',
  });
});

router.get('/write-error', (request, response) => {
  response.render('components/het-props/write-error', {
    title: 'Write error',
  });
});

export default router;
