---
id: md
title: "md入门"
excerpt: ""
date: "2026-07-19"
category: 学习
tags: ["Markdown", "写作"]
order: 2
---

# Markdown 入门

下面是一些简单的 Markdown 标记语法示例，更多示例请查看 [markdownguide.org/basic-syntax/](https://www.markdownguide.org/basic-syntax/)

## 标题

最多六级标题，一般建议在文章中 **由二级标题开始，最好不超过四级标题** [^1]

```markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
```

## 格式化

这是 **加粗** 文本  

这是 *斜体* 文本  

这是 ***粗体斜体*** 文本

**单段引用**

> 结尾使用两个以上的空格可以换行（大部分 Markdown 渲染器直接回车也可以）

**有序列表**

1. 你好
2. 再见
3. 谢谢

**无序列表**

- 桥豆麻袋
- 阿里噶多
- 死阔以内

**对于多段引用：**

> 鲁迅说过，对于多段引用
>
> 可以这样写
>
> 对吧？

**对于嵌套引用：**

> 鲁迅说过，对于嵌套引用，可以这样写
>
> > 但是我们要尽量避免嵌套引用

**注意是 Markdown**，而不是 ~~MarkDown~~

**短代码** `<hello></hello>`

**代码片段**

```html
<html>
  <head>
  </head>
</html>
```

**水平分割线**

---

**插入图片**

```markdown
![图片描述](图片 URL)
```

**插入超链接**

```markdown
[超链接文本](跳转 URL)
```

**插入带超链接的图片**

```markdown
[![Cat](cat.webp)](https://unsplash.com/photos/4ncBerwN-kA)
```

**直接渲染 URL**

```markdown
<https://github.com/DejavuMoe/hugo-start>
```

**直接渲染电子邮件地址**

```markdown
<i@gmail.com>
```

**脚注**

脚注并不是标准的 Markdown 标记语法，它是 Markdown 的扩展语法，但是 Hugo 默认支持它 [^2]

```markdown
Hugo 默认支持它 [^2]

[^2]: 这是一条脚注
```

[^1]: 一级标题是文章的标题（title）
[^2]: 这是一条脚注
