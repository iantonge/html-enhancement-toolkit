import { Router } from 'express';

const router = Router();

router.get('/missing-current', (request, response) => {
  response.render('requests/links/het-also/missing-current/index', {
    title: 'Link het-also',
  });
});

export default router;
