import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/het-attrs/index', {
    title: 'het-attrs',
  });
});

export default router;
