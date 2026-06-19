import { Router } from 'express';

const router = Router();

router.get('/multi', (request, response) => {
  response.render('requests/het-also/forms/multi/index', {
    title: 'Form het-also',
  });
});

export default router;
