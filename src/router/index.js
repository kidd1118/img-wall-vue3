import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
import ImgWall from '@/components/ImgWall';

Vue.use(Router);

const testPage = { template: 
  `<div>
    <h2>test page : {{ $route.params.id }}</h2>
  </div>` 
}

export default new Router({
  linkActiveClass: 'active',
  routes: [
    {
      path: '/',
      name: 'HelloWorld',
      component: HelloWorld
    },
    {
      path: '/ImgWall',
      name: 'ImgWall',
      component: ImgWall,
      meta: { requireAuth: true }
    },
    {
      path: '/HelloWorld/:branchName',
      name: 'HelloWorld',
      component: HelloWorld
    },
    {
      path: '/testPage/:id',
      name: 'testPage',
      component: testPage
    }
  ],
  matched: {
    checkAuth: function() {
      this.beforeEach(async(to, from, next) => {
        if (to.matched.some(record => record.meta.requiresAuth)) {
      
          let isLogin = false;
        
          // 兩種方式判斷登入與否:
          // 1. 前端確認登入沒 (但是有可能過期或直接被server side強制踢出，但反正資料一定會再跟server要，到時再驗證token囉)
          // 2. 最保險就是直接ajax透過後端檢查token囉
          let currentToken = localStorage.getItem(constantService.localStorage.tokenKey);
          if (currentToken) {
  
              // [client side] 判斷有token就算登入可轉頁 
              // 反正後續重要資料一定從server端，會在取資料時進行server端token驗證
              isLogin = true;
  
              // [server side] 直接透過ajax讓後端檢查token合法性
              // 在此須使用同步的方式，等待處理結果後才能繼續往下走
              let data = await authService.isTokenAlive();
              isLogin = data;
          }
  
          if (isLogin === false && from.path !== '/login') {
              next({
                  path: '/login',
                  query: { redirect: to.fullPath }
              })
          } else {
              next() //必須向下走
          }
      
        } else {
            next() // 必須向下走
        }
      });
    }
  }
});


