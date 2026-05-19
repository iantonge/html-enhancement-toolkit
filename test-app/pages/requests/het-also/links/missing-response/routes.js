import { Router } from 'express';

const router = Router();

router.get('/missing-response', (request, response) => {
  response.render('requests/het-also/links/missing-response/index', {
    title: 'Link het-also',
  });
});

export default router;
