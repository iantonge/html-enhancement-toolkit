import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/het-attrs/index', {
    title: 'het-attrs',
  });
});

router.get('/initial-batch', (request, response) => {
  response.render('components/het-attrs/initial-batch', {
    title: 'Initial write batching',
  });
});

export default router;
