(function () {
	IX.ns("Hualala");
	var RouteAttrDefValue = {name : "", url : "", urlType : "ajax", type : "GET"};

	/**
	 * 根据接口字段序列，依次解析接口配置数据，生成配置对象
	 * @param  {Array} columns 接口配置字段表["name", "url", "urlType", "type"]
	 * @param  {Array} urlDef  接口配置信息
	 * @return {Object}         返回一条接口配置数据的对象
	 */
	function urlItemFn(columns, urlDef) {
		return IX.loop(columns, {}, function (acc, name, idx) {
			var _value = urlDef.length > idx ? urlDef[idx] : null;
			if (IX.isEmpty(_value)) {
				_value = RouteAttrDefValue[name];
			}
			acc[name] = _value;
			return acc;
		});
	}

	/**
	 * 接口存储
	 * @param {Array} columns 接口配置字段表
	 *        columns: ["name", "url", "urlType", "type"]
	 *        		["接口路由名称", "接口路径", "接口类型", "接口方法"]
	 * @return {Object} 接口存储数据块实例
	 *         {
	 *         		map : map接口配置数据
	 *         		getAll : 获取所有接口数据
	 *         		get : 根据接口名称获取一条接口配置
	 *         }
	 */
	function UrlStore(columns) {
		var _routes = new IX.IListManager();
		var _urlItemFn = function (urlDef) {
			var routeName = urlDef[0];
			if (!IX.isEmpty(routeName)) {
				_routes.register(routeName, urlItemFn(columns, urlDef));
			}
		};
		return {
			map : function (urlList) {
				IX.iterate(urlList, _urlItemFn);
			},
			getAll : _routes.getAll,
			get : _routes.get
		};
	}
	// ajax接口配置数据存储模块实例
	var ajaxStore = new UrlStore(["name", "url", "urlType", "type"]);

	Hualala.ajaxEngine = {
		mappingUrls : ajaxStore.map,
		getAll : ajaxStore.getAll,
		get : ajaxStore.get
	};

	/**
	 * 公共方法
	 */
	IX.ns("Hualala.Common");
	Hualala.Common.TopTip = {
		addTopTips : function ($scope, data) {
			if (!$scope.toptips) {
				$scope.toptips = [];
			}
			$scope.toptips.push({
                code : $XP(data, 'code', null),
                type : ($XP(data, 'code', null) == '000' ? 'success' : 'danger'),
                msg : $XP(data, 'msg', "")
            });
		},
		closeTopTip : function ($scope, index) {
			$scope.toptips.splice(index || 0, 1);
		},
		reset : function ($scope) {
			$scope.toptips = [];
		}
	};
})();

