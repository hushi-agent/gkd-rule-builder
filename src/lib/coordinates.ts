import type { RawAttr } from '../types/snapshot';

export interface Box {
  width: number;
  height: number;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SnapshotPoint {
  x: number;
  y: number;
}

export interface OverlayStyle {
  left: number;
  top: number;
  width: number;
  height: number;
}

const containSize = (container: Box, image: Box) => {
  const scale = Math.min(container.width / image.width, container.height / image.height);
  const innerWidth = image.width * scale;
  const innerHeight = image.height * scale;
  const offsetX = (container.width - innerWidth) / 2;
  const offsetY = (container.height - innerHeight) / 2;
  return { scale, offsetX, offsetY, innerWidth, innerHeight };
};

/** 把容器内的鼠标坐标（client 相对 rect）换算成截图自然像素坐标 */
export const clientToSnapshot = (
  clientX: number,
  clientY: number,
  rect: Rect,
  imageWidth: number,
  imageHeight: number,
): SnapshotPoint => {
  const { scale, offsetX, offsetY } = containSize(
    { width: rect.width, height: rect.height },
    { width: imageWidth, height: imageHeight },
  );
  return {
    x: (clientX - rect.left - offsetX) / scale,
    y: (clientY - rect.top - offsetY) / scale,
  };
};

/** 由节点 bounds 与截图/容器尺寸计算覆盖层 CSS 样式 */
export const overlayStyle = (
  attr: Pick<RawAttr, 'left' | 'top' | 'right' | 'bottom'>,
  display: Box,
  image: Box,
): OverlayStyle => {
  if (display.width <= 0 || display.height <= 0 || image.width <= 0 || image.height <= 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }
  const { scale, offsetX, offsetY } = containSize(display, image);
  return {
    left: offsetX + attr.left * scale,
    top: offsetY + attr.top * scale,
    width: (attr.right - attr.left) * scale,
    height: (attr.bottom - attr.top) * scale,
  };
};
