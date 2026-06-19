import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/lifecycle-events/index', {
    title: 'Lifecycle events',
  });
});

router.get('/response', (request, response) => {
  response.render('requests/lifecycle-events/response', {
    title: 'Lifecycle events response',
    message:
      request.query.variant === 'alternate'
        ? 'Alternate lifecycle response loaded.'
        : 'Lifecycle response loaded.',
  });
});

export default router;
