import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/het-bool-attrs/index', {
    title: 'het-bool-attrs',
  });
});

export default router;
