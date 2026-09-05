<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue';
import type { RawNode } from '../types/snapshot';
import { getNodeLabel, getShortName } from '../lib/snapshot';

interface Props {
  root: RawNode | null;
  activeNodeId: number | null;
  confirmedIds: number[];
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'select', node: RawNode): void }>();

const rows = computed(() => {
  if (!props.root) return [];
  const list: Array<{ node: RawNode; depth: number }> = [];
  const stack: Array<{ node: RawNode; depth: number }> = [{ node: props.root, depth: 0 }];
  while (stack.length) {
    const { node, depth } = stack.pop()!;
    list.push({ node, depth });
    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push({ node: node.children[i], depth: depth + 1 });
    }
  }
  return list;
});

const activeRow = ref<HTMLElement>();
const scrolledId = ref<number | null>(null);

watch(
  () => props.activeNodeId,
  async (id) => {
    if (id == null) return;
    await nextTick();
    scrolledId.value = id;
    activeRow.value?.scrollIntoView({ block: 'nearest' });
  },
);

const isActive = (id: number) => props.activeNodeId === id;
const isConfirmed = (id: number) => props.confirmedIds.includes(id);

const ancestorIds = computed(() => {
  if (!props.root || !props.activeNodeId) return new Set<number>();
  const set = new Set<number>();
  let node: RawNode | undefined = rows.value.find((r) => r.node.id === props.activeNodeId)?.node;
  while (node) {
    set.add(node.id);
    node = node.parent;
  }
  return set;
});
</script>

<template>
  <div class="tree" v-if="root">
    <div
      v-for="row in rows"
      :key="row.node.id"
      :ref="(el) => { if (isActive(row.node.id) && el) activeRow = el as HTMLElement }"
      class="row"
      :class="{ active: isActive(row.node.id), confirmed: isConfirmed(row.node.id), path: ancestorIds.has(row.node.id) }"
      :style="{ paddingLeft: `${row.depth * 14 + 6}px` }"
      @click="emit('select', row.node)"
    >
      <span class="name">{{ getShortName(row.node.attr.name) }}</span>
      <span class="label">{{ getNodeLabel(row.node) }}</span>
    </div>
  </div>
</template>

<style scoped>
.tree {
  max-height: 100%;
  overflow: auto;
  font-size: 12px;
  min-height: 0;
}
.row {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 3px 6px;
  cursor: pointer;
  border-left: 2px solid transparent;
  border-radius: 3px;
  white-space: nowrap;
}
.row:hover {
  background: #f3f4f6;
}
.row.path {
  border-left-color: #dbeafe;
}
.row.active {
  background: #dbeafe;
  border-left-color: #2563eb;
}
.row.confirmed {
  background: #dcfce7;
  border-left-color: #16a34a;
}
.name {
  font-weight: 600;
  color: #374151;
}
.label {
  color: #6b7280;
}
</style>
