(function (win) {
	IX.ns("Hualala");
	var topics = {},
		subUid = -1,
		pubsub = {};
	/**
	 * 发布topic， 将args传递给订阅者
	 * @param  {String} topic 发布主题
	 * @param  {[type]} args  传给订阅者参数
	 * @return {Boolean}       是否发布成功
	 */
	pubsub.publish = function (topic, args) {
		if (!topics.hasOwnProperty(topic)) {
			return false;
		}
		var throwException = function (e) {
			return function () {
				throw e;
			};
		};
		setTimeout(function () {
			var subcribers = topics[topic],
				len = subcribers ? subcribers.length : 0;
			for (var i = 0; i < len; i++) {
				try {
					subcribers[i].func(topic, args);
				} catch(e) {
					setTimeout(throwException(e), 0);
				}
			}
		}, 0);
		return true;
	};

	/**
	 * 订阅器
	 * @param  {String} topic 订阅的主题名称
	 * @param  {Function} func  执行函数
	 * @return {Number}       返回一个订阅的序号标记，为取消订阅服务
	 */
	pubsub.subcribe = function (topic, func) {
		if (!topics.hasOwnProperty(topic)) {
			topics[topic] = [];
		}
		var token = (++subUid).toString();
		topics[topic].push({
			token : token,
			func : func
		});
	};

	/**
	 * 取消订阅
	 * @param  {String} token 订阅序列标记
	 * @return {String|Boolean}       取消成功返回序列标记否则返回false
	 */
	pubsub.unsubscribe = function (token) {
		for (var m in topics) {
			if (topics.hasOwnProperty(m)) {
				for (var i = 0, l = topics[m].length; i < l; i++) {
					if (topics[m][i].token == token) {
						topics[m].splice(i, 1);
						return token;
					}
				}
			}
		}
		return false;
	};
	Hualala.PubSub = pubsub;
})(window);