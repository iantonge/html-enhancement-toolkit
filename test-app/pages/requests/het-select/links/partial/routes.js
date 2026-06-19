import { Router } from 'express';

const router = Router();

router.get('/partial', (request, response) => {
  response.render('requests/het-select/links/partial/index', {
    title: 'Link het-select',
  });
});

export default router;
