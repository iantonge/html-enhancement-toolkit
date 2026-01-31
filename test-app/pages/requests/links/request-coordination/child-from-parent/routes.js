import { Router } from 'express';

const router = Router();

router.get('/child-from-parent', (request, response) => {
  response.render('requests/links/request-coordination/child-from-parent/index', {
    title: 'Link Request Coordination',
  });
});

export default router;
