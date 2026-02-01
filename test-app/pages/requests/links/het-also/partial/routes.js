import { Router } from 'express';

const router = Router();

router.get('/partial', (request, response) => {
  response.render('requests/links/het-also/partial/index', {
    title: 'Link het-also',
  });
});

export default router;
