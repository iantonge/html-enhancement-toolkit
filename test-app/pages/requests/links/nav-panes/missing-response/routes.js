import { Router } from 'express';

const router = Router();

router.get('/missing-response', (request, response) => {
  response.render('requests/links/nav-panes/missing-response/index', {
    title: 'Link Nav Panes',
  });
});

export default router;
