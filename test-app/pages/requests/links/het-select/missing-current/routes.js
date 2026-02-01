import { Router } from 'express';

const router = Router();

router.get('/missing-current', (request, response) => {
  response.render('requests/links/het-select/missing-current/index', {
    title: 'Link het-select',
  });
});

export default router;
