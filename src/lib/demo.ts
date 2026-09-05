import type { Snapshot, RawNode } from '../types/snapshot';

interface DemoNode {
  id: number;
  pid: number;
  name: string;
  attr: Partial<RawNode['attr']>;
}

const demoNodes: DemoNode[] = [
  { id: 0, pid: -1, name: 'FrameLayout', attr: { index: 0, depth: 0, left: 0, top: 0, right: 400, bottom: 800, width: 400, height: 800 } },
  { id: 1, pid: 0, name: 'LinearLayout', attr: { index: 0, depth: 1, left: 0, top: 700, right: 400, bottom: 800, width: 400, height: 100 } },
  { id: 2, pid: 1, name: 'android.widget.TextView', attr: { index: 0, depth: 2, text: '跳过广告', vid: 'btn_skip', left: 300, top: 720, right: 380, bottom: 780, width: 80, height: 60 } },
  { id: 3, pid: 1, name: 'android.widget.TextView', attr: { index: 1, depth: 2, text: '广告一下', desc: '广告一下', left: 20, top: 720, right: 200, bottom: 780, width: 180, height: 60 } },
  { id: 4, pid: 1, name: 'android.widget.ImageView', attr: { index: 2, depth: 2, left: 210, top: 720, right: 290, bottom: 780, width: 80, height: 60 } },
  { id: 5, pid: 0, name: 'android.widget.TextView', attr: { index: 1, depth: 1, text: '示例应用', left: 20, top: 40, right: 380, bottom: 90, width: 360, height: 50 } },
];

const DEMO_APP = 'com.example.demo';

const drawScreenshot = (): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 400, 800);

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 400, 90);
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('示例应用', 20, 55);

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(20, 150, 360, 300);
  ctx.fillStyle = '#64748b';
  ctx.font = '16px sans-serif';
  ctx.fillText('这是应用内容区', 40, 220);

  // 底部广告卡片
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 700, 400, 100);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(0, 700, 400, 100);

  ctx.fillStyle = '#16a34a';
  ctx.fillRect(300, 720, 80, 60);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('跳过广告', 306, 755);

  ctx.fillStyle = '#facc15';
  ctx.fillRect(20, 720, 180, 60);
  ctx.fillStyle = '#1f2937';
  ctx.fillText('广告一下', 40, 755);

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(210, 720, 80, 60);

  return canvas.toDataURL('image/png');
};

export interface DemoResult {
  snapshot: Snapshot;
  imageDataUrl: string;
}

export const createDemoSnapshot = (): DemoResult => {
  const nodes: RawNode[] = demoNodes.map((n) => ({
    id: n.id,
    pid: n.pid,
    attr: {
      name: n.name,
      index: 0,
      depth: 0,
      left: 0,
      top: 0,
      right: 400,
      bottom: 800,
      width: 400,
      height: 800,
      ...n.attr,
    },
    children: [],
  }));

  const snapshot: Snapshot = {
    id: 1,
    appId: DEMO_APP,
    appName: '示例应用',
    activityId: 'com.example.MainActivity',
    screenWidth: 400,
    screenHeight: 800,
    isLandscape: false,
    nodes,
  };

  return { snapshot, imageDataUrl: drawScreenshot() };
};
