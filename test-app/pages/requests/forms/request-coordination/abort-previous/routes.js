import { Router } from 'express';

const router = Router();

router.get('/abort-previous', (request, response) => {
  response.render('requests/forms/request-coordination/abort-previous/index', {
    title: 'Form Request Coordination',
  });
});

export default router;
