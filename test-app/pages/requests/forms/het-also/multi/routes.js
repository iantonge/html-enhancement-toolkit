import { Router } from 'express';

const router = Router();

router.get('/multi', (request, response) => {
  response.render('requests/forms/het-also/multi/index', {
    title: 'Form het-also',
  });
});

export default router;
