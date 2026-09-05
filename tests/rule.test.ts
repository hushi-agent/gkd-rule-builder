import { describe, it, expect } from 'vitest';
import { composeRuleApp, toJson5 } from '../src/lib/rule';
import { createSampleTree } from './fixtures';

describe('composeRuleApp', () => {
  it('输出应用级规则，每条已选节点对应一条 rule', () => {
    const { snapshot } = createSampleTree();
    const app = composeRuleApp({
      appId: snapshot.appId,
      appName: snapshot.appName || '',
      groupName: '开屏广告',
      selectors: [
        { nodeId: 2, matches: '[vid="btn_skip"]' },
        { nodeId: 3, matches: '[text="广告"]' },
      ],
      activityId: snapshot.activityId,
    });
    expect(app.id).toBe('com.example.demo');
    expect(app.name).toBe('Demo');
    expect(app.groups).toHaveLength(1);
    const group = app.groups![0];
    expect(group.key).toBe(1);
    expect(group.name).toBe('开屏广告');
    expect(group.rules).toHaveLength(2);
    expect(group.rules![0].key).toBe(0);
    expect(group.rules![0].matches).toBe('[vid="btn_skip"]');
    expect(group.rules![0].action).toBe('clickCenter');
    expect(group.rules![0].fastQuery).toBe(true);
    expect(group.rules![0].activityIds).toBe('com.example.MainActivity');
    expect(group.matchTime).toBe(10000);
    expect(group.actionMaximum).toBe(1);
    expect(group.resetMatch).toBe('app');
  });
});

describe('toJson5', () => {
  it('以 JSON5 风格输出未加引号的键', () => {
    const { snapshot } = createSampleTree();
    const app = composeRuleApp({
      appId: snapshot.appId,
      appName: snapshot.appName || '',
      groupName: '规则组',
      selectors: [{ nodeId: 2, matches: '[vid="btn_skip"]' }],
      activityId: snapshot.activityId,
    });
    const text = toJson5(app);
    expect(text).toContain('id:');
    expect(text).toContain('matches:');
    expect(text).toContain("'clickCenter'");
  });
});
