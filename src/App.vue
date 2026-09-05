<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import JSZip from 'jszip';
import SnapshotViewer from './components/SnapshotViewer.vue';
import NodeTree from './components/NodeTree.vue';
import AttrPanel from './components/AttrPanel.vue';
import RulePanel from './components/RulePanel.vue';
import InstallPrompt from './components/InstallPrompt.vue';
import type { Snapshot, RawNode } from './types/snapshot';
import type { MatchResult } from './lib/selector';
import { buildNodeTree } from './lib/snapshot';
import { useSelection } from './composables/useSelection';
import { createDemoSnapshot } from './lib/demo';

const appId = ref('');
const appName = ref('');
const snapshot = ref<Snapshot | null>(null);
const root = ref<RawNode | null>(null);
const imageUrl = ref('');
const imageSize = ref({ width: 0, height: 0 });
const loading = ref(false);
const message = ref('');

const fileInput = ref<HTMLInputElement>();

const {
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
} = useSelection(root);

const confirmedIds = computed(() => confirmed.value.map((item) => item.nodeId));
const activeResult = computed<MatchResult | null>(() => {
  if (!activeNode.value) return null;
  const item = confirmed.value.find((n) => n.nodeId === activeNode.value!.id);
  return item ? item.result : null;
});
const canZoomIn = computed(() => Boolean(activeNode.value?.parent));
const canZoomOut = computed(() => Boolean(activeNode.value?.children.length));
const canSwitch = computed(() => {
  const node = activeNode.value;
  const siblings = node?.parent?.children ?? (node ? [node] : []);
  return Boolean(node) && siblings.length > 1;
});
const canClose = computed(() => Boolean(activeNode.value));
const canConfirm = computed(() => Boolean(activeNode.value));

const loadImageSize = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
};

const parseSnapshot = (jsonText: string): Snapshot => {
  return JSON.parse(jsonText) as Snapshot;
};

const importZip = async (file: File) => {
  loading.value = true;
  message.value = '';
  try {
    const zip = await JSZip.loadAsync(file);
    const jsonEntry = zip.file(/\.json$/i).sort((a, b) => a.name.localeCompare(b.name))[0];
    const imageEntry = zip.file(/\.(png|webp)$/i).sort((a, b) => a.name.localeCompare(b.name))[0];
    if (!jsonEntry || !imageEntry) {
      throw new Error('zip 内未找到 json 快照与 png 截图');
    }
    const jsonText = await jsonEntry.async('string');
    const imageBf = await imageEntry.async('arraybuffer');

    const snap = parseSnapshot(jsonText);
    if (!snap.nodes?.length) throw new Error('快照缺少 nodes 节点信息');

    if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
    const blob = new Blob([imageBf]);
    const url = URL.createObjectURL(blob);
    const size = await loadImageSize(url);

    snapshot.value = snap;
    imageUrl.value = url;
    imageSize.value = size;
    root.value = buildNodeTree(snap.nodes);
    appId.value = snap.appId || '';
    appName.value = snap.appName || snap.appInfo?.name || '';
    reset();
    message.value = `已导入快照 #${snap.id}，共 ${snap.nodes.length} 个节点`;
  } catch (e) {
    message.value = `导入失败：${(e as Error).message || e}`;
  } finally {
    loading.value = false;
  }
};

const onFilePicked = async (ev: Event) => {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) await importZip(file);
  input.value = '';
};

const triggerFile = () => fileInput.value?.click();
const loadDemo = () => {
  const demo = createDemoSnapshot();
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  snapshot.value = demo.snapshot;
  imageUrl.value = demo.imageDataUrl;
  imageSize.value = { width: demo.snapshot.screenWidth, height: demo.snapshot.screenHeight };
  root.value = buildNodeTree(demo.snapshot.nodes);
  appId.value = demo.snapshot.appId;
  appName.value = demo.snapshot.appName || '';
  reset();
  message.value = '已加载示例快照，可双击截图体验选点';
};

