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

export default router;
