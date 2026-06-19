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

router.get('/assigns-signal', (request, response) => {
  response.render('components/het-on/assigns-signal', {
    title: 'Assigns signal',
  });
});

export default router;
