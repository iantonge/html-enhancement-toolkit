import { Router } from 'express';

const router = Router();

router.get('/responses/partial', (request, response) => {
  response.render('requests/links/het-also/responses/partial', {
    title: 'Link het-also',
  });
});

router.get('/responses/missing', (request, response) => {
  response.render('requests/links/het-also/responses/missing', {
    title: 'Link het-also',
  });
});

router.get('/responses/inside-target', (request, response) => {
  response.render('requests/links/het-also/responses/inside-target', {
    title: 'Link het-also',
  });
});

router.get('/responses/inside-response', (request, response) => {
  response.render('requests/links/het-also/responses/inside-response', {
    title: 'Link het-also',
  });
});

router.get('/responses/multi', (request, response) => {
  response.render('requests/links/het-also/responses/multi', {
    title: 'Link het-also',
  });
});

export default router;
