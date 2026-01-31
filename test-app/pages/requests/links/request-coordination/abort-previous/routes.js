import { Router } from 'express';

const router = Router();

router.get('/abort-previous', (request, response) => {
  response.render('requests/links/request-coordination/abort-previous/index', {
    title: 'Link Request Coordination',
  });
});

export default router;
