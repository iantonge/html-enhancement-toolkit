import { Router } from 'express';

const router = Router();

router.get('/post', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/post/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
