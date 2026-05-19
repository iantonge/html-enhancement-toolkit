import { Router } from 'express';

const router = Router();

router.get('/inside-response', (request, response) => {
  response.render('requests/het-also/links/inside-response/index', {
    title: 'Link het-also',
  });
});

export default router;
