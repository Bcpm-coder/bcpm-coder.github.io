# bcpm Blog

一个以 Ubuntu 桌面为设计灵感的个人主页与 Markdown 博客，记录学习笔记、项目实践与生活片段。

🌐 在线访问：[https://bcpm-coder.github.io/](https://bcpm-coder.github.io/)

## 项目简介

项目使用 Angular 构建，将个人主页设计成可交互的桌面系统。访客可以从锁屏进入桌面，在窗口中阅读博客、浏览个人项目、切换主题与壁纸，也可以体验内置小游戏和音乐播放器。页面同时适配桌面端与移动端，并通过 GitHub Actions 自动部署到 GitHub Pages。

## 主要功能

- Ubuntu 风格锁屏、启动过渡、桌面、侧边栏与窗口管理
- Light / Dark 全局主题及静态、动态壁纸
- Markdown 博客阅读器，支持全文搜索、分类、目录和阅读进度
- 代码高亮、KaTeX 公式、Mermaid 图表与代码复制
- 个人简介、项目经历与技术栈展示
- APlayer 本地音乐播放器
- 2048、Card 2048 与 Hextris 小游戏
- 桌面端和移动端响应式适配
- GitHub Actions 自动构建与部署

## 技术栈

- Angular 21、TypeScript、Angular Signals
- Tailwind CSS、CSS
- Marked、Highlight.js、KaTeX、Mermaid、DOMPurify
- APlayer
- GitHub Actions、GitHub Pages

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:4200](http://localhost:4200) 即可预览。

生产构建：

```bash
npm run build
```

构建产物位于 `dist/ubuntu-portfolio/browser/`。

## 添加博客文章

将 Markdown 文件直接放入 `blog/` 目录。开发或构建前，脚本会自动扫描文章并生成目录；文章按照日期从新到旧排列。

推荐在文件顶部添加 Frontmatter：

```yaml
---
id: unique-post-id
title: 文章标题
excerpt: 一句话摘要
date: 2026-10-16
category: Coding
tags:
  - Angular
  - TypeScript
---
```

支持的分类为 `Coding`、`学习`、`生活` 和 `碎碎念`。未填写部分元数据时，生成脚本会尝试从文件名和正文中自动提取。

## 添加壁纸

将 `.png`、`.jpg`、`.jpeg`、`.webp`、`.avif`、`.mp4` 或 `.webm` 文件放入 `src/assets/images/wallpapers/`，重新运行开发服务或生产构建后即可在设置中选择。

## 目录结构

```text
blog/                         Markdown 文章源文件
scripts/                      博客与壁纸清单生成脚本
src/app/components/           桌面、窗口及应用组件
src/app/services/             主题、壁纸与窗口管理服务
src/assets/                   图片、音乐、游戏等静态资源
.github/workflows/deploy.yml  GitHub Pages 部署流程
```

## 作者

**不吃泡面** · Graduate Student at BUPT

[GitHub @bcpm-coder](https://github.com/bcpm-coder)
