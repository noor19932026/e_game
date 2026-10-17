# e_game

独立的英语合并小游戏。Vue 3 + TypeScript + Vite；生产运行只需要静态文件服务。

- 唯一项目包管理器是 pnpm，锁文件为 pnpm-lock.yaml。
- 修改后运行 pnpm test 和 pnpm build。交互或存档变更还需在 pnpm preview 启动后运行 pnpm test:browser。
- 不引入 E_Partner 的登录、数据库、后端配置、运行时 API 配置或用户凭据。
- 所有图片为内置 SVG，英语朗读使用浏览器／系统语音。
- 当前存档版本为 9，键为 epartner-word-merge-v1。现有词条 ID 的语义须保持稳定；变更时写迁移并测试。
- 词库在 src/features/wordMerge/catalog.ts；规则在 game.ts，动物来访规则在 visitors.ts；物品图在 src/components/word/WordMergeArt.vue。
- main 是可发布分支；后续功能分支使用 codex/ 前缀。
- 生产部署不得覆盖 /var/www/e_partner，不得停止或重启 PostgreSQL。部署只涉及独立静态目录、容器或 Nginx 路由。
- GitHub 仓库只放源码、测试、锁文件和部署配置。不要提交 node_modules、dist、.env、存档或真实密钥。
