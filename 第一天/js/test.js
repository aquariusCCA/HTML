router.beforeEach((to, from, next) => {
  console.log('to: ', to)
  console.log('from: ', from)

  const store = useLoginStore()

  async function handleWhitelist(to, next) {
    console.log('不需要登入')

    // 清除 sessionStorage 裡面的所有數據
    sessionStorage.clear()

    try {
      const { data, status } = await apiUtils.post('/ecDgnotiA/userDetail/getCsrfToken')

      console.log('取得 csrfToken resp: ', data)

      if (status === 200) {
        store.getCsrfTokenSuccess(data)

        // 直接放行
        next()
      }
    } catch (error) {
      console.log(error)
      store.clearSession()
    }
  }

  async function fetchData(mode) {
    const [userDetailRes, csrfTokenRes] = await Promise.all([
      apiUtils.post('/ecDgnotiA/userDetail/getCurrentUser', '', mode),
      apiUtils.post('/ecDgnotiA/userDetail/getCsrfToken')
    ])

    const userData = userDetailRes?.data
    const csrfToken = csrfTokenRes?.data

    if (userData) {
      // 將後端回傳的使用者資訊存到 sessionStorage
      store.loginSuccess(userData)
    }

    if (csrfToken) {
      // 將 csrfToken 存到 sessionStorage
      store.getCsrfTokenSuccess(csrfToken)
    }

    return { name: 'notify' }
  }

  //#region  若非生產環境，則取使用者假資料
  if (process.env.NODE_ENV !== 'production') {
    console.log('非生產環境')

    //#region 若為不需登入的路由，則走這裡取得 csrfToken
    if (isWhitelist(to.fullPath)) {
      // 為了避免過深的縮排，可以將所有邏輯抽離到另外一個 function 中。
      handleWhitelist(to, next)
      return
    }
    //#endregion

    //#region 檢查 sessionStorage
    if (store.isLogin()) {
      console.log('已登入')

      // 如果已經登入且訪問 /notifyLogin，直接跳轉到適當的路由
      if (to.path === '/notifyLogin') {
        let notifyNo = localStorage.getItem('notifyNo')
        next({ name: notifyNo ? 'notifyDetail' : 'notify' })
      } else {
        // 否則直接放行
        next()
      }
    } else {
      console.log('沒登入喔~~~~')

      // 清除 sessionStorage 裡面的所有數據
      sessionStorage.clear()

      //#region 第一種情況 : 路徑是 /notifyLogin
      if (to.path === '/notifyLogin') {
        console.log('要去登入頁面')

        // 將 notifyNo 存到 localStorage
        const notifyNo = to.query.notifyNo || ''
        store.getNotifyNo(notifyNo)

        // 導入到登入頁面
        // isAuthenticated 是用來避免死循環用的
        next({
          name: 'LoginPage',
          query: {
            isAuthenticated: 'true'
          }
        })

        return
      }
      //#endregion

      //#region 第二種情況 : 其他 URL
      if (to.path) {
        console.log('其他 URL')

        fetchData('test')
          .then(result => {
            // 跳轉至照會查詢
            next(result)
          })
          .catch(error => {
            console.error(error)
          })

        return
      }
      //#endregion
    }
    //#endregion
    return
  }

  //#region 若為不需登入的路由，則走這裡取得 csrfToken
  if (isWhitelist(to.fullPath)) {
    // 為了避免過深的縮排，可以將所有邏輯抽離到另外一個 function 中。
    handleWhitelist(to, next)
    return
  }
  //#endregion

  //#region 檢查 sessionStorage
  if (store.isLogin()) {
    console.log('已登入')

    // 如果已經登入且訪問 /notifyLogin，直接跳轉到適當的路由
    if (to.path === '/notifyLogin') {
      let notifyNo = localStorage.getItem('notifyNo')
      next({ name: notifyNo ? 'notifyDetail' : 'notify' })
    } else {
      // 否則直接放行
      next()
    }
  } else {
    console.log('沒登入喔~~~~')

    // 清除 sessionStorage 裡面的所有數據
    sessionStorage.clear()

    //#region 第一種情況 : 路徑是 /notifyLogin
    if (to.path === '/notifyLogin') {
      console.log('要去登入頁面')

      // 將 notifyNo 存到 localStorage
      const notifyNo = to.query.notifyNo || ''
      store.getNotifyNo(notifyNo)

      // 導入到登入頁面
      // isAuthenticated 是用來避免死循環用的
      next({
        name: 'LoginPage',
        query: {
          isAuthenticated: 'true'
        }
      })

      return
    }
    //#endregion

    //#region 第二種情況 : 其他 URL
    if (to.path) {
      console.log('其他 URL')

      fetchData('')
        .then(result => {
          // 跳轉至照會查詢
          next(result)
        })
        .catch(error => {
          console.error(error)
        })

      return
    }
    //#endregion
  }
  //#endregion
})