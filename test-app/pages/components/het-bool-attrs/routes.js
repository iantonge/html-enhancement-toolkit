import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/het-bool-attrs/index', {
    title: 'het-bool-attrs',
  });
});

router.get('/coordinated-attrs', (request, response) => {
  response.render('components/het-bool-attrs/coordinated-attrs', {
    title: 'Coordinated het-bool-attrs',
  });
});

router.get('/initial-matching', (request, response) => {
  response.render('components/het-bool-attrs/initial-matching', {
    title: 'Initial matching het-bool-attrs',
  });
});

export default router;
