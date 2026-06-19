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

export default router;
