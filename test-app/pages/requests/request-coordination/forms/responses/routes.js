import { Router } from 'express';

const router = Router();

router.get('/responses/first', (request, response) => {
  response.render('requests/request-coordination/forms/responses/first', {
    title: 'Form Request Coordination',
  });
});

router.get('/responses/second', (request, response) => {
  response.render('requests/request-coordination/forms/responses/second', {
    title: 'Form Request Coordination',
  });
});

router.get('/responses/main', (request, response) => {
  response.render('requests/request-coordination/forms/responses/main', {
    title: 'Form Request Coordination',
  });
});

router.get('/responses/child', (request, response) => {
  response.render('requests/request-coordination/forms/responses/child', {
    title: 'Form Request Coordination',
  });
});

export default router;
