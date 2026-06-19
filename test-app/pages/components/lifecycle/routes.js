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

router.get('/destroy', (request, response) => {
  response.render('components/lifecycle/destroy', {
    title: 'Component destroy',
  });
});

router.get('/invalid-cleanup', (request, response) => {
  response.render('components/lifecycle/invalid-cleanup', {
    title: 'Invalid cleanup callback',
  });
});

export default router;
