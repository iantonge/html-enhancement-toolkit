import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/registration/index', {
    title: 'Component registration',
  });
});

router.get('/anonymous', (request, response) => {
  response.render('components/registration/anonymous', {
    title: 'Anonymous component',
  });
});

router.get('/anonymous-error', (request, response) => {
  response.render('components/registration/anonymous-error', {
    title: 'Anonymous component error',
  });
});

router.get('/register-without-name', (request, response) => {
  response.render('components/registration/register-without-name', {
    title: 'Register without name',
  });
});

export default router;
