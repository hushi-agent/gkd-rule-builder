import { describe, it, expect } from 'vitest';
import { buildNodeTree } from '../src/lib/snapshot';
import { generateMatches, getMatchResult } from '../src/lib/selector';
import { createSampleTree } from './fixtures';

const tree = createSampleTree();
const root = buildNodeTree(tree.snapshot.nodes);

describe('generateMatches', () => {
  it('优先使用 vid 生成选择器且恰好唯一命中', () => {
    const target = tree.byId(2);
    const res = generateMatches(root, target);
    expect(res.selector).toBe('[vid="btn_skip"]');
    expect(res.exact).toBe(true);
    expect(res.matchIds).toEqual([2]);
  });

  it('无 vid/id 时回退到结构路径', () => {
    const target = tree.byId(4);
    const res = generateMatches(root, target);
    expect(res.selector).toContain('ImageView');
    expect(res.exact).toBe(true);
    expect(res.matchIds).toEqual([4]);
  });
});

describe('getMatchResult', () => {
  it('返回选中器在当前快照中命中的节点列表', () => {
    const ids = getMatchResult(root, '[vid="btn_skip"]');
    expect(ids).toEqual([2]);
  });
});
