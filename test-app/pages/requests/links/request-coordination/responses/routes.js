import { Router } from 'express';

const router = Router();

router.get('/responses/first', (request, response) => {
  response.render('requests/links/request-coordination/responses/first', {
    title: 'Link Request Coordination',
  });
});

router.get('/responses/second', (request, response) => {
  response.render('requests/links/request-coordination/responses/second', {
    title: 'Link Request Coordination',
  });
});

router.get('/responses/main', (request, response) => {
  response.render('requests/links/request-coordination/responses/main', {
    title: 'Link Request Coordination',
  });
});

router.get('/responses/child', (request, response) => {
  response.render('requests/links/request-coordination/responses/child', {
    title: 'Link Request Coordination',
  });
});

export default router;