watch(
  () => snapshot.value?.appId,
  (id) => {
    if (id) appId.value = id;
  },
);
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>GKD 本地规则生成器</h1>
      <div class="actions">
        <input ref="fileInput" type="file" accept=".zip" style="display: none" @change="onFilePicked" />
        <button class="primary" :disabled="loading" @click="triggerFile">
          {{ loading ? '导入中…' : '导入快照 zip' }}
        </button>
        <button class="ghost" :disabled="loading" @click="loadDemo">加载示例快照</button>
      </div>
      <span v-if="message" class="msg">{{ message }}</span>
    </header>

    <main class="body">
      <section class="viewer-page">
        <SnapshotViewer
          :image-url="imageUrl"
          :image-size="imageSize"
          :active-node="activeNode"
          :confirmed-nodes="confirmed.map((c) => c.node)"
          @point="onPoint"
        />
      </section>

      <section class="side">
        <div class="panel tree-panel">
          <div class="panel-title">控件节点树</div>
          <NodeTree
            :root="root"
            :active-node-id="activeNode?.id ?? null"
            :confirmed-ids="confirmedIds"
            @select="selectNode"
          />
          <div class="opbar">
            <button :disabled="!canZoomIn" title="放大（父级容器）" @click="zoomIn">放大</button>
            <button :disabled="!canZoomOut" title="缩小（子级容器）" @click="zoomOut">缩小</button>
            <button :disabled="!canSwitch" title="切换（同级容器）" @click="switchSibling">切换</button>
            <button :disabled="!canConfirm" title="确认：保存为绿色并在列表中登记" @click="confirm">确认</button>
            <button :disabled="!canClose" title="撤销当前节点" @click="close">关闭</button>
          </div>
        </div>
        <div class="panel attr-panel">
          <div class="panel-title">属性 / 匹配</div>
          <AttrPanel
            :active-node="activeNode"
            :result="activeResult"
            :root="root"
            :items="confirmed"
            @remove="remove"
          />
        </div>
        <div class="panel rule-panel">
          <div class="panel-title">规则生成</div>
          <RulePanel
            :app-id="appId"
            :app-name="appName"
            :items="confirmed"
            @update:app-id="appId = $event"
          />
        </div>
      </section>
    </main>

    <InstallPrompt />
  </div>
</template>

<style>
:root {
  color-scheme: light;
}
.app {
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f3f4f6;
  color: #111827;
}
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.header h1 {
  font-size: 16px;
  margin: 0;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.primary {
  padding: 6px 14px;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.ghost {
  padding: 6px 14px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
}
.ghost:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.msg {
  color: #6b7280;
  font-size: 12px;
}
.body {
  flex: 1;
  display: flex;
  min-height: 0;
}
.viewer-page {
  flex: 1;
  overflow: hidden;
  display: flex;
  background: #111827;
}
.side {
  width: 380px;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
}
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-bottom: 1px solid #e5e7eb;
}
.panel-title {
  padding: 8px 10px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}
.tree-panel {
  flex: 1.2;
  min-height: 120px;
}
.attr-panel {
  flex: 1;
  min-height: 120px;
}
.panel-title + * {
  flex: 1;
  min-height: 0;
}
.rule-panel {
  flex: 1.6;
}
.opbar {
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  border-top: 1px solid #e5e7eb;
  flex: none;
}
.opbar button {
  flex: 1;
  padding: 5px 0;
  font-size: 12px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 5px;
  cursor: pointer;
  color: #374151;
}
.opbar button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .app {
    height: 100vh;
  }
  .header {
    flex-wrap: wrap;
    gap: 10px;
  }
  .header h1 {
    font-size: 14px;
  }
  .header .msg {
    flex-basis: 100%;
  }
  .body {
    flex-direction: column;
  }
  .viewer-page {
    flex: none;
    height: 46vh;
  }
  .side {
    width: 100%;
    flex: 1;
    overflow-y: auto;
    border-left: none;
    border-top: 1px solid #e5e7eb;
  }
  .panel {
    flex: none;
  }
  .tree-panel {
    max-height: 44vh;
  }
  .attr-panel {
    max-height: 38vh;
  }
  .rule-panel {
    min-height: 320px;
  }
  .opbar {
    margin-top: 8px;
  }
}
</style>
