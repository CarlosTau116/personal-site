# 将个人网站部署到 GitHub Pages（github.io）

> 适用对象：本文件夹中的「Carlos Tau 个人网站」  
> 技术栈：纯 HTML / CSS / JavaScript，**无需安装依赖，也无需构建**  
> 预计耗时：10–20 分钟（不含 GitHub 页面加载等待）  
> 文档版本：1.1 · 2026-11-18

完成后的网站地址有两种形式：

| 仓库类型 | 仓库名 | 最终地址 | 适合情况 |
| --- | --- | --- | --- |
| 用户站点 | 必须叫 `<你的用户名>.github.io` | `https://<你的用户名>.github.io/` | 一个账号只放一个主站 |
| 项目站点 | 任意名称，例如 `personal-site` | `https://<你的用户名>.github.io/personal-site/` | **推荐**：一门课一个项目，互不影响 |

> 本文以推荐方案「项目站点」为主。  
> 本网站的所有资源都使用相对路径（如 `styles.css`、`assets/favicon.svg`），因此部署在 `/personal-site/` 这样的子路径下也能正常显示。

---

## 0. 快速开始（已经熟悉 Git 的话）

```powershell
cd "<你的项目文件夹>"
git init -b main
git add .
git commit -m "Deploy personal website"
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

推送成功后，进入 GitHub 仓库：

**Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` → Folder: `/ (root)` → Save**

等待 1–3 分钟，在同一个页面看到网站地址后点击 **Visit site**。

> 第一次使用 Git 的人，请从第 2 节开始，按步骤操作。  
> 不想用命令行的人，可以直接看第 4 节的「网页上传」方案。

---

## 1. 部署前检查

先不要急着上传。GitHub Pages 上的内容是**公开的**，任何人都能访问，也能看到仓库中的源代码。

### 1.1 内容检查

- [ ] 把 `Carlos Tau` 换成你的真实姓名
- [ ] 网站目前**不包含任何联系方式**；如无必要，不要添加邮箱、电话或社交账号
- [ ] 根据真实情况修改「我的 Agent」内容
- [ ] 根据真实情况修改项目二、项目三（如果它们不是你的实际项目）
- [ ] 确认没有学号、身份证号、手机号、家庭住址等敏感信息
- [ ] 确认没有 API Key、密码、访问令牌（Token）

### 1.2 本地检查

在项目文件夹中双击 `index.html`，或在当前目录运行：

```powershell
python -m http.server 4173
```

浏览器打开 `http://127.0.0.1:4173`，确认：

- [ ] 页面能正常显示，字体、颜色、布局都正常
- [ ] 首屏、关于我、Agent、项目、课程成果五个区域都有内容
- [ ] 点「查看项目详情」能打开弹窗
- [ ] 手机宽度下菜单和排版正常
- [ ] 按 `F12` 打开开发者工具，Console 中没有红色报错
- [ ] `agent-playbook.md` 能从项目弹窗中下载

### 1.3 文件检查

上传到 GitHub 的根目录必须直接包含 `index.html`：

```text
agent/
├── index.html              ← 必须是根目录下的这个名字
├── styles.css
├── script.js
├── mlp-lab.html            ← MLP 学习参数实验室
├── mlp-lab.css
├── mlp-lab.js
├── agent-playbook.md
├── preview.png             ← 可选
├── preview-outcomes.png    ← 可选
├── preview-mlp-lab.png     ← 可选
├── README.md
├── DEPLOY_GITHUB_PAGES.md
├── .nojekyll
├── .gitignore
└── assets/
    ├── favicon.svg
    ├── mlp_xor_lab.py
    └── mlp_xor_lab.png
```

以下文件 **不要上传**：

- `_diag/`：本机的网络诊断文件，可能包含本地路径和无关日志
- `.preview/`：本地浏览器截图缓存（如果存在）
- `node_modules/`：本项目不需要
- `.env`、任何包含密码或密钥的文件
- 压缩包 `.zip`：GitHub Pages 不会自动解压

项目已经准备好 `.gitignore`，它会帮助 Git 自动忽略 `_diag/`、`.preview/` 等文件。  
`.nojekyll` 是一个空文件，用来告诉 GitHub Pages 不要用 Jekyll 处理这个静态网站，建议保留。

---

## 2. 创建 GitHub 仓库

