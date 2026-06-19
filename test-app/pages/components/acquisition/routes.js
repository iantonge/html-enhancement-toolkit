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

router.get('/explicit-sources', (request, response) => {
  response.render('components/acquisition/explicit-sources', {
    title: 'Explicit read sources',
  });
});

export default router;