// Common Math Fn
(function ($) {
	// 提高数字的易读性，在数字每隔3位处增加逗号
	var prettyNumeric = function (num, separator) {
		if (isNaN(num)) return num.toString();
		var s = num.toString().split('.'),
			isNegative = num < 0 ? true : false,
			s1 = isNegative ? s[0].replace('-', '') : s[0],
			s2 = s[1] || '',
			l = s1.length,
			r = '';
		separator = !separator ? ',' : separator;
		if (l > 3) {
			var l1 = parseInt(l / 3),
				idx = l % 3;
			r = idx == 0 ? '' : s1.slice(0, idx) + separator;
			for (var i = 0; i < l1; i++) {
				r += s1.slice(idx + (i * 3), (idx + (i + 1) * 3)) + separator;
			}
			r = (isNegative ? '-' : '') + r.slice(0, -1) + (s2.length > 0 ? ('.' + s2) : '');
		} else {
			r = num;
		}
		return r;
	};
	// 如果字符串是易读的数字模式，使用这个函数可以还原成正常数字模式
	var restoreNumeric = function (str, separator) {
		separator = !separator ? ',' : separator;
		var s = str.split(separator).join('');
		return isNaN(s) ? str : Number(s);
	};
	// 美化价格显示，如果价格为整数，不现实小数点后的部分，如果价格为小数，显示小数点后2位
	var prettyPrice = function (price) {
		price = parseFloat(price).toFixed(2).toString();
		price = price.replace(/0+$/, '');
		var dot = price.indexOf('.');
		if (dot == price.length - 1) {
			price = price.substr(0, dot);
		}
		return price;
	};

	// 标准价格显示，自动补齐小数点后两位；标准价格显示：[整数部分].[角][分]
	var standardPrice = function (price) {
		if (isNaN(price)) return price;
		price = parseFloat(price).toFixed(2).toString();
		return price;
	};
	
	var add = function () {
		var baseNum = 0, args = $XA(arguments);
		var ret = 0;
		_.each(args, function (v) {
			var v1 = 0;
			try {
				v1 = v.toString().split('.')[1].length;
			} catch (e) {
				v1 = 0;
			}
			baseNum = v1 > baseNum ? v1 : baseNum;
		});
		// 使用字符串移动小数点方式规避javascript中由于精度差异导致的无法精确表示浮点数的bug
		// baseNum = Math.pow(10, baseNum);
		_.each(args, function (v) {
			// ret += v * baseNum;
			ret += Number(v.toString().movePoint(baseNum));
		});
		// return ret / baseNum;
		return Number(ret.toString().movePoint(-baseNum));
	};
	var sub = function () {
		var baseNum = 0, args = $XA(arguments),
		// 精度
			precision;
		var ret = 0;
		_.each(args, function (v) {
			var v1 = 0;
			try {
				v1 = v.toString().split(".")[1].length;
			} catch (e) {
				v1 = 0;
			}
			baseNum = v1 > baseNum ? v1 : baseNum;
		});
		precision = baseNum;
		// 使用字符串移动小数点方式规避javascript中由于精度差异导致的无法精确表示浮点数的bug
		// baseNum = Math.pow(10, baseNum);
		
		_.each(args, function (v, i) {
			// ret = i == 0 ? (v * baseNum) : (ret - v * baseNum);
			ret = i == 0 ?
				Number(v.toString().movePoint(baseNum)) : (ret - Number(v.toString().movePoint(baseNum)));
			// if (i == 0) {
			// 	// ret += v * baseNum;
			// 	ret += Number(v.toString().movePoint(baseNum));
			// } else {
			// 	// ret -= v * baseNum;
			// 	ret -= Number(v.toString().movePoint(baseNum));
			// }
		});
		// return (ret / baseNum).toFixed(precision);
		return Number(numberToFixed(Number(ret.toString().movePoint(-baseNum)), precision));
	};
	var multi = function () {
		var baseNum = 0, args = $XA(arguments);
		var ret = 1;
		_.each(args, function (v) {
			try {
				baseNum += v.toString().split('.')[1].length;
			} catch (e) {

			}
		});
		_.each(args, function (v) {
			ret *= Number(v.toString().replace(".", ""));
		});
		// 使用字符串移动小数点方式规避javascript中由于精度差异导致的无法精确表示浮点数的bug
		// return ret / Math.pow(10, baseNum);
		return Number(ret.toString().movePoint(-baseNum));
	};
	var div = function () {
		var baseNum = [], baseNum1 = [], args = $XA(arguments);
		var ret = 1, scale = 0;
		_.each(args, function (v) {
			try {
				baseNum.push(v.toString().split(".")[1].length);
			} catch (e) {
				baseNum.push(0);
			}
		});
		with (Math) {
			_.each(args, function (v, i) {
				var v1 = Number(v.toString().replace(".", ""));
				ret = i == 0 ? v1 : (ret / v1);
			});
			_.each(baseNum, function (v, i) {
				scale = i == 0 ? v : (scale - v);
			});
			// 使用字符串移动小数点方式规避javascript中由于精度差异导致的无法精确表示浮点数的bug
			// return ret * pow(10, scale);
			return Number(ret.toString().movePoint(-scale));
		}
	};
	var numberToFixed = function (num, scale) {
		var s, s1, s2, start;
		scale = scale || 0;
		s1 = num + "";
		start = s1.indexOf('.');
		s = s1.movePoint(scale);
		if (start >= 0) {
			s2 = Number(s1.substr(start + scale + 1, 1));
			if (s2 >= 5 && num >= 0 || s2 < 5 && num < 0) {
				s = Math.ceil(s);
			} else {
				s = Math.floor(s);
			}
		}
		return Number(s.toString().movePoint(-scale));
	};
	IX.ns("Hualala.Common");
	Hualala.Common.Math = {
		prettyNumeric : prettyNumeric,
		restoreNumeric : restoreNumeric,
		prettyPrice : prettyPrice,
		standardPrice : standardPrice,
		add : add,
		sub : sub,
		multi : multi,
		div : div,
		numberToFixed : numberToFixed
	};

	


})(jQuery);

