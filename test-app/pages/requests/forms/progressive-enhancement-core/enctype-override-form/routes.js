import { Router } from 'express';

const router = Router();

router.get('/enctype-override-form', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/enctype-override-form/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
