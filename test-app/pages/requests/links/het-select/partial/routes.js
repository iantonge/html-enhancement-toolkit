import { Router } from 'express';

const router = Router();

router.get('/partial', (request, response) => {
  response.render('requests/links/het-select/partial/index', {
    title: 'Link het-select',
  });
});

export default router;
