/**
 * GKD 快照数据结构（与官方 `@gkd-kit/inspect` 保持一致）。
 * 快照 zip 解压后通常为 `snapshot.json` + `screenshot.png`。
 */

export interface DeviceInfo {
  device?: string;
  model?: string;
  manufacturer?: string;
  brand?: string;
  sdkInt?: number;
  release?: string;
  gkdVersionCode?: number;
  gkdVersionName?: string;
}

export interface RawAttr {
  id?: string;
  vid?: string;
  name: string;
  text?: string;
  textLen?: number;
  desc?: string;
  descLen?: number;
  isClickable?: boolean;
  childCount?: number;
  index: number;
  depth: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  _id?: number;
  _pid?: number;
  [key: string]: unknown;
}

export interface RawNode {
  id: number;
  pid: number;
  quickFind?: boolean;
  idQf?: boolean;
  textQf?: boolean;
  attr: RawAttr;
  parent?: RawNode;
  children: RawNode[];
  [key: string]: unknown;
}

export interface AppInfo {
  id: string;
  name: string;
  versionCode?: number;
  versionName?: string;
  isSystem?: boolean;
  mtime?: number;
  hidden?: boolean;
}

export interface Snapshot {
  id: number;
  appId: string;
  appName?: string;
  appVersionCode?: number;
  appVersionName?: string;
  activityId?: string;
  screenWidth: number;
  screenHeight: number;
  isLandscape?: boolean;
  device?: DeviceInfo;
  appInfo?: AppInfo;
  nodes: RawNode[];
  [key: string]: unknown;
}
