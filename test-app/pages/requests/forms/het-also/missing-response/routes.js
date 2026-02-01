import { Router } from 'express';

const router = Router();

router.get('/missing-response', (request, response) => {
  response.render('requests/forms/het-also/missing-response/index', {
    title: 'Form het-also',
  });
});

export default router;
