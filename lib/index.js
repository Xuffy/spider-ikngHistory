'use strict';

angular
  .module('ik.ngHistory', ['ngStorage'])
  .provider('ikngHistory', ikngHistory);

function ikngHistory() {

  this.$get = ['$sessionStorage', '$state', '$location', '$rootScope',
    function ($sessionStorage, $state, $location, $rootScope) {
      var historyServices = {};

      historyServices.go = go;

      historyServices.back = back;

      historyServices.goUrl = goUrl;

      historyServices.info = info;

      historyServices.pushState = pushState;

      historyServices.updateState = updateState;

      historyServices.listenToSuccess = listenToSuccess;

      historyServices.listenToChangeStart = listenToChangeStart;

      historyServices.listenToChangeSuccess = listenToChangeSuccess;

      init();

      return historyServices;

      /**
       * 初始化
       */
      function init() {
        var ignoreStack;

        // 赋值到$rootScope作用域
        $rootScope.ikngHistory = historyServices;

        // 初始化historyStack对象
        if (_.isEmpty($sessionStorage.historyStack)) {
          $sessionStorage.historyStack = {
            state: []
          };
        }

        // 标识当前跳转为内部跳转
        $sessionStorage.historyStack.isExternalBack = false;

        // 记录初始化时浏览器历史长度  注：后面每次把栈的长度和浏览器历史长度做比较，防止长度不一致导致跳转错误
        if (!$sessionStorage.historyStack.initIndex) {
          $sessionStorage.historyStack.initIndex = history.length;
        }

        // 删除历史栈中忽略的栈对象
        ignoreStack = ignoreStackCount();
        if (ignoreStack > 0) {
          remove(ignoreStack * -1);
        }

        // console.log('history长度-------', $sessionStorage.historyStack);
      }


      /**
       * 获取历史栈信息
       * @param key
       * @returns {*}
       */
      function info(key) {
        var stack;

        stack = $sessionStorage.historyStack;

        stack = key ? stack[key] : stack;

        return stack;
      }

      /**
       * 获取指定历史信息
       * @param key
       * @returns {*}
       */
      function getState(key) {

        var stack = info('state');

        // 判断是否存在历史栈
        if (!_.isEmpty(key)) {

          if (_.isNumber(key)) { // 判断是否通过下标获取栈信息

            stack = stack[key];

          } else if (_.isString(key)) { // 通过指定URL获取栈信息

            stack = _.findWhere(stack, {url: key});

          } else if (_.isObject(key)) { // 通过指定对象匹配获取栈信息
            _.map(stack, function (val) {

              var v = _.pick(val, _.keys(key));

              if (_.isEqual(v, key)) {
                stack = val;
              }
            });
          }
        }

        return stack;
      }


      /**
       * 历史栈中插入数据
       * @param data         type(JSON)        需要添加到历史栈中对象
       * @param isMustAdd    type(Boolean)     强制加入栈中
       * @returns {*}
       */
      function pushState(data, isMustAdd) {
        var stack, currentUrl, lastState;

        stack = info('state');
        lastState = _.last(stack);
        currentUrl = $location.absUrl(); // 获取当前完整地址
        data = data || {url: currentUrl, router: {name: $state.current.name, params: $location.search()}}; // 拼装栈对象

        // 判断如果是刷新当前页面则不增加到栈中
        if (isMustAdd || (_.isEmpty(lastState) || lastState.url !== currentUrl)) {

          // 判断最后一条栈记录是否标识了结束忽略  若未表示则继续增加忽略标识
          if (!_.isEmpty(lastState) && lastState.isIgnore && !lastState.endIgnore) {
            data.isIgnore = true;
          }

          stack.push(data);

          // 更新历史栈
          $sessionStorage.historyStack.state = stack;

          // 清除开始返回标记
          $sessionStorage.historyStack.goOutLength = null;
        }

        return stack;
      }

      /**
       * 跳转路由
       * @param name        type(string)     路由
       * @param params      type(JSON)       跳转参数
       * @param byStack     type(Boolean)    是否通过栈中查找路由跳转
       */
      function go(name, params, byStack) {
        var router, state, index, stack;

        stack = info('state');
        params = params || {};
        router = {name: name, params: params};
        state = getState({router: router}); // 通过对象获取栈中具体对象
        index = _.findLastIndex(getState(), state); // 查找对象在栈中下标

        // 标识当前跳转为内部跳转
        $sessionStorage.historyStack.isExternalBack = false;


        // 判断栈中是否存在将要跳转的路由
        if (byStack && _.isObject(state) && index > -1) {

          // 若存在则直接通过历史返回跳转路由，避免增加多余历史
          back((stack.length - (index + 1)) * -1);
        } else {

          // 若不存在，则直接跳转该路由
          $state.go(name, params);
        }

      }

      /**
       * 跳转URL
       * @param url       type(string)     跳转地址
       * @param params    type(JSON)       跳转参数
       */
      function goUrl(url, params) {
        var stack;

        stack = info('state');

        // 拼接参数
        if (!_.isEmpty(params) && _.isObject(params)) {
          url += (url.indexOf('?') > -1 ? '&' : '?') + $.param(params);
        }

        if (_.isString(url)) {

          // 标识当前跳转为内部跳转
          $sessionStorage.historyStack.isExternalBack = false;

          // 记录
          if (!_.isNumber($sessionStorage.historyStack.goOutLength)) {
            $sessionStorage.historyStack.goOutLength = history.length - stack.length;
          }

          window.location.href = url;
        }
      }

      /**
       * 从历史栈中返回
       * @param index     type(Number)    需要返回的层级数  注：值为负数
       */
      function back(index) {
        var ignoreStack = ignoreStackCount(); //获取栈中标识为忽略的对象

        if (index && !_.isNumber(index)) {

          // index必须为number类型
          throw new Error('function back(index) - index is not number type');

        } else if (index > 0) {

          // index必须为负数
          throw new Error('function back(index) - index must be a negative');
        }

        // 若未传入index 默认-1
        index = index || -1;

        // 标识当前跳转为内部跳转
        $sessionStorage.historyStack.isExternalBack = false;

        // 判断是否存在忽略的栈对象
        if (ignoreStack > 0) {
          // 跳过标识为忽略的栈对象
          index = (ignoreStack + 1) * -1;
        }

        // 删除栈中对象
        remove(index);

        // 跳转浏览器历史记录
        history.go(index);

      }

      /**
       * 删除跳过的历史栈
       * @param index
       */
      function remove(index) {
        var stack;

        stack = info('state');

        if (_.isNumber(index)) {

          // 更新goOutLength值  注：记录历史栈和浏览器历史长度差值
          if (!_.isNumber($sessionStorage.historyStack.goOutLength)) {
            $sessionStorage.historyStack.goOutLength = history.length - stack.length;
          }

          // 过滤需要删除的栈对象
          $sessionStorage.historyStack.state = _.reject(stack, function (val, i) {
            return i > stack.length + index - 1;
          });
        } else {
          throw new Error('function remove(index) - index is not number type');
        }
      }

      /**
       * 校验栈是否存储异常
       * @returns {boolean}
       */
      function checkStackError() {
        /*var initIndex, stackLen;

         initIndex = info('initIndex');
         stackLen = info('state').length;

         // 校验历史栈的长度与浏览器历史长度是否一致
         if ((history.length - stackLen) >= (initIndex - 1)) {
         return false;
         } else {
         console.log('历史栈不正常,跳转go', (history.length - initIndex) * -1);
         remove((history.length - initIndex) * -1);
         history.go((history.length - initIndex) * -1);
         return true;
         }
         */
      }

      /**
       * 更新当前栈对象
       * @param params    type(JSON)     所需更改历史栈的对象
       */
      function updateState(params) {
        var stack, lastState;

        stack = info('state');
        lastState = _.last(stack);

        if (!_.isEmpty(params) && !_.isEmpty(lastState) && lastState.url === $location.absUrl()) {

          // 删除最后一条栈对象
          remove(-1);

          // 添加栈对象
          pushState(_.extend(lastState, params));

        }

      }

      /**
       * 查找历史栈中忽略的栈对象个数
       * @returns {number}
       */
      function ignoreStackCount() {
        var stack, num;

        stack = info('state');
        num = 0;

        for (var i = stack.length - 1; i >= 0; i--) {
          if (stack[i].isIgnore && !stack[i].isCannotRemove) {
            num++;
          } else if (stack[i].url !== $location.absUrl()) {
            return num;
          }
        }

        return num;
      }

      /**
       * 监听路由切换
       */
      function listenToSuccess() {

        // console.log('stack.length--', info('state').length);
        // console.log('history.length--', history.length);

        // 记录浏览器历史长度
        $sessionStorage.historyStack.historyLength = history.length;

      }

      /**
       * 监听开始路由切换
       */
      function listenToChangeStart(e) {
        var stack, lastState, ignoreStack;

        stack = info('state');

        // 判断是否为外部返回
        if (info('isExternalBack')) {

          // 从历史栈中获取倒数第二个栈对象
          lastState = stack[stack.length - 2];

          // 判断是否设置了监听返回执行方法
          if (_.isFunction($rootScope.historyListenToBack)) {

            // 判断是否为前进之后的跳转
            if (info('isExternalBackAfter')) {

              // 禁止页面渲染
              e.preventDefault();

              // 执行自定义返回方法
              $rootScope.historyListenToBack();

              // 重置执行自定义返回方法
              $rootScope.historyListenToBack = null;

              // 取消该次不为前进跳转
              $sessionStorage.historyStack.isExternalBackAfter = false;

            } else if (lastState && lastState.url === $location.absUrl()) {

              // 标识当前跳转为外部跳转
              $sessionStorage.historyStack.isExternalBack = true;

              // 设置标识为物理返回键后的前进
              $sessionStorage.historyStack.isExternalBackAfter = true;

              // 当物理返回键触发时，历史栈中也要删除对应记录
              remove(-1);

              // 前进跳转
              history.forward(1);

            }
          } else if (lastState && lastState.url === $location.absUrl()) {
            ignoreStack = ignoreStackCount();

            // 当物理返回键触发时，历史栈中也要删除对应记录
            remove(-1);

            if (ignoreStack > 2) {
              back();
            }
          }
        }

      }

      /**
       * 监听完成路由切换
       */
      function listenToChangeSuccess() {

        var search, stack, routerObj, goOutLength, lastState, newLastState;

        search = $location.search(); // 获取地址参数
        stack = info('state');
        lastState = _.last(stack); // 获取历史栈中最后一个栈对象
        goOutLength = $sessionStorage.historyStack.goOutLength;

        // 判断是否是从其他项目跳回
        if (!_.isUndefined(search._isNormalGo) && _.isNumber(goOutLength)) {

          // 计算需要补全的历史长度  注：浏览器历史长度 - 浏览器历史和历史栈的长度差值 - 历史栈长度
          goOutLength = history.length - goOutLength - stack.length;

          // 拼装当前历史对象  并且增加isIgnore标识
          routerObj = {
            url: $location.absUrl(),
            router: {name: $state.current.name, params: $location.search()},
            isIgnore: true
          };

          // 判断跳回是否是原地址 并且最后一个历史栈对象不存在isCannotRemove(不能删除)标识
          // 注：若跳转出去是A页面，并且返回也是A页面时，需要把历史栈中A页面的栈对象删除，不然会产生两个A页面栈对象
          // 并且，把A页面之前的栈对象标识isCannotRemove(不能删除)，不然多次类是操作会误删除之前栈对象
          if (search._isNormalGo === 'true' && !lastState.isCannotRemove) {

            // 删除最后一个栈对象
            remove(-1);

            // 获取当前历史栈中最后一个栈对象
            newLastState = _.last(info('state'));

            // 给最后一个栈对象增加isCannotRemove标识
            newLastState.isCannotRemove = true;

            // 加入历史栈中
            pushState(newLastState);

            // 删除最后一个栈对象
            remove(-1);

            // 加入历史栈中
            pushState(routerObj);
          }

          // 不全历史长度到历史栈中
          for (var i = 0; i < goOutLength; i++) {

            pushState(routerObj, true);
          }

          updateState({endIgnore: true});

        } else {
          pushState();
        }

        // 标识当前跳转为外部跳转
        $sessionStorage.historyStack.isExternalBack = true;

        // 重置执行自定义返回方法
        if (!info('isExternalBackAfter')) {
          $rootScope.historyListenToBack = null;
        }

      }
    }];

}