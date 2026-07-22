---
id: cpp-stl-set
title: "C++ STL：set 高级数据结构"
excerpt: "整理 set 的常用方法、红黑树特性与两种自定义排序方式。"
date: "往期题解"
category: Coding
tags: ["C++", "STL", "set"]
---

# 【set】增删查改时间复杂度O(logN)

## 描述

c++高级数据结构

## 特点

1. 有序
2. 不重复
3. 基于红黑树

## 常用方法

| funcN               | function                                                     |
| ------------------- | ------------------------------------------------------------ |
| insert(value)       | 返回pair:first是指向value的迭代器，second是否插入成功（插入不成功因为已经存在该元素） |
| begin()             | 返回第一个元素的迭代器                                       |
| end()               | 返回最后一个元素的下一个位置的迭代器                         |
| clear()             | 清空set                                                      |
| empty()             | 判断是否为空                                                 |
| max_size()          | 返回set容器可能包含的元素最大个数                            |
| size()              | 返回容器的当前容量                                           |
| rbegin()            | 返回最后一个元素的反向迭代器                                 |
| rend()              | 返回第一个元素的前一个反向迭代器                             |
| erase(iterator)     | 删除iterator指向的值                                         |
| erase(first,second) | 删除迭代器first和second之间的值                              |
| erase(value)        | 删除值为value的元素                                          |
| find(value)         | 返回值为value的迭代器，没找到则返回end()                     |
| lower_bound(value)  | 返回第一个大于等于value的迭代器                              |
| upper_bound(value)  | 返回第一个大于value的迭代器                                  |


## 定义set排序顺序 1 重载()
```cpp
#include <iostream>
#include <cstring>
#include <cstdio>
#include <algorithm>
#include <set>

using namespace std;

struct cmp
{
	bool operator()(const int &a, const int &b) const
	{
		return a > b;
	}
};

int n;
set<int, cmp> s;

int main()
{
	s.insert(1);
	s.insert(2);
	s.insert(5);
	for(auto i = s.begin(); i != s.end(); i ++)
	cout << *i << " ";
	
	return 0;
}
```

## 定义排序顺序 2 重载<

```cpp
#include <iostream>
#include <cstring>
#include <cstdio>
#include <algorithm>
#include <set>

using namespace std;

struct Node
{
	int age, height;
	
	Node(int age, int height):age(age), height(height){}
	
	bool operator<(const Node& a) const
	{
		if(height != a.height)
		return height > a.height;
		else
		return age > a.age;
	}
	// 这种情况下 只考虑了height，所以只要height相同，只会保留一个元素，和age无关 
//	bool operator<(const Node& a) const
//	{
//		return height > a.height;
//	}
};

int n;
set<Node> s;

int main()
{
	s.insert(Node(18, 166));
	s.insert(Node(16, 180));
	s.insert(Node(20, 170));
	s.insert(Node(19, 170));
	for(auto i = s.begin(); i != s.end(); i ++)
	cout << i -> height << " ";
	
	return 0;
}
```

### 例题
 set基本应用[木材仓库](https://www.luogu.com.cn/problem/P5250)
