import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/registration/index', {
    title: 'Component registration',
  });
});

router.get('/register-without-name', (request, response) => {
  response.render('components/registration/register-without-name', {
    title: 'Register without name',
  });
});

export default router;
