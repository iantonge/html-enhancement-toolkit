import { Router } from 'express';

const router = Router();

router.get('/missing-response', (request, response) => {
  response.render('requests/links/het-select/missing-response/index', {
    title: 'Link het-select',
  });
});

export default router;
