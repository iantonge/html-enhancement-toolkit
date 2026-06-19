import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/registration/index', {
    title: 'Component registration',
  });
});

export default router;
