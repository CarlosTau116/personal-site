# Carlos Tau — 个人网站

一个为课程作业制作的单页个人网站。核心内容分为四个栏目：

1. **关于我**：个人信息、关注方向、工具与近期状态。
2. **我的 Agent**：使用过的 Agent、各自的分工与协作流程。
3. **项目**：使用 Agent 完成的项目，可打开详情弹窗查看。
4. **课程成果**：按时间收录课程期间的新作业、实验与文档，可持续追加。

网站使用原生 HTML、CSS、JavaScript 构建，**没有任何依赖，也不需要打包**。

- 线上网站：<https://carlostau116.github.io/personal-site/>
- GitHub 仓库：<https://github.com/CarlosTau116/personal-site>
- 当前本地目录已经连接到该仓库的 `main` 分支，后续修改可直接提交并推送。

---

## 1. 如何打开

### 方式 A：直接打开

双击 `index.html`，用浏览器打开即可。

### 方式 B：本地服务器（推荐用于交作业前检查）

在当前文件夹打开终端，运行：

```bash
python -m http.server 4173
```

然后访问：

```text
http://127.0.0.1:4173
```

推荐使用 Chrome / Edge / Firefox 的较新版本。

### 部署到 GitHub Pages

完整步骤见 [DEPLOY_GITHUB_PAGES.md](DEPLOY_GITHUB_PAGES.md)，包含 Git 推送、网页上传、开启 Pages 和常见问题排查。

> 当前本地目录已经完成过初始化与关联，**不需要再次执行 `git init` 或 `git remote add`**。后续修改后运行：
>
> ```powershell
> git add .
> git commit -m "更新个人网站"
> git push
> ```

---

## 2. 文件说明

| 文件 | 用途 |
| --- | --- |
| `index.html` | 页面结构与全部文字内容 |
| `styles.css` | 视觉设计、动效、响应式布局 |
| `script.js` | 导航、滚动出现、项目弹窗、成果计数、时钟 |
| `mlp-lab.html` | 独立的「MLP 学习参数实验室」作业页面 |
| `mlp-lab.css` | 实验室页面的布局、图表与响应式样式 |
| `mlp-lab.js` | 浏览器端 MLP 训练、反向传播、Adam 和全部可视化 |
| `assets/mlp_xor_lab.py` | 可直接运行的 NumPy + Matplotlib 实验脚本 |
| `assets/mlp_xor_lab.png` | Python 脚本生成的四联结果图 |
| `assets/favicon.svg` | 浏览器标签页图标 |
| `agent-playbook.md` | 项目二「Agent 协作方法卡」的完整下载版 |
| `preview.png` | 桌面与手机版预览图（不参与网页运行） |
| `preview-outcomes.png` | 课程成果栏目预览图（不参与网页运行） |
| `preview-mlp-lab.png` | MLP 实验室页面预览图（不参与网页运行） |
| `DEPLOY_GITHUB_PAGES.md` | 部署到 github.io 的完整图文操作指南 |
| `.nojekyll` | 告诉 GitHub Pages 按纯静态网站发布 |
| `.gitignore` | 避免把 `_diag/`、缓存和密钥文件提交到仓库 |
| `README.md` | 本说明 |

---

## 3. 交作业前最值得修改的 4 处

> 当前部分内容是为了让页面完整可展示而生成/推断的。请把下面这些改成你的真实信息。

### ① 姓名

在 `index.html` 中搜索 `Carlos Tau`，替换为你的姓名。

同时替换以下位置：

- `<title>` 中的姓名
- 顶部 Logo 文字和 `CT` 缩写
- 首屏 `CARLOS`（在 `.hero-name` 中）
- 关于我中的「姓名 / NAME」
- 页脚版权

### ② 学校、专业、年级

在 `index.html` 的「关于我」`<dl class="facts">` 中，可以新增：

```html
<div>
  <dt>学校 / SCHOOL</dt>
  <dd>你的学校</dd>
</div>
<div>
  <dt>专业 / MAJOR</dt>
  <dd>你的专业 · 年级</dd>
</div>
```

