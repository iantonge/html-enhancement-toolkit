import { Router } from 'express';

const router = Router();

router.get('/mount', (request, response) => {
  response.render('components/base-flow/mount', {
    title: 'Base mount flow',
  });
});

router.get('/destroy', (request, response) => {
  response.render('components/base-flow/destroy', {
    title: 'Base destroy flow',
  });
});

router.get('/register-without-name', (request, response) => {
  response.render('components/base-flow/register-without-name', {
    title: 'Register without name',
  });
});

export default router;
