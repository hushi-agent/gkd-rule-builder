import { describe, it, expect } from 'vitest';
import {
  clientToSnapshot,
  overlayStyle,
} from '../src/lib/coordinates';

describe('clientToSnapshot', () => {
  it('带上下留白时正确反算图片坐标', () => {
    const rect = { left: 0, top: 0, width: 200, height: 200 };
    const p = clientToSnapshot(100, 100, rect, 400, 800);
    expect(p.x).toBe(200);
    expect(p.y).toBe(400);
  });
});

describe('overlayStyle', () => {
  it('按 contain 等比缩放并居中生成节点框', () => {
    const style = overlayStyle(
      { left: 300, top: 720, right: 380, bottom: 780 },
      { width: 200, height: 200 },
      { width: 400, height: 800 },
    );
    expect(style.left).toBe(50 + 300 * 0.25);
    expect(style.top).toBe(720 * 0.25);
    expect(style.width).toBe(80 * 0.25);
    expect(style.height).toBe(60 * 0.25);
  });
});
