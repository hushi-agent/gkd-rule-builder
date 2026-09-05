# GKD 开屏广告自动屏蔽规则生成器

纯前端网页工具：导入 GKD 快照 zip，通过可视化双击选点，自动生成“开屏广告自动屏蔽”规则（JSON5）。

## 功能

- 导入 GKD 快照 zip（解压其中的 `*.json` 快照与 `*.png`/`*.webp` 截图）。
- 左图 + 右面板：截图与节点坐标对齐，双击截图命中最小节点并高亮，右侧节点树与属性面板自动跟随。
- 蓝色 = 当前编辑中节点；绿色 = 已加入待生成列表。
- “控件节点树”下方提供 放大 / 缩小 / 切换 / 确认 / 关闭 操作，随当前选中节点启用/禁用。
- “属性/匹配”面板列出已选节点（按先后排序），每项带 × 删除（同时删除绿色框与登记）。
- 对每个绿色节点自动生成 `matches`，并用官方选择器引擎实时校验是否唯一命中，非唯一时提示。
- 输入应用包名，输出完整“开屏广告自动屏蔽”应用规则 JSON5，支持复制与“导出”下载 `.json5`。
- 内置“加载示例快照”便于离线快速体验。
- 移动端响应式布局（≤900px 自动上下堆叠），并配置为可安装、可离线的 PWA（manifest + Service Worker）。

## 自动屏蔽说明

生成的规则带上 `fastQuery: true`（快速查询）、组级 `matchTime: 10000`（10 秒匹配窗口）、`actionMaximum: 1`（每次启动最多执行 1 次）、`resetMatch: 'app'`：开屏广告一出现就自动点掉“跳过/关闭”按钮。

GKD 的“屏蔽”是“自动点击跳过/关闭”，而不是阻止广告显示。规则仅作用于指定应用（appId）；未限定 `activityIds` 时会在该应用各界面按匹配触发，若需要更精准，后续可给规则加 `activityIds` 收窄范围。

## 运行

```bash
npm install
npm run dev      # 开发预览，默认 http://localhost:5173
npm run build    # 类型检查 + 生产构建到 dist/
npm test         # 运行单元测试
```

PWA 安装：`npm run build && npm run preview` 后，用 Android Chrome 打开 `http://localhost:4173`，会在地址栏出现“安装应用”，或通过菜单“添加到主屏幕”安装为独立 App；首次联网加载后即可离线使用。

### 部署到静态站点（真机安装前置条件）

手机上的 Edge/Chrome 只有在 **HTTPS** 地址下才识别为可安装 PWA。`dist/` 是纯静态产物，部署到任意 HTTPS 静态托管即可：

- **Cloudflare Pages / Vercel / Netlify**：直接上传 `dist/` 文件夹，或用它们绑定 Git 仓库（框架选 Vite，输出目录 `dist`）。
- **GitHub Pages（个人站点）**：把 `dist/` 内容推到仓库根即可。
- **GitHub Pages（项目站点，子路径）**：本工程已用相对路径（`base: './'`），子路径可直接使用，无需再改配置。

部署后在手机浏览器打开 HTTPS 地址，点右上角菜单「安装应用」/「添加到主屏幕」即可。首次联网打开一次后，断网也能用。

## 使用流程

1. 点击“导入快照 zip”选择 GKD 快照，或点击“加载示例快照”。
2. 在截图左侧双击“跳过/关闭”按钮，右侧节点树与属性自动定位。
3. 用树下“放大/缩小/切换”微调到目标；点“确认”或双击其他区域，当前蓝色变绿色（保存）。
4. 在右下角填写应用包名，点“复制”或“导出”拿到可粘贴到 GKD“本地订阅-应用规则”的 JSON5。
5. 若某个选择器提示“非唯一”，可回到该绿色节点继续微调，或手动修改 `matches`。

## 说明

- 选择器生成优先使用 `vid`/`id`，其次 `text`/`desc`，没有稳定标识时回退为类名层级路径，可能命中多个节点并给出警告。
- “关闭”只撤销当前蓝色节点；绿色节点通过“属性/匹配”里的“×”单独删除。
- 匹配依赖官方 `@gkd-kit/selector`（Kotlin/Wasm 编译版），浏览器需支持 WebAssembly GC（Chrome 117+ 或近期 Edge/Safari），Node 需 22+ 才能跑测试。

## 目录

- `src/types/snapshot.ts`：GKD 快照结构定义。
- `src/lib/snapshot.ts`：节点树构建、命中检测、标签。
- `src/lib/coordinates.ts`：截图坐标与覆盖层换算。
- `src/lib/selector.ts`：`matches` 生成与官方选择器匹配。
- `src/lib/rule.ts`：组装应用级“自动屏蔽”规则与 JSON5 输出。
- `src/composables/useSelection.ts`：选点确认/微调状态机。
- `src/components/`：截图覆盖层、节点树、属性面板、规则面板。
- `public/`：PWA manifest、Service Worker 与 App 图标。
- `scripts/generate-icons.mjs`：生成 PWA 图标（纯 Node，无依赖）。
- `tests/`：核心逻辑单元测试。
