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

router.get('/sync', (request, response) => {
  response.render('components/acquisition/sync', {
    title: 'Sync strategy',
  });
});

router.get('/type-hints', (request, response) => {
  response.render('components/acquisition/type-hints', {
    title: 'Type hints',
  });
});

router.get('/invalid-sync-model', (request, response) => {
  response.render('components/acquisition/invalid-sync-model', {
    title: 'Invalid sync on het-model',
  });
});

router.get('/duplicate-seed-signal', (request, response) => {
  response.render('components/acquisition/duplicate-seed-signal', {
    title: 'Duplicate seed signal',
  });
});

router.get('/invalid-multiple-colons', (request, response) => {
  response.render('components/acquisition/invalid-multiple-colons', {
    title: 'Invalid declaration: multiple colons',
  });
});

router.get('/type-hint-unsupported', (request, response) => {
  response.render('components/acquisition/type-hint-unsupported', {
    title: 'Type hint unsupported',
  });
});

router.get('/unknown-type-hint', (request, response) => {
  response.render('components/acquisition/unknown-type-hint', {
    title: 'Unknown type hint',
  });
});

router.get('/unknown-strategy', (request, response) => {
  response.render('components/acquisition/unknown-strategy', {
    title: 'Unknown acquisition strategy',
  });
});

router.get('/acquisition-not-supported', (request, response) => {
  response.render('components/acquisition/acquisition-not-supported', {
    title: 'Acquisition not supported',
  });
});

router.get('/signal-reassignment', (request, response) => {
  response.render('components/acquisition/signal-reassignment', {
    title: 'Signal reassignment',
  });
});

router.get('/model-seed', (request, response) => {
  response.render('components/acquisition/model-seed', {
    title: 'het-model seed',
  });
});

router.get('/sync-after-destroy', (request, response) => {
  response.render('components/acquisition/sync-after-destroy', {
    title: 'sync after destroy',
  });
});

router.get('/bool-false', (request, response) => {
  response.render('components/acquisition/bool-false', {
    title: 'bool false parsing',
  });
});

export default router;
