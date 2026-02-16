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

router.get('/requests-components-model-seed', (request, response) => {
  response.render('integration/requests-components-model-seed/index', {
    title: 'Requests + Components model seed',
  });
});

router.get('/requests-components-model-seed/response', (request, response) => {
  response.render('integration/requests-components-model-seed/response', {
    title: 'Requests + Components model seed response',
  });
});

export default router;
