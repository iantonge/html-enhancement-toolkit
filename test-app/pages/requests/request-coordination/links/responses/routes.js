import { Router } from 'express';

const router = Router();

router.get('/responses/first', (request, response) => {
  response.render('requests/request-coordination/links/responses/first', {
    title: 'Link Request Coordination',
  });
});

router.get('/responses/second', (request, response) => {
  response.render('requests/request-coordination/links/responses/second', {
    title: 'Link Request Coordination',
  });
});

router.get('/responses/main', (request, response) => {
  response.render('requests/request-coordination/links/responses/main', {
    title: 'Link Request Coordination',
  });
});

router.get('/responses/child', (request, response) => {
  response.render('requests/request-coordination/links/responses/child', {
    title: 'Link Request Coordination',
  });
});

export default router;
