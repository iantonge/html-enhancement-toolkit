import { Router } from 'express';

const router = Router();

router.get('/responses/first', (request, response) => {
  response.render('requests/forms/request-coordination/responses/first', {
    title: 'Form Request Coordination',
  });
});

router.get('/responses/second', (request, response) => {
  response.render('requests/forms/request-coordination/responses/second', {
    title: 'Form Request Coordination',
  });
});

router.get('/responses/main', (request, response) => {
  response.render('requests/forms/request-coordination/responses/main', {
    title: 'Form Request Coordination',
  });
});

router.get('/responses/child', (request, response) => {
  response.render('requests/forms/request-coordination/responses/child', {
    title: 'Form Request Coordination',
  });
});

export default router;
