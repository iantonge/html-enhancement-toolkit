import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/mutation-observer/index', {
    title: 'Mutation observer',
  });
});

router.get('/mount-added', (request, response) => {
  response.render('components/mutation-observer/mount-added', {
    title: 'Mount added components',
  });
});

export default router;
