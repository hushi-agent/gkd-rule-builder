<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const show = ref(true);
const installed = ref(false);
const installable = ref(false);
const showGuide = ref(false);
const deferredPrompt = ref<{ prompt: () => void; userChoice: Promise<unknown> } | null>(null);

const onBeforeInstall = (e: Event) => {
  e.preventDefault();
  deferredPrompt.value = e as unknown as { prompt: () => void; userChoice: Promise<unknown> };
  installable.value = true;
  installed.value = false;
  show.value = true;
};

const onInstalled = () => {
  installed.value = true;
  installable.value = false;
  show.value = false;
};

onMounted(() => {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  if (standalone) {
    installed.value = true;
    show.value = false;
    return;
  }
  window.addEventListener('beforeinstallprompt', onBeforeInstall);
  window.addEventListener('appinstalled', onInstalled);
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  window.removeEventListener('appinstalled', onInstalled);
});

const openGuide = () => {
  showGuide.value = true;
};

const install = async () => {
  const prompt = deferredPrompt.value;
  if (!prompt) {
    openGuide();
    return;
  }
  prompt.prompt();
  await prompt.userChoice;
  deferredPrompt.value = null;
  installable.value = false;
};
</script>

<template>
  <div v-if="show" class="install-banner">
    <div class="ib-text">
      <div class="ib-title">安装为手机应用</div>
      <div class="ib-sub">
        {{ installable ? '可从桌面直接打开、离线使用' : '在手机浏览器中添加到主屏幕即可安装' }}
      </div>
    </div>
    <div class="ib-actions">
      <button v-if="installable" class="ib-btn primary" @click="install">安装应用</button>
      <button class="ib-btn" @click="openGuide">安装方法</button>
      <button class="ib-close" title="关闭" @click="show = false">×</button>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="showGuide" class="guide-mask" @click.self="showGuide = false">
      <div class="guide-box">
        <div class="guide-title">安装方法</div>
        <ul class="guide-list">
          <li><strong>安卓 Chrome / Edge：</strong>打开应用页面后，点右上角菜单「安装应用」或「添加到主屏幕」。</li>
          <li><strong>iOS Safari：</strong>点底部「分享」→「添加到主屏幕」。</li>
          <li>需通过 <code>npm run build && npm run preview</code> 访问 <code>http://localhost:4173</code>，或部署到 HTTPS 站点，浏览器才会判定可安装。</li>
          <li>首次联网打开一次后即可离线使用。</li>
        </ul>
        <button class="ib-btn primary" @click="showGuide = false">知道了</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.install-banner {
  position: fixed;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #111827;
  color: #f9fafb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  max-width: calc(100vw - 24px);
}
.ib-text {
  min-width: 0;
}
.ib-title {
  font-weight: 700;
  font-size: 14px;
}
.ib-sub {
  font-size: 12px;
  color: #d1d5db;
}
.ib-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ib-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #374151;
  background: #1f2937;
  color: #e5e7eb;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.ib-btn.primary {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
.ib-close {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
}
.guide-mask {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}
.guide-box {
  width: min(520px, 100%);
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  color: #111827;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}
.guide-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
}
.guide-list {
  font-size: 13px;
  line-height: 1.7;
  margin: 0 0 14px;
  padding-left: 20px;
}
.guide-list code {
  background: #f3f4f6;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 12px;
}
</style>
