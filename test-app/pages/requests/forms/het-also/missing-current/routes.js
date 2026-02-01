import { Router } from 'express';

const router = Router();

router.get('/missing-current', (request, response) => {
  response.render('requests/forms/het-also/missing-current/index', {
    title: 'Form het-also',
  });
});

export default router;
