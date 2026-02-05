import { Router } from 'express';

const router = Router();

router.get('/link', (request, response) => {
  response.render('requests/history/link/index', {
    title: 'Link popstate',
    description: 'Initial link history description',
  });
});

export default router;
