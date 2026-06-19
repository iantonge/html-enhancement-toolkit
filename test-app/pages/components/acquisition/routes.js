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

router.get('/duplicate-seed-signal', (request, response) => {
  response.render('components/acquisition/duplicate-seed-signal', {
    title: 'Duplicate seed signal',
  });
});

export default router;
