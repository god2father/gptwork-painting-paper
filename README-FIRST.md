# 世界名画剪纸拆解网站｜GPT Work 前置项目包

本目录已经按照“参考视频分析 → 名画分层 → 剪纸视觉处理 → 交互网站开发 → 视觉回归测试”的流程整理完成。

## 你现在只需要做两步

### 第一步：把参考视频准备好

推荐在 Windows PowerShell 中运行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\download-reference-video.ps1
.\scripts\prepare-reference.ps1
```

如果抖音限制脚本访问：

1. 在抖音中打开原作品；
2. 使用抖音自带“保存本地”，或使用你有权使用的下载方式保存视频；
3. 将文件复制到：

```text
reference/reference-video.mp4
```

4. 再执行：

```powershell
.\scripts\prepare-reference.ps1
```

### 第二步：把整个文件夹交给 GPT Work

在 GPT Work 中打开本文件夹，粘贴 `WORK_PROMPT.md` 的完整内容并开始执行。

## 已锁定的参考作品

- 作者：虎鲸碎碎念
- 标题：我用一个剪纸 Skill，拆开了 3 幅世界名画
- 分享链接：`https://v.douyin.com/hf-LFsv2UOU/`
- 抖音作品 ID：`7661842516941911154`

## 重要原则

- 不允许将原视频直接作为网页主体或背景视频冒充交互效果。
- 第一阶段只做一幅名画的高质量样板。
- 所有图层和动画必须配置化。
- 分层结果必须经过人工检查后再批量扩展。
- 参考视频仅用于内部分析和效果研究，发布网站时不得未经授权重新分发原视频、音乐或作者素材。
