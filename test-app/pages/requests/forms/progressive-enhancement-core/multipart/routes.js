import { Router } from 'express';

const router = Router();

router.get('/multipart', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/multipart/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
