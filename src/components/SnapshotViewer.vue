<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { RawNode } from '../types/snapshot';

interface Props {
  imageUrl: string;
  imageSize: { width: number; height: number };
  activeNode: RawNode | null;
  confirmedNodes: RawNode[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'point', x: number, y: number): void;
}>();

const scrollRef = ref<HTMLDivElement>();
const avail = ref({ width: 0, height: 0 });
const zoom = ref(1);
let observer: ResizeObserver | undefined;

const measure = () => {
  if (!scrollRef.value) return;
  const width = scrollRef.value.clientWidth;
  const height = scrollRef.value.clientHeight;
  if (width === avail.value.width && height === avail.value.height) return;
  avail.value = { width, height };
};

onMounted(() => {
  measure();
  observer = new ResizeObserver(measure);
  if (scrollRef.value) observer.observe(scrollRef.value);
});
onUnmounted(() => observer?.disconnect());

const naturalW = computed(() => props.imageSize.width || 1);
const naturalH = computed(() => props.imageSize.height || 1);

/** 按可用区域 contain 缩放，保证整张图先完整放入 */
const fitScale = computed(() => {
  const { width, height } = avail.value;
  if (!width || !height) return 1;
  return Math.min(width / naturalW.value, height / naturalH.value);
});

const displayedWidth = computed(() => naturalW.value * fitScale.value * zoom.value);
const displayedHeight = computed(() => naturalH.value * fitScale.value * zoom.value);

const boxStyle = (node: RawNode): Record<string, string> => {
  const sx = displayedWidth.value / naturalW.value;
  const sy = displayedHeight.value / naturalH.value;
  const a = node.attr;
  return {
    left: `${a.left * sx}px`,
    top: `${a.top * sy}px`,
    width: `${(a.right - a.left) * sx}px`,
    height: `${(a.bottom - a.top) * sy}px`,
  };
};

const onDblclick = (ev: MouseEvent) => {
  const img = (ev.currentTarget as HTMLElement)?.querySelector('img');
  if (!img) return;
  const rect = img.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * naturalW.value;
  const y = ((ev.clientY - rect.top) / rect.height) * naturalH.value;
  emit('point', x, y);
};

const zoomIn = () => (zoom.value = Math.min(5, zoom.value * 1.25));
const zoomOut = () => (zoom.value = Math.max(0.2, zoom.value / 1.25));
const resetZoom = () => (zoom.value = 1);

const zoomPercent = computed(() => Math.round(zoom.value * 100));
</script>

<template>
  <div class="stage">
    <div class="zoombar">
      <button class="z" title="缩小" @click="zoomOut">－</button>
      <button class="z reset" title="适应窗口" @click="resetZoom">适应</button>
      <button class="z" title="放大" @click="zoomIn">＋</button>
      <span class="zn">{{ zoomPercent }}%</span>
    </div>

    <div ref="scrollRef" class="scroll">
      <div
        v-if="imageUrl"
        class="viewer"
        :style="{ width: displayedWidth + 'px', height: displayedHeight + 'px' }"
        @dblclick="onDblclick"
      >
        <img :src="imageUrl" class="screenshot" alt="广告截图" />

        <div
          v-for="node in confirmedNodes"
          :key="'g' + node.id"
          class="box green"
          :style="boxStyle(node)"
        ></div>

        <div v-if="activeNode" class="box active" :style="boxStyle(activeNode)"></div>
      </div>

      <div v-else class="placeholder">请导入 GKD 快照 zip</div>
    </div>
  </div>
</template>

<style scoped>
.stage {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: #111827;
}
.zoombar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  flex: none;
}
.z {
  width: 26px;
  height: 26px;
  border: 1px solid #374151;
  background: #1f2937;
  color: #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  line-height: 1;
}
.z.reset {
  width: auto;
  padding: 0 10px;
  font-size: 12px;
}
.zn {
  color: #9ca3af;
  font-size: 12px;
}
.scroll {
  flex: 1;
  overflow: auto;
  min-height: 0;
}
.viewer {
  position: relative;
  margin: 0 auto;
  line-height: 0;
  overflow: visible;
}
.screenshot {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
}
.box {
  position: absolute;
  pointer-events: none;
  border: 1.5px solid transparent;
  box-sizing: border-box;
}
.box.active {
  border-color: rgba(37, 99, 235, 0.9);
}
.box.green {
  border-color: rgba(22, 163, 74, 0.9);
}
.placeholder {
  color: #9ca3af;
  padding: 48px;
  line-height: 1.5;
  text-align: center;
}
</style>
