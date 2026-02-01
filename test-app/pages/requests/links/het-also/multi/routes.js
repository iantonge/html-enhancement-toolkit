import { Router } from 'express';

const router = Router();

router.get('/multi', (request, response) => {
  response.render('requests/links/het-also/multi/index', {
    title: 'Link het-also',
  });
});

export default router;
