import { Router } from 'express';

const router = Router();

router.get('/abort-previous', (request, response) => {
  response.render('requests/request-coordination/forms/abort-previous/index', {
    title: 'Form Request Coordination',
  });
});

export default router;
