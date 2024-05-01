(function () {
  const HOSTNAME_BLACKLIST = ["kittensgame.com"];
  let offline = false;

  function cacheMatchIgnoreSearch(req) {
    return caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached && cached.ok) {
        return cached;
      }
      return new Response(null, {
        status: 500,
        statusText: "Internal Server Error",
      });
    });
  }

  function getResponse(url) {
    const islocation = url.host === location.host;
    const req = new Request(url, {
      cache: "no-store",
      mode: islocation ? "no-cors" : "cors",
    });
    // 优先寻找 cache
    return caches.match(req).then((cached) => {
      if (cached && cached.ok) {
        return cached;
      }
      if (offline) {
        return cacheMatchIgnoreSearch(req);
      } else {
        return (
          // 不存在 cache 或响应不在成功范围，则请求网络
          Promise.all([
            fetch(req),
            caches.open(islocation ? "catRes" : "catExtRes"), // 跨域资源单独存放
          ])
            .then(([response, cache]) => {
              if (!response.ok) {
                throw new Error(null);
              }
              if (url.host.indexOf("fonts.g") === -1) {
                // 删除以前可能存在的版本并提交 cache
                cache.delete(req, { ignoreSearch: true });
              }
              return cache.put(req, response).then(() => caches.match(req));
            })
            // 无网络返回已有缓存
            .catch(() => cacheMatchIgnoreSearch(req))
        );
      }
    });
  }

  // 请求处理
  addEventListener("install", () => {
    skipWaiting();
  });
  addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
  });
  addEventListener("message", (event) => {
    offline = event.data === "enable";
  });
  addEventListener("fetch", (event) => {
    let url = new URL(event.request.url);
    // 跳过无法正确处理 cors 的请求和不应缓存的请求
    if (HOSTNAME_BLACKLIST.indexOf(url.host) !== -1) {
      return;
    }

    // index 添加查询参数
    if (url.pathname === "/" && !offline) {
      event.respondWith(
        fetch("build.version.json?=" + Date.now())
          .then((response) => {
            if (!response.ok) {
              throw new Error(null);
            }
            return response;
          })
          .catch(() =>
            caches.match("build.version.json", { ignoreSearch: true })
          )
          .then((response) => response.json())
          .then((json) => {
            url.search = "?rev_=" + json.buildRevision;
            return getResponse(url);
          })
      );
    } else {
      event.respondWith(getResponse(url));
    }
  });
})();
