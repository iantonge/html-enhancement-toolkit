import { Router } from 'express';

const router = Router();

router.get('/form-controls', (request, response) => {
  response.render('requests/forms/disables-in-flight/form-controls/index', {
    title: 'Form Disable',
  });
});

export default router;
