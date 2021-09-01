---
title: StringBuilder and StringBuffer in Java
author: yhx
date:   2021-08-31 18:24:00 -0500
math: true
mermaid: true
tags: Java
---

## StringBuilder(since 1.5)

(Mutable): A mutable sequence of characters. 

(No synchronization): This class provides an API compatible with StringBuffer, but with no guarantee of synchronization. This class is designed for use as a drop-in replacement for StringBuffer in places where the string buffer was being used by a single thread (as is generally the case). 

(Faster)Where possible, it is recommended that this class be used in preference to StringBuffer as it will be faster under most implementations.


