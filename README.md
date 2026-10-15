# e_game · 合并学单词

独立的网页版英语小店游戏。主线为“帮 Mia 准备野餐”：学习 bread、apple、milk、water，完成数量订单和装包指令。保留自由合成的 8 个生活主题、35 个物品词、27 条动作关联、16 个常用搭配（自由合成词库去重共 74 个学习目标）。

公网试玩：[https://polanking.com/e-game/word-merge/](https://polanking.com/e-game/word-merge/)。2026-10-15 已发布游戏代码版本 `a3ccae6`，包含野餐章节、简化界面、动物来访和小店装扮。本地与公网完整浏览器验收、19 项规则测试、嵌套路径静态资源检查均通过；旧版实际浏览器存档升级到版本 4 后仍保留棋盘、星币、订单和练习记录。

服务器发布目录为 `/var/www/e-game/word-merge/`。发布前的可读静态备份和回退目录保存在 `/var/www/e-game/backups/`，发布记录保存在 `/var/www/e-game/releases/`。本次切换保留了旧版哈希资源，兼容已打开的浏览器页面。

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

界面分为“今日任务、自由合成、学习、我的小店”四个入口，一次只展示当前功能。“学习”内切换隔天复习、图鉴与课堂；单词动作链按需展开。刷新保留当前入口，游戏进度仍使用原有存档。

三个街区分别保留 5×5 棋盘：花园小店（咖啡、花园、烘焙）、手作街角（衣物、纸艺、陶艺）、阳光集市（果汁、薯片厨房）。首次合出新词只显示轻提示，继续合成无需答题；关键订单使用新的英语请求配图片选择，不显示例句翻译。小店课堂每轮连续完成 3 题，结束显示本轮小结。首次作答正确记作独立答对；它是练习统计，不代表掌握度。

野餐主线独立保留一个 6 格备餐台，两份相同食物打包后仍是该食物的两份备餐，不引入虚构的食物转化关系。5 个任务依次准备面包、两个苹果、牛奶、水，并将已交付的面包装进包里；完成的食物会出现在野餐场景。订单支持图文和听力两档；听力重复播放不算提示，查看文字、中文提示或答错重试后完成则记为提示后答对。语音失败时可查看英文文字继续。

认识词汇后 24 小时安排复习，使用另一幅 SVG 和新的英语语境。独立通过间隔复习后延长到 3 天；提示后通过则 24 小时后再练，每轮最多连续 4 题。分别记录提示后答对、独立答对和隔天仍答对；主动重新学习会重新安排间隔。提示标记持久保存，刷新不会把提示后完成变成独立答对。复习时间依赖设备时钟，仅为本地练习。

野餐每步奖励 12 星币，完成章节额外奖励 20 星币。首单解锁雨棚，完成章节解锁招牌和花盆；4 款装饰可用星币购买并切换，在“我的小店”中与商品相邻的预览里即时呈现；手机购买后会直接带到预览位置。默认雨棚为原木色，与鼠尾草绿区分。装饰解锁不要求满分。

词库与链长：`src/features/wordMerge/catalog.ts`。
棋盘与旧版存档迁移：`src/features/wordMerge/game.ts`。当前存档版本 4，沿用 `epartner-word-merge-v1` 键，自动迁移版本 1、2、3，保留棋盘、星币、订单和旧练习记录；不会将旧答题次数冒充隔天记忆记录。
野餐内容、学习间隔与经营规则：`src/features/wordMerge/journey.ts`。
野餐主界面与两套食物图：`src/components/word/PicnicJourney.vue`、`PicnicArt.vue`。
原创图：`src/components/word/WordMergeArt.vue`。
页面：`src/views/WordMergeGame.vue`。

后续小游戏功能以这个仓库为准，避免同时维护两份源代码；E_Partner 可用入口链接或 iframe 接入独立页面。新增图片与词库时需配套检查链条关系、英中例句、答案唯一性和旧词条 ID 的稳定性。

## 小动物来访

“今日任务”内选择小伙伴的来访卡，进入动物备餐。猫 Mochi、狗 Biscuit、兔子 Clover、虎皮鹦鹉 Pip 免费轮换：每次完整打开或刷新页面产生一位新访客，每四次来访覆盖四类动物，相邻来访不会重复；切换游戏导航不会刷新访客。跨本地自然日也会迎来新访客。动物会出现在装扮商店的小店插画旁。

每种动物有“原料小份 → 一碗／篮／碟 → 野餐盒”三层备餐路线。免费补给、点选合成、选中匹配英语请求的餐点后招待；首次招待展开对应野餐盒层级。物品与英语词义固定，不与旧词条 ID 混用。动物备餐是独立 8 格棋盘，支持退回选中物品，换访客仍保留备餐。

招待后点动物互动，发现隐藏添水委托；听懂 water、选中清水，解锁可实际合成的“温柔照料”路线：cloth → soft towel → pet cushion。每次成功招待或隐藏委托增加 1 友好积分；每种动物每天首次招待奖励 12 星币，首次隐藏委托奖励 8 星币。重复来访可继续陪伴和积累友好积分，不重复发放当天该物种的星币谢礼。此记录不计为单词独立回忆或掌握度。

食物提示依据 [RSPCA 猫饮食建议](https://www.rspca.org.uk/adviceandwelfare/pets/cats/diet)、[狗饮食建议](https://www.rspca.org.uk/adviceandwelfare/pets/dogs/diet)、[兔饮食建议](https://www.rspca.org.uk/adviceandwelfare/pets/rabbits/diet)与[鸟饮食建议](https://www.rspca.org.uk/adviceandwelfare/pets/birds/diet)编写：游戏为猫、狗和虎皮鹦鹉提供各自的适用品种配方粮，兔子路线围绕干草；水为隐藏任务的正确选择。游戏中的合并层级用于备餐与手作表现，不代表真实喂养份量或配方。

来访与配方规则：`src/features/wordMerge/visitors.ts`。动物／餐点插画与活动界面：`AnimalArt.vue`、`PetFoodArt.vue`、`VisitorCafe.vue`。雨棚、招牌、花盆商品插画在 `DecorationArt.vue`；均为本地 SVG。

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
