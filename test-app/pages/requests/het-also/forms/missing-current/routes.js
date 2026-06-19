import { Router } from 'express';

const router = Router();

router.get('/missing-current', (request, response) => {
  response.render('requests/het-also/forms/missing-current/index', {
    title: 'Form het-also',
  });
});

export default router;
