# ez-progress  

一个web（伪）进度插件。  

我们经常会遇到需要做一个页面加载进度的loading需求。进度loading有别于一般的动画loading，一般来说，因为我们除了表达页面从开始加载，到加载完成这一过程之外，还需要显示出某一刻的加载进度（百分比），在web中要做到真实的进度控制是很难（其实我想说是不可能的），所以我们需要在这一段时间里作出一些模拟的效果，让用户觉得“我知道当前已经加载到什么程度了”。  


### install  

```shell
npm install ez-progress --save
```


### config  

```javascript
var Progress = require('ez-progress')
var progress = new Progress({
  from: 0,  // 默认进度条起点
  to: 100,  // 默认进度条终点
  speed: 1,  //  默认速度为1，单位为progress/delay（进度每间隔），详见api说明
  delay: 1000 / 11  // 默认时间间隔为11分之1秒，即进度变化周期
})
```

值得注意的是，所有配置项都是非必选的。。。  


### api  

1. **on** 用于事件监听
2. **fire** 用于触发事件
3. **handler** 事件集合
4. **from** 设置进度起点，该项覆盖配置项`from`
5. **add** 增量配置进度
6. **go**  设置目的进度
7. **end**  中断进度，进度不可恢复
8. **complete**  完成进度，若进度未达到最大值，将自动完成剩余进度
9. **reset**  对 **非中断非销毁** 的进度进行重置，回到配置的起点
10. **destroy**  销毁进度，进度不可恢复


#### 参数对照  

api | 入参 | 返回值 | 说明
--- | ---- | ------ | ---
on        |  event(str), callback(func)                                     |  -  |  -
fire      |  event(str), callback(func)                                     |  -  |  -
handler   |  -                                                              |  Object  |  -
from      |  progress(num/arr)                                              |  this  |  该项覆盖配置项`from`。
add       |  progress(num/arr), callback(func), speed(num/arr), delay(num/arr)  |  this  |  callback为必传项，所以若无回调请设置并占位为`null`，如：`add(10, null, 1, 100)`；speed为速度，单位是 **progress/delay** ，可以设置为具体数值，也可以设置为数组，设置为数组表示为取区间内的随机数，delay同理，如：`add(10, null, [1, 3], [100, 300])`，表示 **进度+10，无回调，速度为每时间间隔增加进度1～3，时间间隔为100～300毫秒之间** 。
go        |  progress(num/arr), callback(func), speed(num/arr), delay(num/arr)  |  this  |  参数同`add`，此api实质是由`add`实现的。
end       |  callback(func)                                                 |  this  |  中断进度，进度不可恢复（即不可reset）。
complete  |  callback(func), speed(num/arr), delay(num/arr)                 |  this  |  参数同`add`，此api实质是由`add`实现的，注意，不需要传progress。
reset     |  callback(func)                                                 |  this  |  **非中断非销毁** 的进度进行重置，回到配置的起点。
destroy   |  callback(func)                                                 |  this  |  销毁进度（config、data、timer、on、fire、handler），进度不可恢复。


> 留意：  
> 1. progress、speed暂不支持负值，所以add不支持传负数，go不支持倒退；
> 2. callback为必传项，无回调要设置为`null`；
> 3. speed和delay都是非必传项；
> 4. 所有callback都注入一个`data`。


#### callback (data)  

所有回调都注入一个`data`，这个`data`可以由`progress.data`（假设progress是一个进度实例）获得。初始化的data结构如下：  

```javascript
// cfg为配置项，由progress.config获得
data = {
  progress: cfg.from,  // progress初始化为配置起点，之后的操作过程中，表示即时进度
  next: {  // next表示当前进行中的进度段数据
    dist: cfg.from,  // 当前进度段的终点
    callback: null,  // 进度段结束后的回调
    speed: cfg.speed,  // 进度段（配置）速度，注意，不是当前实时速度
    delay: cfg.delay,  // 进度段（配置）间隔，注意，不是当前实时间隔
    status: 1  // 进度段的状态，初始化时为1表示已完成，0表示未完成
  },
  status: 0  // 进度条的状态，0表示正常工作，1表示锁定（已结束/中断后会将进度条锁定），2表示完成中（调用了complete之后，但complete未完成之前）
}
```


#### on/fire  

目前支持订阅的事件：  

事件 | 说明
--- | ---
progress  | 进度执行过程中的回调，可以了解进度的实时变化
add       | add被执行的时候
go        | go被执行的时候
passed    | 前一进度段被跳过（覆盖）的时候
ended     | end被执行的时候
completed | complete被执行的时候
destroy   | destroy被执行的时候
reset     | reset被执行的时候


> 留意：  
> 1. add/go等api传参的回调与通过on来订阅的回调是有本质区别的，api传参的回调是在本次进度完成之后执行，而on订阅的回调则是在一调用api就触发的；
> 2. passed事件的发生条件是，当多个进度在同步进行，在某个阶段a进度被b进度赶上并覆盖的时候，我们将取消a的过程，而继续完成b的过程，这个a被b赶上的那一瞬间，a被取消的那一刻，会触发一次passed事件；
> 3. destroy的回调都是在销毁之前执行的，因为销毁后的实例已经不具备执行回调的功能。



### 用法  

下面我们看演示代码：  

```javascript
var $prg = document.getElementById('progress')
var $prgBar = document.getElementById('progress_bar')

var Progress = require('ez-progress')
var prg = new Progress({
  from: 0,
  to: 100,
  speed: 1,
  delay: 1000 / 11
})

prg.on('progress', (res) => {
  console.log('progress: ' + res.progress)
  var prg = Math.round(res.progress)

  $prg.innerHTML = prg + '%'
  $prgBar.style.width = prg + '%'
})

prg.on('add', (res) => {
  console.log('add to: ' + res.next.dist)
})

prg.on('go', (res) => {
  console.log('go: ' + res.next.dist)
})

prg.on('passed', (res) => {
  console.log('passed: ' + res.next.dist)
})

prg.on('ended', (res) => {
  console.log('ended: ' + res.next.dist)
})

prg.on('completed', (res) => {
  console.log('completed: ' + res.progress)
})

prg.on('destroy', (res) => {
  console.log('destroy: ' + res.progress)
})

prg.on('reset', (res) => {
  console.log('reset: ' + res.progress)
})

prg.go([20, 60], function (res) {
  prg.add(30, null, [0, 3], [0, 100])
}, [0, 3], [0, 200])

setTimeout(() => {
  prg.complete(null, [0, 5], [0, 50])
}, 5000)
```

这里的演示代码只是一个简单的用法介绍，我们还详细介绍了一个网页进度loading的设计过程[Demo](./doc/startup.md)。  


### log  

0.1.0 - publish  
0.1.5 - 将原来返回实例的设计修改为返回函数本身  

