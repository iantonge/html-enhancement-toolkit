import { Router } from 'express';

const router = Router();

router.get('/responses/partial', (request, response) => {
  response.render('requests/forms/het-select/responses/partial', {
    title: 'Form het-select',
  });
});

router.get('/responses/missing', (request, response) => {
  response.render('requests/forms/het-select/responses/missing', {
    title: 'Form het-select',
  });
});

export default router;
