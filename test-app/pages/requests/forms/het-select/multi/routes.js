import { Router } from 'express';

const router = Router();

router.get('/multi', (request, response) => {
  response.render('requests/forms/het-select/multi/index', {
    title: 'Form het-select',
  });
});

export default router;
