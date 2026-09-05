import type { RawNode } from '../types/snapshot';

/** 截取 java 类名最后一段，如 android.widget.TextView -> TextView */
export const getShortName = (fullName: string): string => {
  const index = fullName?.lastIndexOf('.') ?? -1;
  return index === -1 ? fullName : fullName.slice(index + 1);
};

const cloneNode = (node: RawNode): RawNode => {
  const clone: RawNode = {
    ...node,
    attr: { ...node.attr },
    children: [],
    parent: undefined,
  };
  return clone;
};

/**
 * 把快照里扁平的 nodes 数组还原成带 parent/children 的树，返回根节点。
 * 返回的节点为浅克隆，避免破坏原始快照数据（便于后续 UI 响应式更新）。
 */
export const buildNodeTree = (nodes: RawNode[]): RawNode => {
  const map = new Map<number, RawNode>();
  nodes.forEach((node) => map.set(node.id, cloneNode(node)));

  let root!: RawNode;
  for (const node of map.values()) {
    const parent = map.get(node.pid);
    if (parent) {
      node.parent = parent;
      node.attr.index = node.attr.index ?? parent.children.length;
      node.attr.depth = (parent.attr?.depth ?? -1) + 1;
      parent.children.push(node);
    } else {
      node.attr.depth = 0;
      root = node;
    }
    node.attr._id = node.id;
    node.attr._pid = node.pid;
  }
  return root;
};

export function* traverseNode(root: RawNode, skip: Set<number> = new Set()): Generator<RawNode> {
  const stack: RawNode[] = [root];
  while (stack.length) {
    const node = stack.pop()!;
    if (skip.has(node.id)) continue;
    yield node;
    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push(node.children[i]);
    }
  }
}

const xyInNode = (node: RawNode, x: number, y: number): boolean => {
  const a = node.attr;
  if (a.left == null || a.right == null || a.top == null || a.bottom == null) return false;
  return a.left <= x && x <= a.right && a.top <= y && y <= a.bottom;
};

const includesRect = (outer: RawNode, inner: RawNode): boolean => {
  const o = outer.attr;
  const i = inner.attr;
  return o.left <= i.left && o.top <= i.top && o.right >= i.right && o.bottom >= i.bottom;
};

const equalRect = (a: RawNode, b: RawNode): boolean => {
  return (
    a.attr.left === b.attr.left &&
    a.attr.top === b.attr.top &&
    a.attr.right === b.attr.right &&
    a.attr.bottom === b.attr.bottom
  );
};

const isAncestor = (ancestor: RawNode | undefined, node: RawNode): boolean => {
  let p = node.parent;
  while (p) {
    if (p.id === ancestor?.id) return true;
    p = p.parent;
  }
  return false;
};

const nodeArea = (node: RawNode): number => {
  const w = node.attr.width ?? node.attr.right - node.attr.left;
  const h = node.attr.height ?? node.attr.bottom - node.attr.top;
  return w * h;
};

/**
 * 判断点 (x, y) 命中的候选节点，过滤掉被完全包含的祖先，
 * 按面积升序返回，第一个即“最小节点”。坐标使用截图自然像素。
 */
export const findNodesAtPoint = (root: RawNode, x: number, y: number): RawNode[] => {
  const results: RawNode[] = [];
  for (const node of traverseNode(root)) {
    if (node.attr.left == null) continue;
    if (xyInNode(node, x, y)) results.push(node);
  }
  if (results.length <= 1) return results;

  const filtered = results.filter(
    (node) => !results.some((other) => isAncestor(node, other) && includesRect(node, other)),
  );
  if (filtered.length <= 1) return filtered;

  const cleaned = filtered.filter(
    (node) =>
      !filtered.some(
        (other) =>
          node !== other &&
          (isAncestor(node, other) || isAncestor(node.parent, other)) &&
          includesRect(node, other) &&
          !equalRect(node, other),
      ),
  );
  return cleaned.sort((a, b) => nodeArea(a) - nodeArea(b));
};

const getSafeName = (node: RawNode): string => {
  const count = node.attr.childCount ?? node.children.length;
  return getShortName(node.attr.name || `Node`) + (count > 1 ? ` [${count}]` : '');
};

/** 生成节点在控件树 / 属性面板里显示的标签 */
export const getNodeLabel = (node: RawNode): string => {
  let label = getSafeName(node);
  if (node.children.length > 1) label = `${label} [${node.children.length}]`;
  const suffix = node.attr.text || node.attr.desc || node.attr.vid || node.attr.id;
  if (suffix) label = `${label} : ${suffix}`;
  return label;
};
