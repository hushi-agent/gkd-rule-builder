import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { buildNodeTree } from '../src/lib/snapshot';
import { useSelection } from '../src/composables/useSelection';
import { createSampleTree } from './fixtures';

const make = () => {
  const { snapshot } = createSampleTree();
  const root = ref(buildNodeTree(snapshot.nodes));
  return useSelection(root);
};

describe('useSelection', () => {
  it('双击选中最小节点为蓝色', () => {
    const api = make();
    api.onPoint(340, 750);
    expect(api.activeNode.value?.id).toBe(2);
    expect(api.confirmed.value).toHaveLength(0);
  });

  it('双击其他区域时保存蓝色为绿色并开始新选择', () => {
    const api = make();
    api.onPoint(340, 750);
    api.onPoint(100, 740);
    expect(api.confirmed.value.map((n) => n.nodeId)).toEqual([2]);
    expect(api.activeNode.value?.id).toBe(3);
    expect(api.confirmed.value[0].result.selector).toBe('[vid="btn_skip"]');
  });

  it('切换、放大、缩小在容器间移动', () => {
    const api = make();
    api.onPoint(100, 740); // active = 3 (TextView)
    api.switchSibling(); // -> 4 (ImageView)
    expect(api.activeNode.value?.id).toBe(4);
    api.zoomIn(); // -> 1 (LinearLayout)
    expect(api.activeNode.value?.id).toBe(1);
    api.zoomOut(); // -> 第一个子节点 2 (TextView)
    expect(api.activeNode.value?.id).toBe(2);
  });

  it('关闭仅撤销当前蓝色，不影响绿色列表', () => {
    const api = make();
    api.onPoint(340, 750);
    api.onPoint(100, 740); // 保存 node2 为绿色，active=3
    api.close();
    expect(api.activeNode.value).toBeNull();
    expect(api.confirmed.value).toHaveLength(1);
  });

  it('确认按钮保存当前蓝色为绿色并结束选择', () => {
    const api = make();
    api.onPoint(340, 750); // active = node2
    api.confirm();
    expect(api.confirmed.value.map((n) => n.nodeId)).toEqual([2]);
    expect(api.activeNode.value).toBeNull();
  });

  it('可从列表移除已确认节点', () => {
    const api = make();
    api.onPoint(340, 750);
    api.onPoint(100, 740);
    api.remove(2);
    expect(api.confirmed.value).toHaveLength(0);
  });
});
