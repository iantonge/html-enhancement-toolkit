import { Router } from 'express';

const router = Router();

router.get('/missing-current', (request, response) => {
  response.render('requests/forms/het-select/missing-current/index', {
    title: 'Form het-select',
  });
});

export default router;
