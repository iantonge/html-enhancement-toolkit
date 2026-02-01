import { Router } from 'express';

const router = Router();

router.get('/basic', (request, response) => {
  response.render('requests/forms/nav-panes/basic/index', {
    title: 'Form Nav Panes',
  });
});

export default router;
