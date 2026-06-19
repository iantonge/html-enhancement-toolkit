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

export default router;
