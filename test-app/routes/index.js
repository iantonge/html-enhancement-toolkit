import { Router } from 'express';

export const path = '/';
export const router = Router();

const buildTabs = () => ([
  {
    label: 'Overview',
    tabId: 'tab-overview',
    panelId: 'panel-overview',
    content: 'Lightweight enhancements on top of server-rendered HTML using small, declarative hooks.',
    selected: true
  },
  {
    label: 'Interactions',
    tabId: 'tab-interactions',
    panelId: 'panel-interactions',
    content: 'Use het-on attributes to map DOM events to component methods and keep logic close to the markup.'
  },
  {
    label: 'Composition',
    tabId: 'tab-composition',
    panelId: 'panel-composition',
    content: 'Author components as partials, bundle their configs automatically, and reuse them across pages.'
  }
]);

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Demo',
    tabs: buildTabs(),
  });
});
