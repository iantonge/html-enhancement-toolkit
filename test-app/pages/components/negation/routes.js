import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/negation/index', {
    title: 'Negation',
  });
});

export default router;
