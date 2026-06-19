import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/scoped-refs/index', {
    title: 'Scoped refs',
  });
});

router.get('/collects-own-refs', (request, response) => {
  response.render('components/scoped-refs/collects-own-refs', {
    title: 'Collects own refs',
  });
});

router.get('/excludes-nested-component-refs', (request, response) => {
  response.render('components/scoped-refs/excludes-nested-component-refs', {
    title: 'Excludes nested component refs',
  });
});

export default router;
