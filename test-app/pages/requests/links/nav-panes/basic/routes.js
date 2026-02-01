import { Router } from 'express';

const router = Router();

router.get('/basic', (request, response) => {
  response.render('requests/links/nav-panes/basic/index', {
    title: 'Link Nav Panes',
  });
});

export default router;
