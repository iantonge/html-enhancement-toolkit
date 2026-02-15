import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('integration/index', {
    title: 'Integration',
  });
});

router.get('/requests-components-sync', (request, response) => {
  response.render('integration/requests-components-sync/index', {
    title: 'Requests + Components sync',
  });
});

router.get('/requests-components-sync/response', (request, response) => {
  response.render('integration/requests-components-sync/response', {
    title: 'Requests + Components sync response',
  });
});

export default router;
