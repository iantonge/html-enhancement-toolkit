import { Router } from 'express';

const router = Router();

router.get('/multi', (request, response) => {
  response.render('requests/links/het-select/multi/index', {
    title: 'Link het-select',
  });
});

export default router;
