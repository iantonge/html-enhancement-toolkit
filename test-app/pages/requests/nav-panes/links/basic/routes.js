import { Router } from 'express';

const router = Router();

router.get('/basic', (request, response) => {
  response.render('requests/nav-panes/links/basic/index', {
    title: 'Link Nav Panes',
  });
});

export default router;
