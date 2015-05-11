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
})(jQuery);