import { Router } from 'express';

const router = Router();

router.get('/child-from-parent', (request, response) => {
  response.render('requests/request-coordination/forms/child-from-parent/index', {
    title: 'Form Request Coordination',
  });
});

export default router;
