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

router.get('/if-toggle-delayed', (request, response) => {
  response.render('components/structural/if-toggle-delayed', {
    title: 'het-if delayed unmount',
  });
});

router.get('/if-toggle-override', (request, response) => {
  response.render('components/structural/if-toggle-override', {
    title: 'het-if delayed unmount override',
  });
});

router.get('/mount-added', (request, response) => {
  response.render('components/structural/mount-added', {
    title: 'Mutation observer mounts structural components',
  });
});

router.get('/for-list-delayed', (request, response) => {
  response.render('components/structural/for-list-delayed', {
    title: 'het-for delayed unmount',
  });
});

router.get('/invalid-non-array', (request, response) => {
  response.render('components/structural/invalid-non-array', {
    title: 'Invalid het-for source',
  });
});

router.get('/invalid-missing-key', (request, response) => {
  response.render('components/structural/invalid-missing-key', {
    title: 'Missing het-for key',
  });
});

router.get('/invalid-missing-key-property', (request, response) => {
  response.render('components/structural/invalid-missing-key-property', {
    title: 'Missing het-for key property',
  });
});

router.get('/invalid-key-type', (request, response) => {
  response.render('components/structural/invalid-key-type', {
    title: 'Invalid het-for key type',
  });
});

router.get('/invalid-duplicate-key', (request, response) => {
  response.render('components/structural/invalid-duplicate-key', {
    title: 'Duplicate het-for key',
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

router.get('/shape-change', (request, response) => {
  response.render('components/structural/shape-change', {
    title: 'Structural shape change',
  });
});

router.get('/key-outside-for', (request, response) => {
  response.render('components/structural/key-outside-for', {
    title: '$key outside het-for',
  });
});

export default router;