### ③ Agent 使用记录

「我的 Agent」区域目前包含：

- DeepSeek Harness（本次网站制作中真实使用）
- ChatGPT
- Claude

其中 ChatGPT 和 Claude 的具体使用描述是为了完整展示栏目而补充的示例。请根据你**真实用过**的 Agent 修改卡片文字、标签和状态；如果没用过某个，直接换成你用过的，或删除那张卡片。

卡片在 `index.html` 的 `.agent-grid` 中。数量改为 1 个或 2 个也能正常排版。

### ④ 项目内容

网站现在展示了四个项目：

1. 个人作品集网站（本次作业，真实完成）
2. Agent 协作方法卡（本次作业的配套文档，真实完成）
3. Signal 动态视觉系统（本站使用的视觉实验，真实完成）
4. MLP 学习参数实验室（第二篇第 15 节课程作业，真实完成）

如果课程要求展示其他项目，建议直接替换前面三个项目：

- 修改 `.projects-grid` 中的项目标题、简介、年份和标签
- 修改 `script.js` 里的 `projectData` 对象（弹窗详情）
- 项目封面是纯 CSS 绘制的，如果只是想先换文字，保留封面即可

---

## 4. MLP 学习参数实验室

这是第 15 节「人工神经元网络」的课程作业，页面在 [mlp-lab.html](mlp-lab.html)。

### 实现了什么

- 2 个输入 → 2 个 sigmoid 隐藏单元 → 1 个 sigmoid 输出
- 4 个 XOR 样本、全批量训练
- 二元交叉熵（BCEWithLogits）+ Adam
- 课程示例的初始权重、偏置与学习率 `0.03`
- 训练 300 轮，跟踪全部 9 个可学习参数
- 浏览器端手写前向传播、反向传播和 Adam，不依赖任何机器学习库

### 页面可以怎么操作

- 播放 / 暂停训练
- 单步前进、跳到第 300 轮、重置
- 拖动 epoch 时间轴回看任意一轮
- 切换学习率（0.01 / 0.03 / 0.06 / 0.10）重新训练
- 同步查看：
  - 网络连线宽度和颜色
  - W、b<sub>h</sub>、v、b<sub>o</sub> 的当前值
  - BCE 损失与分类准确率
  - 四个样本的概率、预测和隐藏表示
  - 决策边界、隐藏空间轨迹、损失曲线
  - 9 个参数各自的轨迹

### 默认结果

使用 `lr = 0.03`、300 轮后：

```text
initial loss: 0.561960
final loss:   0.027927
final probs:  [0.0287, 0.9745, 0.9745, 0.0305]
predictions:  [0, 1, 1, 0]
accuracy:     100%
```

最终参数：

```text
W  = [[ 6.1371, -6.0140],
      [-6.0140,  6.1371]]
bh = [-3.4727, -3.4727]
v  = [ 8.1918,  8.1918]
bo = -4.0141
```

### 运行 Python 版本

```bash
python -m pip install numpy matplotlib
python assets/mlp_xor_lab.py --output assets/mlp_xor_lab.png
```

脚本会打印最终概率和参数，并生成 `mlp_xor_lab.png` 四联图。它和浏览器版本使用同一套初始参数、网络结构、损失与 Adam 设置，结果一致。

