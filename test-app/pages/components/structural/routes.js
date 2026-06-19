import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/structural/index', {
    title: 'Structural templates',
  });
});

router.get('/for-list', (request, response) => {
  response.render('components/structural/for-list', {
    title: 'het-for list reuse',
  });
});

router.get('/if-toggle', (request, response) => {
  response.render('components/structural/if-toggle', {
    title: 'het-if toggle',
  });
});

router.get('/invalid-non-array', (request, response) => {
  response.render('components/structural/invalid-non-array', {
    title: 'Invalid het-for source',
  });
});

export default router;
