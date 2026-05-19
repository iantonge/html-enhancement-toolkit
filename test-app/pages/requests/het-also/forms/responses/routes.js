import { Router } from 'express';

const router = Router();

router.get('/responses/partial', (request, response) => {
  response.render('requests/het-also/forms/responses/partial', {
    title: 'Form het-also',
  });
});

router.get('/responses/missing', (request, response) => {
  response.render('requests/het-also/forms/responses/missing', {
    title: 'Form het-also',
  });
});

router.get('/responses/inside-target', (request, response) => {
  response.render('requests/het-also/forms/responses/inside-target', {
    title: 'Form het-also',
  });
});

router.get('/responses/inside-response', (request, response) => {
  response.render('requests/het-also/forms/responses/inside-response', {
    title: 'Form het-also',
  });
});

router.get('/responses/multi', (request, response) => {
  response.render('requests/het-also/forms/responses/multi', {
    title: 'Form het-also',
  });
});

export default router;
