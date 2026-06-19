import { Router } from 'express';

const router = Router();

router.get('/abort-previous', (request, response) => {
  response.render('requests/request-coordination/links/abort-previous/index', {
    title: 'Link Request Coordination',
  });
});

export default router;
