import { Router } from 'express';

const router = Router();

router.get('/missing-current', (request, response) => {
  response.render('requests/het-select/links/missing-current/index', {
    title: 'Link het-select',
  });
});

export default router;
