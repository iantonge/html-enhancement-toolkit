import { Router } from 'express';

const router = Router();

router.get('/missing-response', (request, response) => {
  response.render('requests/forms/nav-panes/missing-response/index', {
    title: 'Form Nav Panes',
  });
});

export default router;
