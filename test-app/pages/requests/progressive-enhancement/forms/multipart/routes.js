import { Router } from 'express';

const router = Router();

router.get('/multipart', (request, response) => {
  response.render('requests/progressive-enhancement/forms/multipart/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
