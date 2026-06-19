import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/het-props/index', {
    title: 'het-props',
  });
});

router.get('/binds-signal', (request, response) => {
  response.render('components/het-props/binds-signal', {
    title: 'Binds signal',
  });
});

export default router;
