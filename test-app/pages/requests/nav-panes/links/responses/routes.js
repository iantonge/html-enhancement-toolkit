import { Router } from 'express';

const router = Router();

router.get('/responses/basic', (request, response) => {
  response.render('requests/nav-panes/links/responses/basic', {
    title: 'Link Nav Panes',
  });
});

export default router;
