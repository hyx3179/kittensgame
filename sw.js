(function () {
	const swRevision = 0
	// 这之前的行会在构建时删除 --------------------------
	const cacheStorage = 'cat-' + swRevision
	const HOSTNAME_BLACKLIST = [
		'hm.baidu.com',
		'p.qlogo.cn',
		'q2.qlogo.cn',
		'kittensgame.com',
		'www.google-analytics.com',
	]
	const host = location.host

	// 获取请求
	const getRequest = (url) => {
		url = new URL(url)
		let reqList = new Array()

		let cors = url.host !== host ? 'cors' : 'no-cors'
		let newReq = new Request(url.href, { mode: cors })
		reqList.push(newReq)

		return reqList
	}
	// 根据请求列表返回 fetchList
	const getFetch = (req) => {
		let fetchList = []
		for (let i in req) {
			fetchList.push(fetch(req[i], { cache: 'no-store' })
				.then(resp => {
					if (!resp.ok) {
						return new Promise(function (resolve) {
							setTimeout(resolve, 5000, resp);
						});
					}
					return resp
				}))
		}
		return fetchList
	}

	// 安装：加载 index 到 cache
	addEventListener('install', event => {
		event.waitUntil(caches.open(cacheStorage).then(cache => cache.add('/')));
		//skipWaiting()
	});

	// 激活：删除之前的 cache
	addEventListener('activate', event => {
		event.waitUntil(Promise.all([
			clients.claim(),
			caches.keys().then(cacheNames =>
				Promise.all(cacheNames.filter(cacheName => {
					cacheName = cacheName.split('-')
					return cacheName.length == 2 && cacheName[0] === 'cat' && cacheName[1] !== swRevision.toString()
				}).map(cacheName => caches.delete(cacheName))))]))
	})

	// 请求处理
	addEventListener('fetch', event => {
		const url = new URL(event.request.url)
		// 跳过无法正确处理 cors 的请求和不应缓存的请求
		if (HOSTNAME_BLACKLIST.indexOf(url.host) > -1) { return }

		// 跨域资源单独存放
		let cacheName = url.host !== host ? 'catStaticRes' : cacheStorage

		const req = getRequest(url.href)
		// 优先寻找 cache
		event.respondWith(caches.match(req[0])
			.then(cached => {
				if (cached && cached.ok) { return cached }
				// 不存在 cache 或响应不在成功范围，则请求网络
				// 删除以前可能存在的版本并提交 cache
				// race() 返回最快的成功响应
				return Promise.race(getFetch(req))
					.then(resp => {
						const respCopy = resp.clone()
						Promise.all([respCopy, caches.open(cacheName)])
							.then(([response, cache]) => {
								req[0].url.indexOf('fonts.g') == -1 && cache.delete(req[0], { ignoreSearch: true })
								cache.put(req[0], response)
							})
						return resp
					})
					.catch(a => { // 无网络返回已有缓存
						return caches.match(req[0], { ignoreSearch: true })
							.then(resp => { return resp })
					})
			}))
	})
})()