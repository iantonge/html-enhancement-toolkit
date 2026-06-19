import { Router } from 'express';

const router = Router();

router.get('/missing-response', (request, response) => {
  response.render('requests/het-select/forms/missing-response/index', {
    title: 'Form het-select',
  });
});

export default router;
