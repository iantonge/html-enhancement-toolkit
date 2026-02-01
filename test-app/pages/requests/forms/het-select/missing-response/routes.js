import { Router } from 'express';

const router = Router();

router.get('/missing-response', (request, response) => {
  response.render('requests/forms/het-select/missing-response/index', {
    title: 'Form het-select',
  });
});

export default router;
