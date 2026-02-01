import { Router } from 'express';

const router = Router();

router.get('/inside-response', (request, response) => {
  response.render('requests/links/het-also/inside-response/index', {
    title: 'Link het-also',
  });
});

export default router;
