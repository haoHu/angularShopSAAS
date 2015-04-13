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