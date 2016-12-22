### 如何写一个网页进度loading  

这里演示一个网页进度loading的写法，思路是：  

1. 默认显示loading，进度默认0；
2. 设置一个初步阶段，比如80，让进度条自动进行，表示当前页面在加载中；
3. 在页面就绪的时候（假设是window.onload），将进度推进到终点，比如100；
4. 隐藏loading。  


```javascript
var Progress = require('ez-progress')
var prg = new Progress()

var $loading = $('#loading')
var $prg = $('#progress')

prg.on('progress', function (res) {
  var progress = parseInt(res.progress)  // 注意进度取整，不然有可能会出现小数
  $prg.html(progress)
})

prg.go(80)

window.onload = function () {
  prg.complete(function () {
    $loading.hide()
  })
}
```

以上我们完成了一个简单的页面进度loading，不过有几个问题：  

1. 进度每次增加1，太平滑，不符合网络环境的特点；
2. 当页面很小的时候，window.onload很快就被执行了，而当页面很大的时候，window.onload很可能会等待很久，而其实页面已经就绪了，只是有些静态资源还在加载；
3. 页面进度一到达100%，`$loading`就被隐藏了，有点突然，这时候我们可能还来不及看清100%；
4. 每次进入页面，等待的第一阶段都是加载到80%，这也不符合网络环境的特点。  

针对这些问题，我们来试着解决：  

1. 在速度上使用区间的形式，随机增加进度，模拟网络环境的不稳定；  
2. 给window.onload设置一个超时时间，如果超过一定时间，比如5秒，还没有loaded，就直接执行`complete`，强制结束loading；  
3. 在loading到达100%的时候，延迟（大约1秒）隐藏loading；  
4. 将第一阶段的目标设置为区间，使得每次刷新之后得到的第一阶段为随机。  

其他的都挺好理解，我们着重讲解一下第二点，关于如何设置超时时间的问题。  

要知道超时与否，首先得有一个开始时间，和一个当前时间的对比，差值如果大于超时时间，那么就是超时了。那开始时间从什么时候开始设置呢？index.js从开始加载到加载完成，再到执行，也是需要花费时间的，在这之前，用户早就已经进入页面了，所以在index.js里登记开始时间是不合理的，所以，我们需要在head里，开始记录这个`loadingStartTime`：  


```html
<!DOCTYPE html>
<html>
<head>
  <title>progress</title>
  <script>
    window.loadingStartTime = new Date()
  </script>
  <script src="index.js"></script>
</head>
<body>
  <div id="loading">
    <div id="progress">0%</div>
  </div>
</body>
</html>
```



```javascript
var Progress = require('ez-progress')
var prg = new Progress({
  from: 0,
  to: 100,
  speed: [0, 15],
  delay: [0, 300]
})

var $loading = $('#loading')
var $prg = $('#progress')

prg.on('progress', function (res) {
  var progress = parseInt(res.progress)  // 注意进度取整，不然有可能会出现小数
  $prg.html(progress + '%')
})

prg.go([80, 90], null, [0, 3], [0, 200])

window.onload = loadingCompleted

if (new Date - window.loadingStartTime > 5000) {  // 如果超时了，则执行完成进度
  loadingCompleted()
} else {  // 如果没有超时，则在“剩余的时间”之后执行完成进度
  setTimeout(function () {
    loadingCompleted()
  }, 5000 - (new Date - window.loadingStartTime))
}

function loadingCompleted () {
  prg.complete(function () {
    setTimeout(function () {  // 延迟隐藏loading
      $loading.hide()
    }, 1000)
  },  [0, 5], [0, 50])
}

```


当然，你也可以不考虑那么多，如果只是简单的一个进度loading，那一load到底就可以了，一般来说，进度条走完的这段时间，也足够加载页面了，为了确保在window.onload的时候进度条能够快速走完，我们还可以在window.onload的时候埋点，如下：  


```javascript
var Progress = require('ez-progress')
var prg = new Progress()

var $loading = $('#loading')
var $prg = $('#progress')

prg.on('progress', function (res) {
  var progress = parseInt(res.progress)  // 注意进度取整，不然有可能会出现小数
  $prg.html(progress + '%')
})

prg.go([60, 70], function (res) {
  prg.complete(null, [0, 5], [0, 50])  // 飞一般地冲向终点
}, [0, 3], [0, 200])

window.onload = function () {
  prg.complete(null, [0, 5], [0, 50])  // 飞一般地冲向终点
}

```

如果你有更好的模拟实现，请联系我补充，谢谢！  

