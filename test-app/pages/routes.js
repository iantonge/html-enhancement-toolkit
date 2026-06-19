import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('index', { title: 'HTML Enhancement Toolkit' });
});

export default router;
