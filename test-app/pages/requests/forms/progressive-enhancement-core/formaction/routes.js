import { Router } from 'express';

const router = Router();

router.get('/formaction', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/formaction/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
