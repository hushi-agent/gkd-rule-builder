import { Selector, Transform, MatchOption } from '@gkd-kit/selector';
import type { RawNode } from '../types/snapshot';
import { getShortName, traverseNode } from './snapshot';

const defaultMatchOption = (MatchOption as unknown as { default: MatchOption }).default;

export interface MatchResult {
  selector: string;
  exact: boolean;
  matchIds: number[];
  source: 'attr' | 'structure' | 'none';
}

/** unwrap：selector 引擎回调里第一个参数可能是 QueryContext，取 .current */
const unwrap = <T extends RawNode>(p0: unknown): T => {
  return ((p0 as { current?: T })?.current ?? p0) as T;
};

const buildTransform = () => {
  return Transform.Companion.multiplatformBuild<RawNode>(
    (p0, name) => {
      const node = unwrap(p0);
      const value = node?.attr?.[name as keyof typeof node.attr];
      return value ?? null;
    },
    (p0, name, argsa) => {
      const node = unwrap(p0);
      const a = node.attr;
      if (name === 'text') {
        const text = a.text ?? '';
        return {
          length: () => text.length,
          size: () => text.length,
          get: (index: number) => text[index],
        };
      }
      if (name === 'desc') {
        const desc = a.desc ?? '';
        return {
          length: () => desc.length,
          size: () => desc.length,
          get: (index: number) => desc[index],
        };
      }
      void argsa;
      return undefined;
    },
    (node) => unwrap(node).attr.name,
    (node) => unwrap(node).children,
    (node) => unwrap(node).parent ?? null,
  );
};

/** 运行选择器，返回其在当前快照中命中节点的 id 列表 */
export const getMatchIds = (root: RawNode, selector: string): number[] => {
  const parsed = Selector.Companion.parseOrNull(selector);
  if (!parsed) return [];
  try {
    return transform
      .querySelectorAllArray(root, parsed, defaultMatchOption)
      .map((node) => (node as RawNode).id);
  } catch {
    return [];
  }
};

let transform: Transform<RawNode>;
const ensureTransform = () => {
  transform = buildTransform();
  return transform;
};

export const getMatchResult = (root: RawNode, selector: string): number[] => {
  ensureTransform();
  return getMatchIds(root, selector);
};

const quote = (value: string): string => JSON.stringify(value);

const structuralSelector = (root: RawNode, node: RawNode): string => {
  if (node === root) return '[parent=null]';
  const chain: string[] = [];
  let cur: RawNode | undefined = node;
  while (cur) {
    chain.unshift(getShortName(cur.attr.name));
    if (cur === root) break;
    cur = cur.parent;
  }
  return chain.join(' > ');
};

/** 判断一个属性值在整棵树中是否唯一 */
const isAttrUnique = (
  root: RawNode,
  key: 'vid' | 'id' | 'text' | 'desc',
  value: string,
): boolean => {
  let count = 0;
  for (const node of traverseNode(root)) {
    if (node.attr[key] === value) {
      count++;
      if (count > 1) return false;
    }
  }
  return count === 1;
};

/**
 * 根据选中的节点生成 matches。
 * 优先使用唯一静态属性（vid/id/text/desc），否则回退为类名层级结构路径。
 * 会实时运行选择器核验命中结果，并给出是否恰好命中目标节点。
 */
export const generateMatches = (root: RawNode, node: RawNode): MatchResult => {
  const candidates: Array<{ key: 'vid' | 'id' | 'text' | 'desc'; value: string }> = [];
  for (const key of ['vid', 'id', 'text', 'desc'] as const) {
    const value = node.attr[key];
    if (value && isAttrUnique(root, key, value)) candidates.push({ key, value });
  }

  for (const { key, value } of candidates) {
    const selector = `[${key}=${quote(value)}]`;
    const matchIds = getMatchResult(root, selector);
    if (matchIds.length === 1 && matchIds[0] === node.id) {
      return { selector, exact: true, matchIds, source: 'attr' };
    }
  }

  const selector = structuralSelector(root, node);
  if (selector) {
    const matchIds = getMatchResult(root, selector);
    return {
      selector,
      exact: matchIds.length === 1 && matchIds[0] === node.id,
      matchIds,
      source: 'structure',
    };
  }

  return { selector: '[parent=null]', exact: false, matchIds: [], source: 'none' };
};
