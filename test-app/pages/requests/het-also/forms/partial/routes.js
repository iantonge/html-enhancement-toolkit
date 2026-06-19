import { Router } from 'express';

const router = Router();

router.get('/partial', (request, response) => {
  response.render('requests/het-also/forms/partial/index', {
    title: 'Form het-also',
  });
});

export default router;
