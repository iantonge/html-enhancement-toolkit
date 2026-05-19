import { Router } from 'express';

const router = Router();

router.get('/parent-from-child', (request, response) => {
  response.render('requests/request-coordination/links/parent-from-child/index', {
    title: 'Link Request Coordination',
  });
});

export default router;