(function ($) {
	// 平滑滚动到tarObj元素顶部
	function smoothScroll (tarObj, srcObj, during, fn) {
		var $srcObj = !srcObj || srcObj.length == 0 ? $(document.body) : $(srcObj);
		var srcTop = $srcObj.offset().top;
		$srcObj.animate({scrollTop : ($(tarObj).offset().top - srcTop)}, during, 'swing', fn);
	};
	// 平滑滚动到tarObj元素中部
	function smoothScrollMiddle (tarObj, srcObj, during, fn) {
		var $tarObj = $(tarObj),
			$srcObj = !srcObj || srcObj.length == 0 ? $(document.body) : $(srcObj),
			t = $tarObj.offset().top,
			oh = $tarObj.height(),
			wh = $srcObj.height();
		$srcObj.animate({scrollTop : t + oh/2 - wh / 2}, during, 'swing', fn);
	};
	Hualala.Common.smoothScroll = smoothScroll;
	Hualala.Common.smoothScrollMiddle = smoothScrollMiddle;

	/**
	 * 格式化Ajax提交数据，所有字段的值都必须转换成字符类型
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	 */
	var formatPostData = function (data) {
		if (_.isArray(data)) {
			return _.map(data, function (v, k) {
				return formatPostData(v);
			});
		} else  if (_.isObject(data)) {
			return _.mapObject(data, function (v, k) {
				return formatPostData(v);
			});
		} else if (_.isNumber(data)) {
			return data.toString();
		} else {
			return data;
		}
	};
	Hualala.Common.formatPostData = formatPostData;

	Hualala.Date = IX.Util.Date;

	var formatTimeInterval = function (secTick) {
		var secs = parseInt(secTick),
			start = parseInt( ( (new Date() ).getTime() - secs  * 1000) / 1000),
			o = Hualala.Date(start),
			timeInterval = o.toTimer().split(':'),
			h = timeInterval[0],
			m = timeInterval[1],
			s = timeInterval[2],
			d = Math.floor(parseInt(h) / 24),
			h = parseInt(h) % 24;
		return (d < 10 ? ('0' + d) : d) + '天'
			+ (h < 10 ? ('0' + h) : h) + '小时'
			+ m + '分钟' + s + '秒';
	};
	Hualala.Common.formatTimeInterval = formatTimeInterval;

	

	/**
	 * 格式化Ajax返回给前端的日期时间数据
	 * 后端返回前端时间日期数据格式为：yyyyMMddHHmmss，
	 * 我们要将这种奇怪的日期字符串格式转化为统一的标准的日期字符串格式yyyy/MM/dd HH:mm:ss
	 * @param  {String} v 	奇怪的日期时间数据字符串：yyyyMMddHHmmss
	 * @return {String}		统一的标准时间日期数据字符串 ： yyyy/MM/dd HH:mm:ss
	 */
	Hualala.Common.formatDateTimeValue = function (v) {
		if (IX.isEmpty(v) || !IX.isString(v)) return '';
		var fullLen = 14, l = v.length, r = '00000000000000';
		if (l < fullLen) {
			v += r.slice(0, (fullLen - l));
		}
		return v.replace(/([\d]{4})([\d]{2})([\d]{2})([\d]{2})([\d]{2})([\d]{2})/g, '$1/$2/$3 $4:$5:$6');
	};

	/**
	 * 将打印文字格式化为html
	 * @param  {[type]} prntTxt [description]
	 * @return {[type]}         [description]
	 */
	Hualala.Common.formatPrintTxt2Html = function (prntTxt) {
		var txt = decodeURIComponent(prntTxt || '');
		var matchFontStyle = function (line) {
			var reg = /^\<(HLLFONT)\-(\d)\-(\d)\-(\d)\>/,
				m, fontSize, fontBold, fontBG, fontStyle, txt;
			if (_.isEmpty(line)) return '';
			m = line.match(reg);
			if (m && _.isArray(m) && m.length == 5) {
				fontSize = 'font-' + m[2] + 'x';
				fontBold = m[3] == '0' ? '' : 'bold';
				fontBG = m[4] == '0' ? '' : 'highlight';
				fontStyle = [fontSize, fontBold, fontBG].join(' ');
			} else {
				fontStyle = '';
			}
			txt = line.replace(reg, '').replace(/\s/g, '&nbsp;');
			return {
				txt : txt,
				fontStyle : fontStyle
			};
		};
		if (_.isEmpty(txt)) return '';
		var arr = txt.split('\n');
		var htm = _.map(arr, function (line) {
			var t = matchFontStyle(line),
				s = '';
			s = '<p class="' + _.result(t, 'fontStyle') + '"><span>' + _.result(t, 'txt', '') + '</span></p>';
			return s;
		});
		return htm.join('');
	};

	Hualala.Common.isTagName = function (evt, whitelists) {
		evt = $.event.fix(evt);
		whitelists = _.isEmpty(whitelists) ? ["A", "INPUT", "TEXTAREA"] : whitelists;
		var isTag = true;
		var target = evt.target || evt.srcElement;
		if (whitelists && $.inArray(target.tagName.toString().toUpperCase(), whitelists) == -1) {
			isTag = false;
		}
		return isTag;
	};
	// 生成数组的排列组合
	var permutate = function (arr, permutatedArr) {
		if (!permutatedArr) {
			permutatedArr = [];
		}
		if (arr.length > 1) {
			// 弹出第一个数据
			var curEl = arr.shift();
			// 排列剩余的数组
			permutate(arr, permutatedArr);
			// 返回剩余数组的排列长度
			var permutatedArrLen = permutatedArr.length;
			// 第一个数与其他剩余数组所有数组组合
			for (var j = 0; j < permutatedArrLen; j++) {
				// 弹出补齐的组
				var p = permutatedArr.shift();
				// 把当前元素放到排列好的数组的所有位置
				for (var i = 0; i <= p.length; i++) {
					// 复制排列好的数组
					var r = p.slice(0);
					// 插入数据到数组的位置
					r.splice(i, 0, curEl);
					// 保存
					permutatedArr.push(r);
				}
			}
		} else {
			// 退出的条件
			permutatedArr.push([arr[0]]);
		}
		return permutatedArr;
	};
	Hualala.Common.Permutate = permutate;
	// 获得数组的组合
	var combination = function (arr, num) {
		var ret = [];
		(function fn (t, a, n) {
			if (n == 0) return ret.push(t);
			for (var i = 0, l = a.length; i<=l-n; i++) {
				fn(t.concat(a[i]), a.slice(i + 1), n - 1);
			}
		})([], arr, num);
		return ret;
	};
	Hualala.Common.Combination = combination;
})(jQuery);

