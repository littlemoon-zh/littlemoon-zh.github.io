---
layout: post
title:  "Java中的String"
date:   2019-04-08 19:50:00 +0800
tags: Java
excerpt_separator: <!--more-->
comments: false
abstract: "Java中的不可变数据类型String"
---
## **不可变类型**

String是不可变类型（immutable），String.java源码中声明如下：

```java
private final byte[] value;
```

String通过字节数组来实现，且被声明为private final byte类型，表明对外的不可访问性（private），以及不可改变性（final）；

如果试图对其改变，会生成新的对象：

```java
String s1 = "abc";
String s2 = s1;
System.out.println(s1 == s2);
s1 = "def";
System.out.println(s1 == s2);
```

输出结果为：

```java
true
false
```

原本s1和s2指向的是同一内存空间地址，所以先输出true，接着将"def"赋值给s1，由于String是不可变类型，不能够将原来地址中存放的内容改变成"def"，所以将创建新的"def"，并将它的地址赋值给s1，所以此时输出结果为false。

## **==和equals**

在java中等号**==**一般用于判断两者内存地址是否相同，而重载过的equals方法常用于判断内容是否相同，比如在String.java源码中，equals方法定义如下：

```java
public boolean equals(Object anObject) {
    if (this == anObject) {
        return true;
    }
    if (anObject instanceof String) {
        String aString = (String)anObject;
        if (coder() == aString.coder()) {
            return isLatin1() ? StringLatin1.equals(value, aString.value)
                              : StringUTF16.equals(value, aString.value);
        }
    }
    return false;
}
```

首先判断内存地址是否相等，如果内存地址相等，说明两者指向同一对象，那么存储的内容也必然是相同的；如果内存地址不相等，再判断待比较的对象是否是String类的实例，如果是，再判断编码方式是否相同（单字节编码或双字节编码），在编码方式相同的情况下，分别调用不同编码方式下的比较函数，比较它们的value值（上面所提到的value数组）是否相等。

## **字符串常量池**

常量池是为了避免频繁的创建和销毁对象而影响系统性能，JVM为了提高性能和减少内存开销，在实例化字符串常量的时候进行了一些优化：为字符串开辟一个字符串常量池，类似于缓存区；创建字符串常量时，首先检查字符串常量池是否存在该字符串，如果存在该字符串，返回引用实例，不存在，实例化该字符串并放入池中：

```java
String s1 = "abc";
String s2 = "abc";
System.out.println(s1 == s2);
```

首先创建一个字符串"abc"，由于常量池中当前没有任何字符串，所以创建该字符串"abc"并将其加入字符串常量池中，然后返回其引用（地址），接着创建s2，首先在线程池中检查，发现有"abc"，所以直接返回其引用（地址），所以输出结果为true；

在如下的例子中，稍微做了一些改变：

```java
String s1 = "abc";
String s2 = new String("abc");
System.out.println(s1 == s2);
```

这段代码使用构造函数来构造一个字符串"abc"，此时输出结果为false，表明两者指向的地址不同，如果按照上面的思路，在构造s2时，首先检查常量池，发现有"abc"，那么应该直接返回它的地址，并得到true的结果，但并不是这样的；对于用String( )构造的字符串，它们不属于常量，而是变量，不能在程序编译的时候就确定地址，它们有自己的内存地址空间；也就是说在JVM机制中，常量和变量享有不同区域的内存空间，两者是不会重叠的；

再看如下代码段：

```java
String s1 = "abc";
String s2 = new String("abc");
s2 = s2.intern();
System.out.println(s1 == s2);
```

此时输出结果为true，加了一行代码，结果就变的不同；intern( )是扩充常量池的一个方法；当一个String实例调用intern()方法时，Java查找常量池中是否有相同的字符串常量，如果有，则返回其的引用，如果没有，则在常量池中增加此字符串并返回它的引用；

所以在本段代码中，对s2调用intern方法时，检查到常量池中有"abc"，所以返回它的引用，所以s1和s2指向的是同一个来自于常量池中的"abc"，所以两者地址相同，结果为true，而原先s2指向的变量类型的"abc"被丢弃；

为了总结上述内容，再看如下代码段：

```java
String s1 = new String("x");
String s2 = s1;
String s3 = "x";
s1 = s1.intern();
s2 = "xxxx";
System.out.println(s1 == s3);
System.out.println("s1 : " + s1);
System.out.println("s2 : " + s2);
```

输出结果为：

```java
trues1 : xs2 : xxxx
```

第1行，使用String构造函数创建字符串"x"，同时在常量池中增加"x"，此时s1指向的是变量类型的"x"，而不是常量池中的"x"；

第2行，将s1赋值给s2，此时s2指向变量类型的"x"；

第3行，创建"x"，返回的是常量池中的"x"的地址；

第4行，将s1指向常量池中的"x"；

第5行，改变s2为"xxxx"，并将其添加到常量池中；

第6行，得到结果为true，因为都指向常量池中对象；

第7行，结果为x；

第8行，由于是不可变类型，所以输出xxxx；

常量的编译优化

看如下的代码：

```java
String s1 = "abc";String s2 = s1;System.out.println(s1 == s2);s1 = "a" + "b" + "c";System.out.println(s1 == s2);
```

结果为：

```java
truetrue
```

在IDE中查看.class文件，其实是查看它反编译后的代码，查看上述代码反编译后的代码如下：

```java
String s1 = "abc";String s2 = s1;System.out.println(s1 == s1);s1 = "abc";System.out.println(s1 == s2);
```

在s1的地方，本来写的是三个字符串相加，但经过反编译查看得到是最后的结果，也就是编译器做出了优化，在编译时就能确定"a" + "b" + "c"的结果为"abc"，所以不会分别将abc添加到常量池中，而是对它们的结果进行添加；进一步地，通过javap -c查看字节码，也未发现有abc单独出现的迹象：

```
0: ldc           #2                  // String abc       2: astore_1       3: aload_1       4: astore_2       5: getstatic     #3                  // Field java/lang/System.out:Ljava/io/PrintStream;       8: aload_1       9: aload_2      10: if_acmpne     17      13: iconst_1      14: goto          18      17: iconst_0      18: invokevirtual #4                  // Method java/io/PrintStream.println:(Z)V      21: ldc           #2                  // String abc      23: astore_1
```

在21行和0行，都只出现了完整的abc；

## **杂问题**

问如下代码创建了几个对象：

```java
String s1 = "abc";
```

答：两个，一个在堆内存中（变量内存位置），一个在常量池中；

如下代码结果：

```java
String s1 = "ab";String s2 = "abc";String s3 = s1 + "c"; System.out.println(s3 == s2);
```

答：false，常量和变量相加得到变量，所以s3指向的是变量的空间，s2指向的是常量池中地址，两者不可能相等；

**--end--**