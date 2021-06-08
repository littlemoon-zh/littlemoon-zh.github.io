---
layout: post
title:  "python异步io"
date:   2021-05-30 22:00:00 +0800
tags: Python io 异步io
excerpt_separator: <!--more-->
comments: false
abstract: "asyncio模块"
---

# 异步io

## example

让人对某件事情感兴趣的最好方法，就是让他看到这个事情的巨大效益，所以先来几个example。

我们在这里用三种方式做同样的事情：请求一个url若干次，获取它的响应，打印出来，并且统计执行时间，

请求的url是`https://httpbin.org/uuid`，每次请求这个接口，就会返回一个uuid，不过这里返回什么对我们不重要，重要的是有一个请求，有一个响应；


三种实现方式是：

- 单线程同步
- 多线程同步
- 异步io

### 统计时间
逻辑就是分别记录任务执行前后的时间，然后打印差值得到任务运行时间；这里我们使用一种原理相同，但是看起来高级一点的方式，使用functools中的wraps做一个统计执行之间的装饰器：
```python
def time_cost(fn):
    if asyncio.iscoroutinefunction(fn):
        @wraps(fn)
        async def wrapper(*args, **kwargs):
            start = time.time_ns()
            res = await fn(*args, **kwargs)
            print(f'func {fn.__name__} costs {(time.time_ns() - start) / 1e6:.2f} ms')
            return res

        return wrapper
    else:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            start = time.time_ns()
            res = fn(*args, **kwargs)
            print(f'func {fn.__name__} costs {(time.time_ns() - start) / 1e6:.2f} ms')
            return res

        return wrapper
```
由于我们在后面使用到了coroutine，所以这里有个逻辑判断，因为coroutine的执行方法和普通函数有所不同；不过这都不是重点，重点是只要使用这个装饰器就可以方便地统计函数执行时间。
### 单线程同步

```python
@time_cost
def sync_fun():
    with requests.session() as session:
        for i in range(REQUEST_TIMES):
            with session.get(url) as response:
                res = response.json()
                print(res)
```
在请求次数为1000时，该程序耗时265s（output: `func sync_fun costs 265529.33 ms`），足足四分多钟。

### 多线程
这里我们用线程池来执行请求，最大线程数量为12（默认值`(os.cpu_count() or 1) + 4`）;
```python
@time_cost
def multi_threading():
    def req(session):
        res = session.get(url)
        print(res.json())

    with ThreadPoolExecutor(max_workers=12) as executor:
        with requests.session() as session:
            executor.map(req, [session] * REQUEST_TIMES)
            executor.shutdown(wait=True)
```
执行1000次请求，时间为22s左右（`func multi_threading costs 22583.47 ms`），相比于单线程的方式，速度提高了很多。

### 异步io
由于异步io的执行方式有所不同，导致代码略显冗长，但是整体的思路仍然是一样的；
```python
async def req(session):
    async with session.get(url) as response:
        res = await response.json()
        print(res)


@time_cost
async def async_func():
    async with aiohttp.ClientSession() as session:
        tasks = []
        for i in range(REQUEST_TIMES):
            tasks.append(req(session))
        await asyncio.gather(*tasks)
        
        
if __name__ == '__main__':
    asyncio.run(async_func())
```

在1000次请求的条件下，程序耗时1.4s左右（`func async_func costs 1351.87 ms`），可以说是吊打上面的两种方式。


## 为什么这里这么快

为什么异步io这么快呢？并不是因为使用了异步io，而使单个请求变快了，而是它大大提高了并发性，在一段时间内发起大量请求；

串行方式是这样的：
![](https://files.mdnice.com/user/15431/a344c184-2805-44ec-b73f-fade3288328c.png)
而异步是这样的，各个任务交织在一起；
![](https://files.mdnice.com/user/15431/01d3fe31-dd3e-4a3f-96a1-bb77716e28c8.png)
多线程和异步io的模式类似，但是由于是在多线程环境，线程之间切换也是一笔开销。而这里使用的异步io仅仅使用一个线程，没有线程切换的开销，虽然各个任务之间有切换的开销，但是非常非常小。

## 为什么现实中也可以非常快

我们这里的例子可以说是一个toy example，但是在现实中，它确实可以达到amazing的效率。这主要是因为现在的大部分应用都是io密集型的，也就是说都类似于这里的toy example，它们的特点的就是需要处理大量的io操作，而对CPU产生的负荷非常小。

在io密集型任务中，最耗时的操作是等待io完成，比如发起一个网络请求，并不知道它什么时候能返回，而同步的方法就是一直“干等着”直到它返回，所以整体的执行时间就是各部分执行时间之和。异步io则不需要等待前一个任务执行完，在同一时段内发起大量任务，后面使用其他机制（event loop）来获取任务完成情况，并做相应处理，大大提高了并发性。

所以也可以看出不适合异步io的情况，那就是计算密集型任务，比如挖矿里面的hash值计算，即使使用了异步io，性能也几乎不会有提升。

## 总结

异步io并不是Python的特色，在多种编程语言中都有所体现。异步io、多线程、多进程的目的都是为了提高并发，从而更好地压榨硬件资源，进一步提升用户体验。异步io可以和多线程已经多进程模型结合，从而进一步提升并发性能。
