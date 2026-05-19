import { Router } from 'express';

const router = Router();

router.get('/missing-current', (request, response) => {
  response.render('requests/het-select/forms/missing-current/index', {
    title: 'Form het-select',
  });
});

export default router;
