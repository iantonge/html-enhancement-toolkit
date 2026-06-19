import { Router } from 'express';

const router = Router();

router.get('/parent-from-child', (request, response) => {
  response.render('requests/request-coordination/forms/parent-from-child/index', {
    title: 'Form Request Coordination',
  });
});

export default router;
