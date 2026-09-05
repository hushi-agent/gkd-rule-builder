import type { RawNode } from './snapshot';
import type { MatchResult } from '../lib/selector';

export interface SelectedItem {
  nodeId: number;
  node: RawNode;
  result: MatchResult;
}
