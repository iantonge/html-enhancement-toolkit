import { Router } from 'express';

const router = Router();

router.get('/responses/partial', (request, response) => {
  response.render('requests/het-also/links/responses/partial', {
    title: 'Link het-also',
  });
});

router.get('/responses/missing', (request, response) => {
  response.render('requests/het-also/links/responses/missing', {
    title: 'Link het-also',
  });
});

router.get('/responses/inside-target', (request, response) => {
  response.render('requests/het-also/links/responses/inside-target', {
    title: 'Link het-also',
  });
});

router.get('/responses/inside-response', (request, response) => {
  response.render('requests/het-also/links/responses/inside-response', {
    title: 'Link het-also',
  });
});

router.get('/responses/multi', (request, response) => {
  response.render('requests/het-also/links/responses/multi', {
    title: 'Link het-also',
  });
});

export default router;
