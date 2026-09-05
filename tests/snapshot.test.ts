import { describe, it, expect } from 'vitest';
import {
  buildNodeTree,
  findNodesAtPoint,
  getNodeLabel,
  getShortName,
} from '../src/lib/snapshot';
import { createSampleTree } from './fixtures';

describe('buildNodeTree', () => {
  it('构建父/子关系与深度信息', () => {
    const { snapshot, root, byId } = createSampleTree();
    const rebuilt = buildNodeTree(snapshot.nodes);
    expect(rebuilt.id).toBe(root.id);
    expect(rebuilt.parent).toBeUndefined();
    expect(rebuilt.attr!.depth).toBe(0);
    expect(rebuilt.children.length).toBe(1);
    expect(byId(1).parent!.id).toBe(0);
    expect(byId(1).children.length).toBe(3);
    expect(byId(2).attr!.depth).toBe(2);
  });
});

describe('findNodesAtPoint', () => {
  it('返回包含该点的最小面积节点', () => {
    const { root } = createSampleTree();
    const hits = findNodesAtPoint(root, 340, 750);
    expect(hits.map((n) => n.id)).toEqual([2]);
  });

  it('过滤掉被完全包含的祖先节点', () => {
    const { root } = createSampleTree();
    const hits = findNodesAtPoint(root, 100, 740);
    expect(hits.map((n) => n.id)).toEqual([3]);
  });

  it('坐标为边界时也能命中', () => {
    const { root } = createSampleTree();
    const hits = findNodesAtPoint(root, 200, 720);
    expect(hits).toContainEqual(expect.objectContaining({ id: 4 }));
  });
});

describe('getShortName / getNodeLabel', () => {
  it('截取类名最后一段', () => {
    expect(getShortName('android.widget.TextView')).toBe('TextView');
    expect(getShortName('TextView')).toBe('TextView');
  });

  it('标签包含短类名与文本', () => {
    const { byId } = createSampleTree();
    expect(getNodeLabel(byId(2))).toBe('TextView : 跳过广告');
  });
});
