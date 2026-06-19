import { Router } from 'express';

const router = Router();

router.get('/missing-response', (request, response) => {
  response.render('requests/het-select/links/missing-response/index', {
    title: 'Link het-select',
  });
});

export default router;
