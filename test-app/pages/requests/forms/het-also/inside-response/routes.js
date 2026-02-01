import { Router } from 'express';

const router = Router();

router.get('/inside-response', (request, response) => {
  response.render('requests/forms/het-also/inside-response/index', {
    title: 'Form het-also',
  });
});

export default router;
