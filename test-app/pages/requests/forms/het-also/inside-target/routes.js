import { Router } from 'express';

const router = Router();

router.get('/inside-target', (request, response) => {
  response.render('requests/forms/het-also/inside-target/index', {
    title: 'Form het-also',
  });
});

export default router;
