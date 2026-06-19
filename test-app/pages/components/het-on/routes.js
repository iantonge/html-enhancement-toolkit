import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/het-on/index', {
    title: 'het-on',
  });
});

router.get('/invokes-method', (request, response) => {
  response.render('components/het-on/invokes-method', {
    title: 'Invokes method',
  });
});

router.get('/missing-method', (request, response) => {
  response.render('components/het-on/missing-method', {
    title: 'Missing method',
  });
});

router.get('/multiple-handlers', (request, response) => {
  response.render('components/het-on/multiple-handlers', {
    title: 'Multiple handlers',
  });
});

router.get('/custom-event-colon', (request, response) => {
  response.render('components/het-on/custom-event-colon', {
    title: 'Custom event (colon)',
  });
});

router.get('/assigns-signal', (request, response) => {
  response.render('components/het-on/assigns-signal', {
    title: 'Assigns signal',
  });
});

router.get('/assignment-missing-source', (request, response) => {
  response.render('components/het-on/assignment-missing-source', {
    title: 'Assignment missing source',
  });
});

router.get('/assignment-invalid-expression', (request, response) => {
  response.render('components/het-on/assignment-invalid-expression', {
    title: 'Assignment invalid expression',
  });
});

router.get('/assignment-unknown-type-hint', (request, response) => {
  response.render('components/het-on/assignment-unknown-type-hint', {
    title: 'Assignment unknown type hint',
  });
});

router.get('/modifiers', (request, response) => {
  response.render('components/het-on/modifiers', {
    title: 'Modifiers',
  });
});

router.get('/invalid-modifier-duration', (request, response) => {
  response.render('components/het-on/invalid-modifier-duration', {
    title: 'Invalid modifier duration',
  });
});

router.get('/invalid-modifier-duplicate-timing', (request, response) => {
  response.render('components/het-on/invalid-modifier-duplicate-timing', {
    title: 'Invalid modifier duplicate timing',
  });
});

router.get('/invalid-modifier-duplicate-key', (request, response) => {
  response.render('components/het-on/invalid-modifier-duplicate-key', {
    title: 'Invalid modifier duplicate key',
  });
});

router.get('/invalid-modifier-key-event', (request, response) => {
  response.render('components/het-on/invalid-modifier-key-event', {
    title: 'Invalid modifier key event',
  });
});

export default router;
