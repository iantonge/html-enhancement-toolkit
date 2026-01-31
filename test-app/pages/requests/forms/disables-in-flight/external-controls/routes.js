import { Router } from 'express';

const router = Router();

router.get('/external-controls', (request, response) => {
  response.render('requests/forms/disables-in-flight/external-controls/index', {
    title: 'Form Disable',
  });
});

export default router;
