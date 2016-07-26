ikngHistory
---
历史记录管理
如何安装
===

```
$ cnpm i --save @spider/ikngHistory
```

快速开始
===

```
// 引入模块
require('@spider/ikngHistory');

angular

// 添加依赖模块
.module('app', ['ik.ngHistory'])

// 监听
.run(function(ikngHistory,$rootScope){

  $rootScope.$on('$stateChangeStart', function(e){
  
    // 添加监听
    ikngHistory.listenToChangeStart(e);
    
  });
  
  $rootScope.$on('$stateChangeSuccess', function(){
  
    // 添加监听
    ikngHistory.listenToChangeSuccess();
    
  });
});

```

Method
===
```
/**
* 跳转路由
* @param name        type(string)     路由
* @param params      type(JSON)       跳转参数
* @param byStack     type(Boolean)    是否通过栈中查找路由跳转
*/
ikngHistory.go(name, params, [byStack]);


/**
* 从历史栈中返回
* @param index     type(Number)    需要返回的层级数  注：值为负数
*/
ikngHistory.back(index);


/**
* 跳转URL
* @param url       type(string)     跳转地址
* @param params    type(JSON)       跳转参数
*/
ikngHistory.goUrl(url, [params]);


/**
* 历史栈中插入数据
* @param data         type(JSON)        需要添加到历史栈中对象
* @param isMustAdd    type(Boolean)     强制加入栈中    
* @returns {*}
*/
ikngHistory.pushState([data], [isMustAdd]);


/**
* 更新当前栈对象
* @param params    type(JSON)     所需更改历史栈的对象
*/
ikngHistory.updateState(params);

```

注意事项
===
- 需将所有内部路由跳转方法替换成 `ikngHistory.go(name, params, byStack);`
- 需将所有URL跳转方法替换成 `ikngHistory.goUrl(url, params);`

ChangeLog
---
0.0.3
