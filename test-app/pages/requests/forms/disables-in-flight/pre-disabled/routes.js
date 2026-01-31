import { Router } from 'express';

const router = Router();

router.get('/pre-disabled', (request, response) => {
  response.render('requests/forms/disables-in-flight/pre-disabled/index', {
    title: 'Form Disable',
  });
});

export default router;
