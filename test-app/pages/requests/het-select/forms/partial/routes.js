import { Router } from 'express';

const router = Router();

router.get('/partial', (request, response) => {
  response.render('requests/het-select/forms/partial/index', {
    title: 'Form het-select',
  });
});

export default router;
