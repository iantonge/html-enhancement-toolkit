import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/het-imports/index', {
    title: 'het-exports / het-imports',
  });
});

router.get('/nearest-ancestor', (request, response) => {
  response.render('components/het-imports/nearest-ancestor', {
    title: 'Nearest exporting ancestor',
  });
});

router.get('/alias', (request, response) => {
  response.render('components/het-imports/alias', {
    title: 'Import alias',
  });
});

router.get('/missing-parent', (request, response) => {
  response.render('components/het-imports/missing-parent', {
    title: 'Missing exporting parent',
  });
});

router.get('/parent-not-mounted', (request, response) => {
  response.render('components/het-imports/parent-not-mounted', {
    title: 'Exporting parent not mounted',
  });
});

router.get('/export-missing-signal', (request, response) => {
  response.render('components/het-imports/export-missing-signal', {
    title: 'Exported signal missing on parent',
  });
});

router.get('/invalid-declaration', (request, response) => {
  response.render('components/het-imports/invalid-declaration', {
    title: 'Invalid het-imports declaration',
  });
});

router.get('/signal-name-conflict', (request, response) => {
  response.render('components/het-imports/signal-name-conflict', {
    title: 'Import and local signal conflict',
  });
});

export default router;
