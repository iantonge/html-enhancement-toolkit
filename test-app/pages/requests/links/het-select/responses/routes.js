import { Router } from 'express';

const router = Router();

router.get('/responses/partial', (request, response) => {
  response.render('requests/links/het-select/responses/partial', {
    title: 'Link het-select',
  });
});

router.get('/responses/missing', (request, response) => {
  response.render('requests/links/het-select/responses/missing', {
    title: 'Link het-select',
  });
});

export default router;