(function () {
	// 与硬件设备通信的方法封装
	IX.ns("Hualala.DevCom");
	Hualala.DevCom.exeCmd = function (cmd, msg) {
		var cmdLib = Hualala.TypeDef.DeviceComCmds;
		var cmdSet = _.result(cmdLib, cmd);
		var tag = _.result(cmdSet, 'tagName'),
			isEmptyTag = _.result(cmdSet, 'isEmptyTag');
		// var $inputEl = $('<input type="text" id="site_clipboard"/>').appendTo('body');
		var $inputEl = $('<textarea id="site_clipboard"/>').appendTo('body');
		var cnt = '<' + tag + '>' + (!isEmptyTag ? msg : '') + '</' + tag + '>';
		$inputEl.bind('click', function (e) {
			$inputEl.val(cnt);
			$inputEl.select();
			document.execCommand('cut');
			IX.Debug.info("Execute Device Communication Command: ");
			IX.Debug.info(cnt);
			$inputEl.remove();
	
		});
		$inputEl.trigger('click');
		// $inputEl.val(cnt);
		// var range = document.createRange();
		// range.selectNode($inputEl[0]);
		// window.getSelection().addRange(range);
		// try {
		// 	var successful = document.execCommand('cut');
		// 	var ifo = successful ? 'successful' : 'unsuccessful';
		// 	IX.Debug.info("command " + ifo);
		// 	IX.Debug.info("Execute Device Communication Command: ");
		// 	IX.Debug.info(cnt);
		// } catch(err) {
		// 	IX.Debug.info("Oops, unable to cut");
		// }
		// window.getSelection().removeAllRanges();

		// var inputEl = document.createElement("input");
		// var cnt = '<' + tag + '>' + (!isEmptyTag ? msg : '') + '</' + tag + '>';
		// inputEl.type = 'text';
		// inputEl.value = cnt;
		// inputEl.select();
		// document.execCommand('cut');
		// $(inputEl).remove();
		
	};
})();
(function () {
	IX.ns("Hualala.ModalCom");
	// 弹窗
	Hualala.ModalCom.openModal = function ($rootScope, $modal, cfg) {
		var cfg = _.extend({}, cfg, {
			windowTemplateUrl : 'js/template/modal.html'
		});
		var modalInstance = $modal.open(cfg);
		$rootScope.ModalLst.push(modalInstance);
		return modalInstance;
	};
})();
(function ($) {
	// 屏蔽选中文字
	$.fn.ctrlCmd = function (key) {
		var allowDefault = true;
		if (!$.isArray(key)) {
			key = [key];
		}
		return this.keydown(function (e) {
			_.each(key, function (_k) {
				if (e.keyCode === _k.toUpperCase().charCodeAt(0) && e.metaKey) {
					allowDefault = false;
				}
			});
			return allowDefault;
		});
	};
	$.fn.disableSelection = function () {
		this.ctrlCmd('');
		return this.attr('unselectable', 'on')
			.css({
				'-moz-user-select' : '-moz-none',
				'-moz-user-select' : 'none',
				'-o-user-select' : 'none',
				'-khtml-user-select' : 'none',
				'-webkit-user-select' : 'none',
				'-ms-user-select' : 'none',
				'user-select' : 'none'
			})
			.bind('selectstart', false);
	};
	// 屏蔽文字头尾的空格和\t
	 $.fn.trimTextInput = function () {
	 	return this.bind('keyup', function (e) {
	 		var $tar = $(e.target),
	 			keyCode = e.keyCode || e.which;
	 		if ($tar.is('input, textarea')) {
	 			$tar.val($.trim($tar.val()));
	 		}
	 	});
	 };
})(jQuery);
(function () {
	// 弹出子窗体
	IX.ns("Hualala.SecondScreen");
	var H = Hualala,
		loc = document.location,
		origin = loc.origin,
		pathname = loc.pathname,
		link = origin + pathname + '#/puppet',
		subWinName = 'secondScreen',
		subWin = null;
	// 获取子窗口对象
	var getSubWin = function () {
		return subWin;
	};
	// 打开子窗体
	var open = function () {
		subWin = window.open(link, subWinName, 'top=0,left=0,fullscreen=1');
		return subWin;
	};
	// 关闭子窗体
	var close = function () {
		subWin.close();
		subWin = null;
	};
	// 订阅向子窗体推送消息
	var postMsgService = function (topic, data) {
		IX.Debug.info("Topic:" + topic);
		IX.Debug.info("postData:" + data);
		var postMsg = {
			// subWin : subWin,
			topic : topic,
			post : data
		};
		subWin && subWin.postMessage(JSON.stringify(postMsg), link);
	};

	var subcribePostMsg = function (topic) {
		return H.PubSub.subcribe(topic, postMsgService);
	};

	var publishPostMsg = function (topic, args) {
		return H.PubSub.publish(topic, args);
	};

	H.SecondScreen = {
		open : open,
		close : close,
		getSubWin : getSubWin,
		subcribePostMsg : subcribePostMsg,
		publishPostMsg : publishPostMsg
	};
})();
(function () {
	// 服务器消息推送及订阅发布封装
	IX.ns("Hualala.PushMsg");
	var H = Hualala,
		HCMath = Hualala.Common.Math
		loc = document.location,
		// 当前页面端口
		port = parseInt(loc.port),
		// webSocket实例对象
		socket = null,
		// websocket port
		webSocketServerPort = HCMath.add(port, 1),
		// websocket domain
		// webSocketDomainName = Hualala.Global.AJAX_DOMAIN.split(':')[1],
		webSocketDomainName = '',
		// webSocket超时重连时间
		reconnectTimeout = 3 * 60 * 1000,
		// 重连计数器
		reconnectCount = 0;
		// 计时器
		reconnectTimer = null,
		pushMsgTypes = Hualala.TypeDef.PushMsgTypes,
		closeConnect = true;

	// if (window.HualalaWorkMode == 'dev') {
	// 	webSocketDomainName = 'http://10.10.2.166'.split(':')[1];
	// 	port = 8080;
	// 	webSocketServerPort = HCMath.add(port, 1);
	// }
	// 初始化socket,建立连接
	var initWebSocketConnect = function () {
		if (window.HualalaWorkMode == 'dev') {
			webSocketDomainName = 'http://10.10.2.166'.split(':')[1];
			port = 8080;
		} else {
			webSocketDomainName = document.location.origin.split(':')[1];
		}
		webSocketServerPort = HCMath.add(port, 1);
		var wsUri = 'ws:' + webSocketDomainName + ':' + webSocketServerPort;
		socket = new WebSocket(wsUri);
		socket.onopen = function (evt) {
			IX.Debug.info("WebSocket Open");
			onOpen(evt);
		};
		socket.onclose = function (evt) {
			IX.Debug.info("WebSocket Close");
			onClose(evt);
		};
		socket.onmessage = function (evt) {
			IX.Debug.info("WebSocket Push Message");
			onMessage(evt);
		};
		reconnectCount++;
		return socket;
	};
	// 重连定时器
	var initReconnectTimer = function () {
		if (!reconnectTimer) {
			reconnectTimer = setTimeout(function () {
				if (closeConnect) {
					clearTimeout(reconnectTimer);
					reconnectTimer = null;
					socket && socket.close();
				}
			}, reconnectTimeout);
			closeConnect = true;
		} else {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
			initReconnectTimer();
		}
	};

	// socket打开
	var onOpen = function (evt) {
		initReconnectTimer();
	};
	// socket关闭
	var onClose = function (evt) {
		if (reconnectCount > 10) {
			clearTimeout(reconnectTimer);
			throw("WebSocket 重连失败！");
			return;
		}
		initWebSocketConnect();
	};
	// socket推送消息
	var onMessage = function (evt) {
		var oriData = JSON.parse(evt.data);
		var msgType = _.result(oriData, 'msgType'),
			msgData = _.result(oriData, 'msgData'),
			msgEvent = _.result(oriData, 'msgEvent');
		var pushMsgCfg = pushMsgTypes[msgType],
			subName = _.result(pushMsgCfg, 'subName');
		publishMsg(subName, oriData);
		initReconnectTimer();
	};

	// 发布消息
	var publishMsg = function (topic, args) {
		return Hualala.PubSub.publish(topic, args);
	};
	// 订阅消息
	var subcribeMsg = function (topic, fn) {
		return Hualala.PubSub.subcribe(topic, fn);
	};
	Hualala.PushMsg = {
		hasSocket : function () {
			return !!socket;
		},
		initWebSocketConnect : initWebSocketConnect,
		subcribeMsg : subcribeMsg,
		publishMsg : publishMsg
	};
})();











































