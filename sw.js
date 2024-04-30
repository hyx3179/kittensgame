(function () {
  const HOSTNAME_BLACKLIST = ["kittensgame.com"];

  const getFetch = (cached, url) => {
    if (cached && cached.ok) {
      return cached;
    }
    // 不存在 cache 或响应不在成功范围，则请求网络
    // 删除以前可能存在的版本并提交 cache
    // 跨域资源单独存放
    const req = new Request(url.href, {
      cache: "no-store",
      mode: url.host !== location.host ? "cors" : "no-cors",
    });
    return Promise.all([
      fetch(req),
      caches.open(url.host !== location.host ? "catExtRes" : "catRes"),
    ])
      .then(([response, cache]) => {
        if (!response.ok) {
          return Promise.reject();
        }
        if (url.host.indexOf("fonts.g") === -1) {
          cache.delete(req, { ignoreSearch: true });
        }
        return cache.put(req, response);
      })
      .then(() => caches.match(req))
      .catch(() =>
        // 无网络返回已有缓存
        caches.match(req, { ignoreSearch: true })
      );
  };

  // 请求处理
  addEventListener("fetch", (event) => {
    let url = new URL(event.request.url);
    // 跳过无法正确处理 cors 的请求和不应缓存的请求
    if (HOSTNAME_BLACKLIST.indexOf(url.host) !== -1) {
      return;
    }

    // 优先寻找 cache
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (url.pathname === "/") {
          return fetch("build.version.json?=" + Date.now())
            .then((response) => response.json())
            .then((json) => {
              url.search = "?rev_=" + json.swRevision;
              const reqroot = new Request(url);
              return caches.match(reqroot);
            })
            .then((cached) => getFetch(cached, url))
            .catch(() =>
              // 无网络返回已有缓存
              caches.match(event.request, { ignoreSearch: true })
            );
        } else {
          return getFetch(cached, url);
        }
      })
    );
  });
})();
