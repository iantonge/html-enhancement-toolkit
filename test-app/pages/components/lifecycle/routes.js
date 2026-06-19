import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/lifecycle/index', {
    title: 'Component lifecycle',
  });
});

router.get('/mount', (request, response) => {
  response.render('components/lifecycle/mount', {
    title: 'Component mount',
  });
});

export default router;
