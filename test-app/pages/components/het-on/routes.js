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

router.get('/modifiers', (request, response) => {
  response.render('components/het-on/modifiers', {
    title: 'Modifiers',
  });
});

export default router;