1. 登录 [GitHub](https://github.com/)。
2. 点击右上角的 **+**，选择 **New repository**。
3. 填写：
   - **Repository name**：
     - 做项目站点：`personal-site`（或你喜欢的英文名，建议全小写）
     - 做用户主站：`<你的用户名>.github.io`（必须与用户名完全一致）
   - **Description**：可选，例如 `My personal portfolio for course assignment`
   - **Visibility**：选择 **Public**
     - 使用 GitHub 免费账户时，GitHub Pages 通常要求仓库为公开仓库
   - **Initialize this repository with**：
     - 如果准备用命令行推送：**全部不要勾选**（不要添加 README、.gitignore、license）
     - 如果准备用网页上传：可以勾选 README，也可以不勾
4. 点击 **Create repository**。
5. 复制仓库地址，形如：

```text
https://github.com/<你的用户名>/<仓库名>.git
```

> 注意：仓库名不要写成 `github.io` 或 `personal-site.github.io`。  
> 用户主站要求的是 `<用户名>.github.io`，例如用户名为 `alice`，仓库名就是 `alice.github.io`。

---

## 3. 方案 A：用 Git 命令行推送（推荐）

这个方案适合之后还要反复更新网站的人。本机已经安装了 Git。

### 3.1 设置提交身份（只做一次）

如果这是你第一次在这台电脑上使用 Git，先设置用户名和邮箱：

```powershell
git config --global user.name "你的名字或 GitHub 用户名"
git config --global user.email "你的 GitHub 邮箱"
```

检查是否设置成功：

```powershell
git config --global user.name
git config --global user.email
```

> 邮箱会出现在公开的提交记录中。如果不想公开真实邮箱，可以在 GitHub 的 **Settings → Emails** 中开启邮箱隐私保护，并使用 GitHub 提供的 `noreply` 邮箱。

### 3.2 初始化本地仓库并提交

打开 PowerShell，进入网站文件夹：

```powershell
cd "<你的项目文件夹>"
```

请把引号中的路径替换成你电脑上的实际路径。

然后依次运行：

```powershell
git init -b main
git add .
git status
```

重点看 `git status` 的输出：应该看到 `index.html`、`styles.css`、`script.js`、`assets/` 等文件，**不应看到 `_diag/`**。确认无误后提交：

```powershell
git commit -m "Deploy personal website"
```

如果 `git init -b main` 报错（旧版 Git 不支持 `-b`），改用：

```powershell
git init
git add .
git commit -m "Deploy personal website"
git branch -M main
```

### 3.3 连接远程仓库并推送

把下面的地址换成第 2 步复制的地址：

```powershell
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

第一次推送时可能会弹出登录窗口：

- 推荐选择 **Sign in with your browser**，按提示在浏览器中授权。
- GitHub 早已不支持直接使用账号密码推送。
- 如果使用 Personal Access Token（PAT）：
  - 细粒度 Token 需要给目标仓库 **Contents: Read and write** 权限；
  - 经典 Token 需要勾选 `repo` 权限；
  - 不要把 Token 写在文档、截图或远程地址里。

看到类似下面的输出就表示推送成功：

```text
branch 'main' set up to track 'origin/main'.
```

### 3.4 如果 `origin` 已存在

可能之前已经为这个文件夹配置过远程仓库。先查看：

```powershell
git remote -v
```

如果地址不对，直接覆盖：

```powershell
git remote set-url origin https://github.com/<你的用户名>/<仓库名>.git
```

然后再推送：

```powershell
git push -u origin main
```

### 3.5 使用 GitHub Desktop（不习惯命令行）

1. 安装并登录 [GitHub Desktop](https://desktop.github.com/)。
2. 选择 **File → Add local repository**，选中你的网站项目文件夹。
3. 如果提示还不是 Git 仓库，选择 **create a repository**。
4. 在左下角填写提交信息，点击 **Commit to main**。
5. 点击 **Publish repository**。
6. 选择仓库名，并取消勾选 **Keep this code private**（免费账户部署 Pages 需要公开仓库）。
7. 点击 **Publish repository** 完成推送。

---

## 4. 方案 B：直接在 GitHub 网页上传（无需 Git）

如果只是尽快交作业、不想配置 Git，可以用这个方案。缺点是以后每次更新都要重新上传文件。

### 4.1 创建仓库

按第 2 节创建仓库，Visibility 选择 **Public**。  
如果准备直接上传文件，勾不勾选 README 都可以。

### 4.2 上传文件

1. 进入仓库首页，点击 **Add file → Upload files**。
2. 打开本地的网站项目文件夹。
3. **只选中网站文件本身**，拖进网页：
   - `index.html`
   - `styles.css`
   - `script.js`
   - `mlp-lab.html`
   - `mlp-lab.css`
   - `mlp-lab.js`
   - `agent-playbook.md`
   - `preview.png`（可选）
   - `preview-outcomes.png`（可选）
   - `preview-mlp-lab.png`（可选）
   - `README.md`
   - `DEPLOY_GITHUB_PAGES.md`
   - `.gitignore`
   - `.nojekyll`
   - `assets` 文件夹（里面是 `favicon.svg`、`mlp_xor_lab.py` 和 `mlp_xor_lab.png`）
4. **不要拖入 `_diag`、`.preview`、`.qa` 或 `.research`。** 网页上传不受 `.gitignore` 影响，必须手动跳过。
5. 在下方填写提交信息，例如 `Upload personal website`。
6. 点击 **Commit changes**。

> 重要：上传的是文件夹里面的内容，不要把整个 `agent` 文件夹拖进去，否则 `index.html` 会变成 `agent/index.html`，网站根地址就会 404。  
> 如果你看不到 `.nojekyll` 或 `.gitignore`，在文件资源管理器的「查看」中打开「显示隐藏的项目」；也可以稍后在 GitHub 上用 **Add file → Create new file** 手动创建。

### 4.3 手动创建 `.nojekyll`（如上传时漏掉）

1. 仓库首页点击 **Add file → Create new file**。
2. 文件名填写 `.nojekyll`。
3. 内容留空。
4. 点击 **Commit changes**。

---

## 5. 开启 GitHub Pages（关键步骤）

文件已经在仓库里之后，还需要手动启用 Pages。

1. 打开仓库页面。
2. 点击 **Settings**（设置）。
3. 在左侧菜单中找到 **Pages**。
4. 在 **Build and deployment** 下：
   - **Source** 选择 **Deploy from a branch**；
   - **Branch** 选择 `main`；
   - **Folder** 选择 `/ (root)`；
   - 点击 **Save**。
5. 等待 1–3 分钟。首次部署有时需要更久。
6. 回到 **Settings → Pages**，页面顶部会出现：

```text
Your site is live at https://<你的用户名>.github.io/<仓库名>/
```

7. 点击 **Visit site**。

> 如果仓库名是 `<你的用户名>.github.io`，地址会是 `https://<你的用户名>.github.io/`，没有后面的仓库名。  
> 不需要自己创建 GitHub Actions 工作流，选择「Deploy from a branch」即可。  
> 在仓库的 **Actions** 页面看到 `pages build and deployment` 属于正常现象。

---

## 6. 部署后的验收

打开线上地址，逐项检查：

- [ ] 首屏能正常显示，`CARLOS` 标题、右侧轨道图形都出现
- [ ] 页面样式正常（不是只有纯文字）
- [ ] `assets/favicon.svg` 能在标签页显示
- [ ] 电脑上点击导航可以滚动到对应区域
- [ ] 点击「查看项目详情」能打开三个弹窗
- [ ] 课程成果区显示 4 条记录和 1 个「下一份成果」占位，点击记录右侧箭头能打开对应项目
- [ ] 点击「MLP 学习参数实验室」项目横幅，能进入 `mlp-lab.html`
- [ ] 实验室中播放、暂停、单步、跳到终点和时间轴都正常
- [ ] 切换学习率后重新训练正常，图表、参数和输出同步更新
- [ ] 手机宽度下菜单可以打开、关闭
- [ ] 从「Agent 协作方法卡」弹窗中能下载 `agent-playbook.md`
- [ ] 页面结尾没有邮箱、电话或其他联系方式
- [ ] 按 `F12 → Console` 没有红色报错
- [ ] 按 `F12 → Network`，刷新后没有 404 资源
- [ ] 浏览器地址栏显示锁形图标（HTTPS）

**交作业时提交 Pages 地址**，例如：

```text
https://<你的用户名>.github.io/personal-site/
```

不要直接提交 GitHub 仓库地址（`https://github.com/...`），除非老师明确要求看源码。

> 如果刚部署完看到 404 或旧内容，先等 3–5 分钟，再用无痕窗口打开，或按 `Ctrl + F5` 强制刷新。

---

## 7. 以后如何更新网站

### 用 Git 推送（推荐）

修改完 `index.html`、`styles.css` 等文件后：

```powershell
cd "<你的项目文件夹>"
git add .
git commit -m "更新个人信息"
git push
```

推送后 GitHub Pages 会自动重新部署，通常 1–3 分钟生效。

### 用网页上传

进入仓库，点击 **Add file → Upload files**，重新上传修改后的文件，提交即可。

### 更新后仍然看到旧版本

按顺序尝试：

1. 等待 3–5 分钟；
2. `Ctrl + F5` 强制刷新；
3. 打开无痕窗口；
4. 在网址后加版本参数，例如 `?v=2`；
5. 到仓库的 **Actions** 页面确认最近一次部署是否成功。

---

## 8. 常见问题

### 8.1 打开网址是 404

依次检查：

1. **Settings → Pages** 是否已经点击 Save；
2. Branch 是否选择 `main`，Folder 是否选择 `/ (root)`；
3. 仓库根目录是否有**小写**的 `index.html`（不是 `Index.html`，也不是放在子文件夹里）；
4. 仓库是否为 Public；
5. 地址是否拼写正确；
6. 是否刚部署，等待几分钟再看。

### 8.2 页面只有文字，没有 CSS / JS

常见原因：

- `styles.css`、`script.js` 没有上传到仓库根目录；
- 文件名大小写不一致。GitHub Pages 运行在区分大小写的 Linux 环境，`Styles.css` 和 `styles.css` 是两个文件；
- `assets/favicon.svg` 路径不完整；
- Jekyll 处理导致下划线开头的文件被忽略：确认根目录有 `.nojekyll`。

本项目的 CSS 和 JS 都使用相对路径，所以无论部署在：

```text
https://<用户名>.github.io/
```

还是：

```text
https://<用户名>.github.io/personal-site/
```

都应该能正常加载。

### 8.3 推送时提示认证失败

GitHub 不再接受账号密码。可选：

- 使用 Git Credential Manager 弹出的浏览器登录；
- 使用 GitHub Desktop；
- 使用 Personal Access Token 代替密码；
- 检查系统时间是否准确（时间偏差也会导致认证失败）。

不要把 Token 直接拼进远程地址：

```text
https://<token>@github.com/...
```

如果已经这样做，立即在 GitHub 中撤销该 Token，并重新设置远程地址。

### 8.4 `src refspec main does not match any`

说明本地还没有提交，或分支名不是 `main`。运行：

```powershell
git add .
git commit -m "Deploy personal website"
git branch -M main
git push -u origin main
```

### 8.5 `remote origin already exists`

说明已经配置过远程仓库。查看并修改：

```powershell
git remote -v
git remote set-url origin https://github.com/<你的用户名>/<仓库名>.git
```

### 8.6 远程仓库已有 README，推送被拒绝

如果在创建仓库时勾选了 README，远程已经有一个提交。先拉取并合并：

```powershell
git pull --rebase origin main
git push -u origin main
```

如果出现 unrelated histories 错误，可以在确认远程内容可以覆盖后运行：

```powershell
git pull origin main --allow-unrelated-histories
```

解决冲突后再提交、推送。

### 8.7 下载 `agent-playbook.md` 时在浏览器里直接打开了

这通常不影响使用，仍然可以右键另存为。若希望强制下载，可以确认 `index.html` 中下载链接带有 `download` 属性（本项目已经带有）。

### 8.8 国内网络访问 GitHub 不稳定

GitHub 和 GitHub Pages 在部分网络环境下可能较慢或间歇性失败。可以尝试：

- 换一个网络（例如手机热点）后重新 `git push`；
- 推送失败时先重试，不要连续快速重复提交；
- 部署完成后直接访问 Pages 地址，避免频繁刷新仓库页面；
- 如果老师允许，另存一份站点到 U 盘或本地演示作为备份。

---

## 9. 可选：绑定自己的域名

课程作业通常不需要这一步。如果以后想用 `www.example.com`：

1. 购买域名；
2. 在仓库 **Settings → Pages → Custom domain** 填入域名；
3. 在域名服务商处添加 DNS 记录：
   - 项目站点通常添加 `CNAME`，指向 `<你的用户名>.github.io`；
   - 用户主站按 GitHub 提示配置 `A` / `AAAA` 记录；
4. 等待 DNS 生效；
5. 回到 Pages 设置，勾选 **Enforce HTTPS**。

在 DNS 尚未生效前不要反复修改设置。具体记录以 GitHub Pages 页面给出的提示为准。

---

## 10. 最简操作清单

如果只想记住最关键的五步：

1. 新建一个 **Public** 仓库，名字建议 `personal-site`；
2. 把网站文件上传/推送到仓库根目录，确保根目录有 `index.html`；
3. **Settings → Pages → Deploy from a branch → main → / (root) → Save**；
4. 等待 1–3 分钟；
5. 打开 `https://<你的用户名>.github.io/personal-site/` 验收。

---

## 11. 官方参考文档

- [创建 GitHub Pages 站点](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [配置 GitHub Pages 的发布源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub Pages 使用限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [管理个人访问令牌](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [为 GitHub Pages 配置自定义域名](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

---

## 12. 交作业前最后确认

- [ ] 网站地址可以在无痕窗口中打开
- [ ] 姓名、Agent 记录、项目内容都是真实的
- [ ] 网站保持无联系方式，没有邮箱、电话或社交账号
- [ ] 没有上传 `_diag/`、`.preview/`、密钥或隐私信息
- [ ] 老师要求的提交格式是「网址」还是「网址 + 源码仓库」，按要求提交
- [ ] 保留一份本地备份，避免网络或账号异常影响提交

祝部署顺利。
