<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SelectedItem } from '../types/app';
import { composeRuleApp, toJson5 } from '../lib/rule';

interface Props {
  appId: string;
  appName: string;
  items: SelectedItem[];
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:appId', value: string): void }>();

const GROUP_NAME = '开屏广告';
const copied = ref(false);

const code = computed(() => {
  if (!props.items.length) return '';
  return toJson5(
    composeRuleApp({
      appId: props.appId,
      appName: props.appName,
      groupName: GROUP_NAME,
      activityId: undefined,
      selectors: props.items.map((item) => ({ nodeId: item.nodeId, matches: item.result.selector })),
    }),
  );
});

const hasWarning = computed(() => props.items.some((item) => !item.result.exact));

const copy = async () => {
  if (!code.value) return;
  await navigator.clipboard.writeText(code.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
};

const download = () => {
  if (!code.value) return;
  const blob = new Blob([code.value], { type: 'application/json5' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${props.appId || 'gkd-rule'}.json5`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <div class="rule">
    <div class="appid-row">
      <label>应用包名</label>
      <div class="appid-input">
        <input :value="appId" @input="emit('update:appId', ($event.target as HTMLInputElement).value)" />
        <button class="export" title="一键导出 .json5" :disabled="!code" @click="download">导出</button>
      </div>
    </div>

    <div class="count">已确认节点：{{ items.length }}（在“属性 / 匹配”中管理）</div>
    <div class="desc">自动屏蔽：开屏广告出现即自动点掉跳过/关闭按钮（10 秒匹配窗口，每次启动最多执行 1 次）。</div>

    <div class="out">
      <div class="out-head">
        <span>屏蔽规则 JSON5 预览</span>
        <span v-if="hasWarning" class="warn">存在非唯一选择器</span>
        <button :disabled="!code" @click="copy">{{ copied ? '已复制' : '复制' }}</button>
      </div>
      <pre>{{ code || '请先在“属性 / 匹配”中确认开屏广告的跳过/关闭节点，再查看自动屏蔽规则预览' }}</pre>
    </div>
  </div>
</template>

<style scoped>
.rule {
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}
.appid-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.appid-row label {
  color: #6b7280;
}
.appid-input {
  display: flex;
  gap: 6px;
}
.appid-input input {
  flex: 1;
  min-width: 0;
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.export {
  padding: 5px 12px;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}
.export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.count {
  color: #9ca3af;
}
.desc {
  color: #6b7280;
  line-height: 1.5;
  padding: 4px 8px;
  background: #f0fdf4;
  border-radius: 4px;
}
.out {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.out-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
}
.out-head .warn {
  color: #d97706;
  font-weight: 400;
}
.out-head button {
  margin-left: auto;
  font-size: 12px;
  padding: 3px 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}
.out-head button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.out pre {
  margin: 0;
  padding: 10px;
  overflow: auto;
  background: #111827;
  color: #e5e7eb;
  font-size: 12px;
  line-height: 1.5;
  flex: 1;
}
</style>
