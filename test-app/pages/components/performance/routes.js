import { Router } from 'express';

const router = Router();

const scales = {
  small: {
    groupCount: 40,
    itemsPerGroup: 8,
  },
  large: {
    groupCount: 200,
    itemsPerGroup: 24,
  },
};

router.get('/mount-baseline', (request, response) => {
  const scaleName = Object.hasOwn(scales, request.query.scale)
    ? request.query.scale
    : 'large';
  const groupSignalEffects = request.query.groupSignalEffects === 'true';
  const groupedBindings = groupSignalEffects || request.query.groupedBindings === 'true';
  const { groupCount, itemsPerGroup } = scales[scaleName];
  const groups = Array.from({ length: groupCount }, (_, groupIndex) => ({
    id: groupIndex + 1,
    items: Array.from({ length: itemsPerGroup }, (_, itemIndex) => ({
      id: (groupIndex * itemsPerGroup) + itemIndex + 1,
    })),
  }));

  response.render('components/performance/mount-baseline', {
    title: 'Component Mount Performance Baseline',
    expectedComponentCount: 1 + groupCount + (groupCount * itemsPerGroup),
    groupedBindings,
    groupSignalEffects,
    scaleName,
    groups,
  });
});

export default router;
