import { Router } from 'express';

const router = Router();

router.get('/inside-target', (request, response) => {
  response.render('requests/het-also/links/inside-target/index', {
    title: 'Link het-also',
  });
});

export default router;
