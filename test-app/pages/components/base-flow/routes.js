import { Router } from 'express';

const router = Router();

router.get('/mount', (request, response) => {
  response.render('components/base-flow/mount', {
    title: 'Base mount flow',
  });
});

router.get('/anonymous', (request, response) => {
  response.render('components/base-flow/anonymous', {
    title: 'Anonymous component',
  });
});

router.get('/anonymous-error', (request, response) => {
  response.render('components/base-flow/anonymous-error', {
    title: 'Anonymous component error',
  });
});

router.get('/destroy', (request, response) => {
  response.render('components/base-flow/destroy', {
    title: 'Base destroy flow',
  });
});

router.get('/cloak', (request, response) => {
  response.render('components/base-flow/cloak', {
    title: 'Cloak',
  });
});

router.get('/register-without-name', (request, response) => {
  response.render('components/base-flow/register-without-name', {
    title: 'Register without name',
  });
});

export default router;
