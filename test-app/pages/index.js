import express from 'express'

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  const tabs = [
    {
      label: 'Tab one',
      tabId: 'tab1',
      panelId: 'panel1',
      selected: true,
      content: 'Tab one content'
    },
    {
      label: 'Tab two',
      tabId: 'tab2',
      panelId: 'panel2',
      selected: false,
      content: 'Tab two content'
    },
    {
      label: 'Tab three',
      tabId: 'tab3',
      panelId: 'panel3',
      selected: false,
      content: 'Tab three content'
    },
  ]
  res.render('index', { title: 'Index', tabs });
});

export default router;
