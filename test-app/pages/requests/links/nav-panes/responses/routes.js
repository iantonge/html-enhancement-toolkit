import { Router } from 'express';

const router = Router();

router.get('/responses/basic', (request, response) => {
  response.render('requests/links/nav-panes/responses/basic', {
    title: 'Link Nav Panes',
  });
});

router.get('/responses/missing', (request, response) => {
  response.render('requests/links/nav-panes/responses/missing', {
    title: 'Link Nav Panes',
  });
});

export default router;
