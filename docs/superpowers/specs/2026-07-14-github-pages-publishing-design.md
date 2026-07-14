# GitHub Pages 发布设计

## 目标

把当前《戴珍珠耳环的少女》互动网站发布为可直接访问的 GitHub Pages 页面，预计地址为：

`https://god2father.github.io/gptwork-painting-paper/`

## 方案

- 使用 GitHub 官方 Pages 和 GitHub Actions，不增加第三方托管服务或项目依赖。
- 为 Vite 设置仓库子路径 `/gptwork-painting-paper/`，保证脚本、样式和图片在 Pages 地址下正常加载。
- 增加一个部署工作流：每次 `main` 更新时安装锁定依赖、执行生产构建并把 `dist` 发布到 Pages。
- 同时允许从 GitHub Actions 页面手动重新发布。
- 使用 GitHub API 把 Pages 的发布来源设置为 GitHub Actions。

## 验证

- 本地运行类型检查、测试和生产构建。
- 确认 GitHub Actions 部署任务成功。
- 打开线上地址，检查页面加载、图片素材、逐片拼合以及纸片点击交互。
- 如果私有仓库的账户权限不支持 Pages，停止修改仓库可见性，并明确说明需要用户选择公开仓库或其他托管方式。

## 范围

- 不修改页面设计和交互。
- 不增加自定义域名、统计、后端或第三方部署服务。
- 不自动把私有仓库改为公开仓库。

## 回滚

删除 Pages 工作流并移除 Vite 的仓库子路径配置即可恢复到发布前状态；GitHub Pages 本身可以通过 API 或仓库设置关闭。
