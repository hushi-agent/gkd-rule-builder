import { ref, type Ref } from 'vue';
import type { RawNode } from '../types/snapshot';
import type { SelectedItem } from '../types/app';
import { findNodesAtPoint } from '../lib/snapshot';
import { generateMatches } from '../lib/selector';

export interface SelectionApi {
  activeNode: Ref<RawNode | null>;
  confirmed: Ref<SelectedItem[]>;
  selectNode: (node: RawNode) => void;
  onPoint: (x: number, y: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  switchSibling: () => void;
  confirm: () => void;
  close: () => void;
  remove: (nodeId: number) => void;
  reset: () => void;
}

/**
 * 封装“选点 -> 确认加入列表 -> 微调（父/子/兄弟） -> 撤销”的交互状态机。
 * 蓝色 = 当前编辑中节点；绿色 = 已加入待生成列表。
 */
export const useSelection = (root: Ref<RawNode | null>): SelectionApi => {
  const activeNode = ref<RawNode | null>(null);
  const confirmed = ref<SelectedItem[]>([]);
  let siblingCursor = 0;
  let childCursor = 0;

  const pointInNode = (node: RawNode, x: number, y: number) => {
    const a = node.attr;
    return a.left <= x && x <= a.right && a.top <= y && y <= a.bottom;
  };

  const selectNode = (node: RawNode) => {
    siblingCursor = node.parent?.children.indexOf(node) ?? 0;
    childCursor = 0;
    activeNode.value = node;
  };

  const confirmNode = (node: RawNode) => {
    if (confirmed.value.some((n) => n.nodeId === node.id)) return;
    const result = generateMatches(root.value!, node);
    confirmed.value.push({ nodeId: node.id, node, result });
  };

  const onPoint = (x: number, y: number) => {
    if (!root.value) return;
    // 双击落在当前蓝色选框内部：忽略，避免误操作
    if (activeNode.value && pointInNode(activeNode.value, x, y)) return;
    const hits = findNodesAtPoint(root.value, x, y);
    // 蓝色尚未关闭 -> 直接双击其他区域默认保存为绿色
    if (activeNode.value) confirmNode(activeNode.value);
    const next = hits[0];
    if (!next) {
      activeNode.value = null;
      return;
    }
    // 点击目标是当前节点或已确认节点时不重复新建蓝色
    if (next.id === activeNode.value?.id || confirmed.value.some((n) => n.nodeId === next.id)) {
      activeNode.value = null;
      return;
    }
    selectNode(next);
  };

  const zoomIn = () => {
    if (!activeNode.value?.parent) return;
    activeNode.value = activeNode.value.parent;
    childCursor = 0;
    siblingCursor = activeNode.value.parent?.children.indexOf(activeNode.value) ?? 0;
  };

  const zoomOut = () => {
    const node = activeNode.value;
    if (!node?.children.length) return;
    const child = node.children[childCursor % node.children.length];
    childCursor++;
    siblingCursor = node.children.indexOf(child);
    activeNode.value = child;
  };

  const switchSibling = () => {
    const node = activeNode.value;
    const siblings = node?.parent?.children ?? (node ? [node] : []);
    if (!node || siblings.length <= 1) return;
    siblingCursor = (siblingCursor + 1) % siblings.length;
    activeNode.value = siblings[siblingCursor];
    childCursor = 0;
  };

  const confirm = () => {
    if (!activeNode.value) return;
    confirmNode(activeNode.value);
    activeNode.value = null;
    siblingCursor = 0;
    childCursor = 0;
  };

  const close = () => {
    activeNode.value = null;
  };

  const remove = (nodeId: number) => {
    confirmed.value = confirmed.value.filter((n) => n.nodeId !== nodeId);
  };

  const reset = () => {
    activeNode.value = null;
    confirmed.value = [];
    siblingCursor = 0;
    childCursor = 0;
  };

  return {
    activeNode,
    confirmed,
    selectNode,
    onPoint,
    zoomIn,
    zoomOut,
    switchSibling,
    confirm,
    close,
    remove,
    reset,
  };
};
