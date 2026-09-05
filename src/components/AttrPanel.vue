<script setup lang="ts">
import { computed } from 'vue';
import type { RawNode } from '../types/snapshot';
import type { SelectedItem } from '../types/app';
import type { MatchResult } from '../lib/selector';
import { getNodeLabel, getShortName } from '../lib/snapshot';

interface Props {
  activeNode: RawNode | null;
  result: MatchResult | null;
  root: RawNode | null;
  items: SelectedItem[];
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'remove', nodeId: number): void }>();

const attrFields = [
  'name',
  'id',
  'vid',
  'text',
  'desc',
  'isClickable',
  'index',
  'depth',
  'childCount',
  'left',
  'top',
  'right',
  'bottom',
  'width',
  'height',
] as const;

const attrs = computed(() => {
  const a = props.activeNode?.attr;
  if (!a) return [];
  return attrFields
    .map((field) => ({ field, value: a[field] }))
    .filter((item) => item.value !== undefined && item.value !== null && item.value !== '');
});

const path = computed(() => {
  if (!props.activeNode || !props.root) return '';
  const names: string[] = [];
  let node: RawNode | undefined = props.activeNode;
  while (node) {
    names.unshift(getShortName(node.attr.name));
    if (node === props.root) break;
    node = node.parent;
  }
  return names.join(' > ');
});

const label = (item: SelectedItem) => getNodeLabel(item.node);
</script>

<template>
  <div class="attr">
    <template v-if="items.length">
      <div class="title">已选节点（{{ items.length }}）</div>
      <div class="sel-list">
        <div v-for="(item, index) in items" :key="item.nodeId" class="sel-row">
          <span class="sel-no">{{ index + 1 }}</span>
          <span class="sel-label">{{ label(item) }}</span>
          <button class="del" title="删除该绿色选中框" @click="emit('remove', item.nodeId)">×</button>
        </div>
      </div>
      <div v-if="!activeNode" class="hint">已选节点已按顺序登记到下方规则生成</div>
    </template>

    <template v-if="activeNode">
      <div class="title">节点路径</div>
      <div class="path">{{ path }}</div>
      <div class="title">属性</div>
      <div class="grid">
        <template v-for="item in attrs" :key="item.field">
          <span class="k">{{ item.field }}</span>
          <span class="v">{{ item.value }}</span>
        </template>
      </div>
      <div v-if="result" class="title">已生成 matches</div>
      <div v-if="result" class="selector">{{ result.selector }}</div>
      <div v-if="result" class="match" :class="{ warn: !result.exact }">
        命中 {{ result.matchIds.length }} 个节点{{ result.exact ? '，恰好唯一' : '（非唯一，需手动微调）' }}
      </div>
    </template>

    <template v-if="!activeNode && !items.length">
      <div class="empty">双击截图左侧以选中节点</div>
    </template>
  </div>
</template>

<style scoped>
.attr {
  font-size: 12px;
  overflow: auto;
  max-height: 100%;
}
.empty {
  color: #9ca3af;
  padding: 16px 8px;
}
.hint {
  color: #9ca3af;
  padding: 6px 8px;
}
.title {
  font-weight: 600;
  color: #374151;
  margin: 10px 0 4px;
}
.sel-list {
  display: flex;
  flex-direction: column;
}
.sel-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-bottom: 1px solid #f3f4f6;
}
.sel-no {
  min-width: 18px;
  padding: 1px 4px;
  background: #dcfce7;
  color: #166534;
  border-radius: 3px;
  text-align: center;
}
.sel-label {
  flex: 1;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.del {
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  line-height: 1;
}
.del:hover {
  color: #dc2626;
}
.path {
  color: #2563eb;
  word-break: break-all;
  background: #f9fafb;
  padding: 6px 8px;
  border-radius: 4px;
}
.grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 3px 10px;
}
.k {
  color: #6b7280;
}
.v {
  color: #111827;
  word-break: break-all;
}
.selector {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: #111827;
  color: #e5e7eb;
  padding: 8px;
  border-radius: 4px;
  word-break: break-all;
}
.match {
  margin-top: 4px;
  color: #16a34a;
}
.match.warn {
  color: #d97706;
}
</style>
