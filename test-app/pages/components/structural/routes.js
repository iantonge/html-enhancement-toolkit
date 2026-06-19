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

router.get('/invalid-property', (request, response) => {
  response.render('components/structural/invalid-property', {
    title: 'Invalid forwarded property',
  });
});

router.get('/invalid-root', (request, response) => {
  response.render('components/structural/invalid-root', {
    title: 'Invalid structural root',
  });
});

router.get('/signal-name-conflict', (request, response) => {
  response.render('components/structural/signal-name-conflict', {
    title: 'Forwarded signal conflict',
  });
});

export default router;
