import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('integration/index', {
    title: 'Integration',
  });
});

export default router;
