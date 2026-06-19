import { Router } from 'express';

const router = Router();

router.get('/multi', (request, response) => {
  response.render('requests/het-select/forms/multi/index', {
    title: 'Form het-select',
  });
});

export default router;
