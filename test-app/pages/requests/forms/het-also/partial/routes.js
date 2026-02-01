import { Router } from 'express';

const router = Router();

router.get('/partial', (request, response) => {
  response.render('requests/forms/het-also/partial/index', {
    title: 'Form het-also',
  });
});

export default router;
