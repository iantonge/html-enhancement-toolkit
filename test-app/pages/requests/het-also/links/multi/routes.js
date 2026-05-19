import { Router } from 'express';

const router = Router();

router.get('/multi', (request, response) => {
  response.render('requests/het-also/links/multi/index', {
    title: 'Link het-also',
  });
});

export default router;
