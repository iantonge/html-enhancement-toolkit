import { Router } from 'express';

const router = Router();

router.get('/additional', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/additional-value/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
