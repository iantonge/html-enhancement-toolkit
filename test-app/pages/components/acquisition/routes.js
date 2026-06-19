import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/acquisition/index', {
    title: 'Acquisition strategies',
  });
});

router.get('/seed', (request, response) => {
  response.render('components/acquisition/seed', {
    title: 'Seed strategy',
  });
});

export default router;
