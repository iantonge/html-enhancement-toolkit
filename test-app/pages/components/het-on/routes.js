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

router.get('/invalid-expression', (request, response) => {
  response.render('components/het-on/invalid-expression', {
    title: 'Invalid expression',
  });
});

router.get('/invalid-expression-empty-method', (request, response) => {
  response.render('components/het-on/invalid-expression-empty-method', {
    title: 'Invalid expression: empty method',
  });
});

router.get('/invalid-expression-extra-equals', (request, response) => {
  response.render('components/het-on/invalid-expression-extra-equals', {
    title: 'Invalid expression: extra equals',
  });
});

router.get('/invalid-negation', (request, response) => {
  response.render('components/het-on/invalid-negation', {
    title: 'Invalid negation',
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

router.get('/toggle', (request, response) => {
  response.render('components/het-on/toggle', {
    title: 'Toggle',
  });
});

export default router;
