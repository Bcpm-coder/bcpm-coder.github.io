---
id: cpp-stl-map
title: "C++ STL：map 高级数据结构"
excerpt: "快速查阅 map 的增删查改、迭代器与 O(logN) 时间复杂度。"
date: "往期题解"
category: Coding
tags: ["C++", "STL", "map"]
order: 5
---

# 【map】增删查改时间复杂度O(logN)

## 描述

c++高级数据结构

## 特点

1. 有序
2. 不重复
3. 基于红黑树

## 常用方法

| funcN              | function                                     |
| ------------------ | -------------------------------------------- |
| insert(pair(k, v)) | 将key:value插入容器，若之前存在key:??,则忽略 |
| map[key] = value   | 创建key:value插入容器中，若之前存在则覆盖    |
| count(key)         | 返回1或0：是否存在键值对key:??               |
| erase(key)         | 删除值为key:??的元素                         |
| begin()            | 返回第一个元素的迭代器                       |
| end()              | 返回最后一个元素的下一个位置的迭代器         |
| clear()            | 清空map                                      |
| empty()            | 判断是否为空                                 |
| size()             | 返回容器的当前容量                           |
| rbegin()           | 返回最后一个元素的反向迭代器                 |
| rend()             | 返回第一个元素的前一个反向迭代器             |
| erase(iterator)    | 删除iterator指向的键值对                     |
| find(key)          | 返回值key:??的迭代器，没找到则返回end()      |

## 内部按照key从小到大排序

### 例题
 map基本应用[学籍管理](https://www.luogu.com.cn/problem/P5266)
