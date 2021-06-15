---
title: remove entry from linkedlist(using C)
author: yhx
date:   2000-06-16 02:30:00 +0800
math: true
mermaid: true
comments: true
abstract: "think differently"
tags: 算法 C
image:
  src: https://cdn.jsdelivr.net/gh/cotes2020/chirpy-images/commons/devices-mockup.png
---

链表节点定义如下：
```c
typedef struct node {
    int val;
    struct node* next;
} Node;
```

一般而言，我们通过给定指针，删除链表中指定元素的算法是这样的：
```c
void remove_list_entry_2(Node* entry) {
    Node *prev, *cur = head;

    while (cur != entry) {
        prev = cur;
        cur = cur->next;
    }

    if (prev) {
        prev->next = entry->next;
    } else {
        head = entry->next;
    }
}
```

在C语言中，我们要删除链表的一个元素，实际只要改变一下指针位置，使得这个元素不被串联在链表上即可；但是实际操作的时候分为两种情况，一种情况是待删除的元素时头结点，另一种情况是待删除元素为其他结点；最后的`if-else`就是为了做这个判断；

一般而言，我们不喜欢这种特殊情况，而是希望用一种更普遍的方式，让同一段代码可以处理所有情况；

下面就是另一种写法：
```c
void remove_list_entry_1(Node* entry) {
    Node** indirect = &head;

    while ((*indirect) != entry) {
        indirect = &(*indirect)->next;
    }
    *indirect = entry->next;
}
```

这里的head是指向Node节点的指针，indirect指向的是该指针的地址，也就是指针的指针，通过改变这个值，我们实现了删除元素；手动模拟一下这一过程理解会更加深刻；

![image](https://user-images.githubusercontent.com/85326814/122100281-96066980-ce45-11eb-9348-36a941dbe793.png)

上图是这一过程的一个图示，当我们找到待删除元素时，indirect存储的entry的地址，通过*indirect改变了entry的值后，链表实际的指向发生了变化；为什么呢？因为本来上一个元素的next指针中存储的是entry的值，现在通过这种方式直接修改了，所以实现了删除元素的目的。

后来我想，反正是找到地址的地址，为什么一开始就要这样做呢？于是我写出了另一个版本：

```c
void remove_list_entry_3(Node* entry) {
    Node* p = head;
    while (p != entry) {
        p = p->next;
    }
    // printf("equal: %d %d %d\n", (p == head), (entry == head), (p == entry));
    // printf("equal: %d %d %d\n", (&p == &head), (&entry == &head), (&p == &entry));
    Node** pptt = &p;
    *pptt = entry->next;
}
```

这里的错误地方在于，虽然p的值和entry是相等的，但是我们修改的`*pptt`只是这个p的地址，修改了这个地址不会导致原有的在链表上的地址发生变化，所以无法打成我们想要的效果；

![image](https://user-images.githubusercontent.com/85326814/122100042-4f187400-ce45-11eb-9327-33337b4c5174.png)

如上图所示，当我们找到了待删除的元素后，p的指向是正确的，但是我们通过获取p的地址pptt，然后再来*pptt修改p的值，对原始链表是没有任何影响的。

比较上述两种做法，就会对这一方法理解的更为深刻。

这是Linus在一次演讲中举的一个例子，为的是说明代码的品味(taste)以及好的设计的重要性，这种比较新奇的写法，可以避免`if-else`判断，也就是将特殊情况融合到了一般情况中，是一个比较优雅的设计。他也说了，这个小小的例子不足以设计好的设计的重要性，在更实际的项目中，好的设计和品味带来的效果是更加无穷的。同时，对于同一种问题，要think differently，从不同的角度来看待问题。

