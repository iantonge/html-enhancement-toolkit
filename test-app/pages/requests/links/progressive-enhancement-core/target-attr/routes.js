import { Router } from 'express';

const router = Router();

router.get('/target-attr', (request, response) => {
  response.render('requests/links/progressive-enhancement-core/target-attr/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
