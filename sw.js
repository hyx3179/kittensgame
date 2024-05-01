(function () {
  const swRevision = 0;
  // 这之前的行会在构建时删除 --------------------------
  const HOSTNAME_BLACKLIST = ["kittensgame.com"];
  let ignoreSearch = false;

  addEventListener("install", () => {
    skipWaiting();
  });
  addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
  });
  addEventListener("message", (event) => {
    ignoreSearch = event.data === "enable";
  });
  // 请求处理
  addEventListener("fetch", (event) => {
    let url = new URL(event.request.url);
    // 跳过无法正确处理 cors 的请求和不应缓存的请求
    if (HOSTNAME_BLACKLIST.indexOf(url.host) !== -1) {
      return;
    }

    const cacheName = url.host !== location.host ? "catExtRes" : "catRes";
    // index 添加查询参数
    if (url.pathname === "/") {
      url.search = "?rev_=" + swRevision;
    }
    // 跨域资源单独存放
    const req = new Request(url.href, {
      cache: "no-store",
      mode: url.host !== location.host ? "cors" : "no-cors",
    });
    // 优先寻找 cache
    event.respondWith(
      caches.match(req, { ignoreSearch: ignoreSearch }).then((cached) => {
        if (cached && cached.ok) {
          return cached;
        }
        return (
          // 不存在 cache 或响应不在成功范围，则请求网络
          Promise.all([fetch(req), caches.open(cacheName)])
            .then(([response, cache]) => {
              if (!response.ok) {
                return Promise.reject();
              }
              if (url.host.indexOf("fonts.g") === -1) {
                // 删除以前可能存在的版本并提交 cache
                cache.delete(req, { ignoreSearch: true });
              }
              return cache.put(req, response);
            })
            .then(() => caches.match(req))
            // 无网络返回已有缓存
            .catch(() => caches.match(req, { ignoreSearch: true }))
        );
      })
    );
  });
})();
