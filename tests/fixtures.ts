import type { Snapshot, RawNode } from '../src/types/snapshot';

/**
 * 构造一份小型快照，模拟 GKD `snapshot.json` 的扁平节点结构与截图坐标。
 * R 表示根 FrameLayout；C 表示底部 LinearLayout；其下三个子控件。
 */
export interface SampleTree {
  snapshot: Snapshot;
  root: RawNode;
  byId: (id: number) => RawNode;
}

const node = (
  id: number,
  pid: number,
  name: string,
  attr: Partial<RawNode['attr']> = {},
): RawNode => {
  return {
    id,
    pid,
    attr: {
      name,
      index: 0,
      depth: 0,
      left: 0,
      top: 0,
      right: 400,
      bottom: 800,
      width: 400,
      height: 800,
      ...attr,
    },
    children: [],
  } as RawNode;
};

export const createSampleTree = (): SampleTree => {
  const flat: RawNode[] = [
    node(0, -1, 'FrameLayout', {
      index: 0,
      depth: 0,
      right: 400,
      bottom: 800,
      width: 400,
      height: 800,
    }),
    node(1, 0, 'LinearLayout', {
      index: 0,
      depth: 1,
      left: 0,
      top: 700,
      right: 400,
      bottom: 800,
      width: 400,
      height: 100,
    }),
    node(2, 1, 'android.widget.TextView', {
      index: 0,
      depth: 2,
      text: '跳过广告',
      vid: 'btn_skip',
      left: 300,
      top: 720,
      right: 380,
      bottom: 780,
      width: 80,
      height: 60,
    }),
    node(3, 1, 'android.widget.TextView', {
      index: 1,
      depth: 2,
      text: '广告',
      desc: '广告',
      left: 0,
      top: 720,
      right: 200,
      bottom: 780,
      width: 200,
      height: 60,
    }),
    node(4, 1, 'android.widget.ImageView', {
      index: 2,
      depth: 2,
      left: 200,
      top: 720,
      right: 300,
      bottom: 780,
      width: 100,
      height: 60,
    }),
  ];
  flat[0].children = [flat[1]];
  flat[1].children = [flat[2], flat[3], flat[4]];
  flat[1].parent = flat[0];
  flat[2].parent = flat[1];
  flat[3].parent = flat[1];
  flat[4].parent = flat[1];

  const snapshot: Snapshot = {
    id: 12345,
    appId: 'com.example.demo',
    appName: 'Demo',
    activityId: 'com.example.MainActivity',
    screenWidth: 400,
    screenHeight: 800,
    isLandscape: false,
    nodes: flat,
  };

  return {
    snapshot,
    root: flat[0],
    byId: (id) => flat.find((n) => n.id === id)!,
  };
};
