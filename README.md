# e_game · 合并学单词

独立的网页版英语合并小游戏。8 个生活主题、35 个物品词、27 条动作关联和16 个常用搭配，按完整词条去重后共 74 个学习目标。

公网试玩：[https://polanking.com/e-game/word-merge/](https://polanking.com/e-game/word-merge/)。2026-10-14 已发布并完成公网浏览器验收，游戏代码版本为 `52bafda6`。

本项目从 E_Partner 的试玩页独立出来，运行时不依赖 E_Partner，不包含登录、后台 API、数据库、OSS 图片或远程字体。图片均为内置 SVG，英语朗读使用设备的浏览器／系统语音。

## 开发与验证

需要 Node.js 22.12+（建议 24）和 pnpm 11.4.0。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

开发地址为 http://127.0.0.1:5010/。

```sh
pnpm test
pnpm build
pnpm preview
```

生产构建在 `dist/`。本机预览地址为 http://127.0.0.1:5011/。浏览器完整验收需 Python Playwright 与 Chromium，在预览服务启动后执行 `pnpm test:browser`。`pnpm preview` 仅用于本机验收，生产使用静态网站服务或 Nginx。

## 游戏与内容

三个街区分别保留 5×5 棋盘：花园小店（咖啡、花园、烘焙）、手作街角（衣物、纸艺、陶艺）、阳光集市（果汁、薯片厨房）。同类物品合并解锁词义题；订单练习句子；小店课堂提供物品、动作和短语题。首次作答正确才记作独立答对；它是练习统计，不代表掌握度。

词库与链长：`src/features/wordMerge/catalog.ts`。
棋盘与旧版存档迁移：`src/features/wordMerge/game.ts`。
原创图：`src/components/word/WordMergeArt.vue`。
页面：`src/views/WordMergeGame.vue`。

后续小游戏功能以这个仓库为准，避免同时维护两份源代码；E_Partner 可用入口链接或 iframe 接入独立页面。新增图片与词库时需配套检查链条关系、英中例句、答案唯一性和旧词条 ID 的稳定性。

## 部署方案一：现有 E_Partner 服务器

使用独立目录 `/var/www/e-game/word-merge/`，保留原站点 `/var/www/e_partner/`。无需部署或启动任何 Python、Node 后台，不涉及数据库。

1. 在开发机或构建器执行 `pnpm install --frozen-lockfile && pnpm test && pnpm build`。
2. 将 **dist 内的全部文件** 上传到独立目录 `/var/www/e-game/word-merge/`。不要只上传 index.html，也不要上传整个源码仓库到站点目录。
3. 备份当前站点 Nginx 配置，在对应域名的 `server { ... }` 内引用 `deploy/nginx-existing-site.inc` 的 location 配置。若 HTTP 自动跳 HTTPS，需要加入实际提供 HTTPS 的 server 块。
4. 用 `nginx -t` 验证配置。验证成功后仅 reload Nginx，然后通过现有域名的 `/e-game/word-merge/` 打开。

Nginx 片段匹配独立目录，不覆盖原站点的 `/api` 和其他页面。旧 `/word-merge/` 入口及资源地址会重定向到新路径，继续兼容已分享的链接。构建的资源使用相对路径，可同时部署在域名根目录或 `/e-game/word-merge/`。

平台／部署面板若支持静态站点：构建命令 `pnpm install --frozen-lockfile && pnpm build`，发布目录 `dist`，无需环境变量、数据库或业务端口。

## 部署方案二：GitHub 仓库 + Docker 构建器

构建上下文为仓库根目录，Dockerfile 为根目录的 `Dockerfile`。构建阶段使用 Node；运行阶段只使用 Nginx，容器端口为 **80**，健康检查路径 `/healthz`。

```sh
docker build -t e-game:latest .
docker run -d --name e-game --restart unless-stopped -p 127.0.0.1:8088:80 e-game:latest
```

以上端口只供服务器本机反向代理。部署面板可把单独子域名转发到此容器的 80 端口；不要停止原 E_Partner 服务来占用它的端口。

服务器直放静态文件时，发布只需要 dist；Docker 和 Node 构建工具不会成为浏览器依赖。

## 试用与反馈

此版本未加入在线统计或自动反馈上报。可让试用者通过原有联系方式反馈：设备／浏览器、体验的主题、遇到的具体步骤，以及截图。不要把个人信息、浏览器存档或账号凭据提交到公开 GitHub Issues。

当前公网域名的 Cloudflare 层会加入现有的 Web Analytics 访问统计。该脚本不是小游戏源码的一部分；小游戏在阻止它加载的浏览器验收中仍可合并、保存和答题。游戏自身没有请求 E_Partner 的 `/api/`，也不依赖 OSS 图片。

游戏进度仅保存在访问者的浏览器内，不跨设备同步，也不写入正式学习记录。换域名或浏览器会使用另一份存档；清除浏览器数据会丢失本地进度。同一浏览器的使用者共用存档。

## 仓库与发布

- 仓库：https://github.com/noor19932026/e_game
- main 为发布分支，后续功能分支使用 codex/ 前缀。
- GitHub Actions 负责规则测试和构建检查；服务器发布由选定的静态托管／部署面板负责。
- 不提交 dist、node_modules、.env、真实密钥或本地存档。
- 当前采用现有服务器的独立静态目录部署，Nginx 配置已备份并通过校验。GitHub main 的后续推送会自动检查源码，但不会自动更新服务器；新版本仍需单独发布 dist。
