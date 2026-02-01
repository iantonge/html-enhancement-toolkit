import { Router } from 'express';

const router = Router();

router.get('/link', (request, response) => {
  response.render('requests/history/link/index', {
    title: 'Link popstate',
  });
});

export default router;
