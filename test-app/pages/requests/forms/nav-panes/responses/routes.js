import { Router } from 'express';

const router = Router();

router.get('/responses/basic', (request, response) => {
  response.render('requests/forms/nav-panes/responses/basic', {
    title: 'Form Nav Panes',
  });
});

export default router;
