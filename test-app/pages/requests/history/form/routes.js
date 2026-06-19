import { Router } from 'express';

const router = Router();

router.get('/form', (request, response) => {
  response.render('requests/history/form/index', {
    title: 'Form popstate',
    description: 'Initial form history description',
  });
});

export default router;