课程参考：[《人工智能概论》第 15 节 · 人工神经元网络](https://zhumy.github.io/Introduction_to_Artificial_Intelligence/#chapter-15)。

---

## 5. 如何新增课程成果

「课程成果」栏目位于项目区之后，当前有四条记录（最新一条是 R—004「MLP 学习参数实验室」）和一个「下一份课程成果」占位。后续每次完成新作业、实验、文章或文档，都可以把记录追加在这里。

### 新增步骤

1. 打开 `index.html`，搜索 `COURSE OUTCOMES / ARCHIVE`。
2. 复制其中一条完整的 `<li class="archive-item">…</li>`（不要复制带有 `archive-item--next` 的那条）。
3. 把新记录粘贴到 `archive-item--next` 之前，让「下一份成果」始终保持在最后。
4. 修改编号、日期、标签、标题、描述和交付信息。当前最近编号是 `R—004`，下一条可以从 `R—005` 开始。
5. 如果成果是已有项目，可以使用 `data-project` 按钮打开项目弹窗；如果是新文件，把文件放进 `assets/`，再把链接改成相对路径。

### 可复制的模板

```html
<li class="archive-item reveal">
  <span class="archive-index">R—005</span>
  <div class="archive-date"><span>2026</span><strong>12</strong></div>
  <div class="archive-main">
    <div class="archive-tags"><span>课程作业</span><span>PDF</span></div>
    <h3>成果标题</h3>
    <p>用一两句话说明这份成果做了什么。</p>
  </div>
  <div class="archive-detail">
    <span>交付 / 文件类型</span>
    <span>协作 / Agent 名称</span>
    <span class="archive-status"><i aria-hidden="true"></i> 已收录</span>
  </div>
  <a class="archive-link" href="assets/your-file.pdf" aria-label="打开成果：成果标题">↗</a>
</li>
```

### 两种链接方式

打开已有项目弹窗：

```html
<button class="archive-link" type="button" data-project="portfolio" aria-label="查看项目：个人网站 v1.0" aria-haspopup="dialog">↗</button>
```

打开本地文件或外部链接：

```html
<a class="archive-link" href="assets/your-file.pdf" target="_blank" rel="noopener" aria-label="打开成果">↗</a>
```

成果数量由 `script.js` 自动统计，不需要手动修改数字；但编号（下一条为 `R—005`）、日期和文字需要自己更新。如果新增成果比较多，也可以随时把内容交给 Agent 批量整理。

---

## 6. 已实现的功能

- 响应式布局：桌面、平板、手机
- 固定顶部导航与滚动进度条
- 当前栏目高亮
- 手机端全屏菜单（支持 Esc 关闭）
- 滚动进入视口时的渐显动效
- Agent 卡片跟随鼠标的柔光效果
- 三个项目的详情弹窗（支持点击遮罩、Esc 关闭）
- 独立的「MLP 学习参数实验室」，全交互训练与参数可视化
- 可扩展的「课程成果」档案，新增记录后自动统计数量
- 无联系方式的结尾区
- 实时中国标准时间（UTC+8）
- 尊重 `prefers-reduced-motion`，减少动效偏好下会关闭动画

---

## 7. 设计与技术说明

- **配色**：纸张米白 `#f2f0e8`、墨黑 `#10110d`、荧光绿 `#d8ff3e`、信号橙 `#ff6a3d`
- **字体**：全部使用系统字体，不依赖外部字体服务，离线也能正常显示
- **图形**：轨道、浏览器窗口、方法卡、SIGNAL 封面均由 CSS / SVG 绘制，没有外部图片
- **MLP**：浏览器端为手写 JavaScript 数值实现；Python 版本为 NumPy 实现，使用 Matplotlib 生成静态图
- **无框架、无依赖、无构建步骤**
- 浏览器控制台无 JavaScript 报错

---

## 8. 验收记录

已在本地使用 Chromium 内核浏览器检查：

- 1440 × 1100：桌面布局、导航、项目弹窗、课程成果档案、结尾区
- 1024 × 900：小屏笔记本 / 横屏平板、MLP 实验室
- 768 × 900：竖屏平板、手机菜单、课程成果卡片布局
- 390 × 844：手机首屏、菜单开合、个人信息、Agent 卡片、项目卡、课程成果、弹窗、结尾区
- MLP 实验室：播放 / 暂停、单步、跳到终点、重置、时间轴、学习率切换、项目弹窗入口
- 横向溢出检查：0px
- 控制台错误：0

---

## 9. 备注

这是一个静态网站，没有后端，也不会收集访客信息。网站刻意不包含邮箱、电话或社交账号等联系方式；本地时钟完全在浏览器中运行。

如果之后部署到 GitHub Pages、Vercel 或 Netlify，只需要上传本文件夹中的静态文件即可。
