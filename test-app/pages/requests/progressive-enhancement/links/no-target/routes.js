import { Router } from 'express';

const router = Router();

router.get('/no-target', (request, response) => {
  response.render('requests/progressive-enhancement/links/no-target/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
