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

router.get('/type-hints', (request, response) => {
  response.render('components/acquisition/type-hints', {
    title: 'Type hints',
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

router.get('/signal-reassignment', (request, response) => {
  response.render('components/acquisition/signal-reassignment', {
    title: 'Signal reassignment',
  });
});

router.get('/bool-false', (request, response) => {
  response.render('components/acquisition/bool-false', {
    title: 'bool false parsing',
  });
});

export default router;
