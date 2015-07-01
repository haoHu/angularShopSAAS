define(['app'], function (app) {
	/**
	 * 查询操作日志数据服务
	 * @param  {[type]} $rootScope        [description]
	 * @param  {[type]} $location         [description]
	 * @param  {[type]} $filter           [description]
	 * @param  {[type]} storage           [description]
	 * @param  {[type]} CommonCallServer) {		}	]      [description]
	 * @return {[type]}                   [description]
	 */
	app.service('ShopLogService',[
		'$rootScope', '$location', '$filter', 'storage', 'CommonCallServer',
		function ($rootScope, $location, $filter, storage, CommonCallServer) {
			var self = this;
			var logHT = new IX.IListManager(),
				totalSize = 0,
				pageNo = 1,
				pageSize = 15;
			// 初始化列表数据
			var initListData = function (records) {
				logHT.clear();
				_.each(records, function (item) {
					var itemID = _.result(item, 'itemID');
					logHT.register(itemID, item);
				});
			};

			var updatePageParams = function (_pageNo, _pageSize, _totalSize) {
				pageNo = _pageNo;
				pageSize = _pageSize;
				totalSize = _totalSize;
			};
			this.loadLogLst = function (params) {
				var callServer = CommonCallServer.queryLog(params);
				callServer.success(function (data) {
					var _d = _.result(data, 'data'),
						records = _.result(_d, 'records'),
						recordCount = _.result(_d, 'recordCount', 0);
					updatePageParams(_.result(params, 'pageNo', 1), _.result(params, 'pageSize', 15), recordCount);
					initListData(records);
				});
				return callServer;
			};
			// 获取当前页搜索log结果
			this.getLogLst = function () {
				return logHT.getAll();
			};
			// 获取分页信息
			this.getPaginationParams = function () {
				return {
					pageNo : pageNo,
					pageSize : pageSize,
					totalSize : totalSize
				};
			};
		}
	]);

	/**
	 * 查询当前营业数据服务
	 * @param  {[type]} $rootScope        [description]
	 * @param  {[type]} $location         [description]
	 * @param  {[type]} $filter           [description]
	 * @param  {[type]} storage           [description]
	 * @param  {[type]} CommonCallServer) {		}	]      [description]
	 * @return {[type]}                   [description]
	 */
	app.service('ShopCurBizService',[
		'$rootScope', '$location', '$filter', 'storage', 'CommonCallServer',
		function ($rootScope, $location, $filter, storage, CommonCallServer) {
			var self = this;
			var dataLst = [];
			this.loadCurrBizDataLst = function (params) {
				var callServer = CommonCallServer.queryCurBizData(params);
				callServer.success(function (data) {
					var _d = _.result(data, 'data'),
						records = _.result(_d, 'records');
					dataLst = records;
				});
				return callServer;
			};
			this.getDataLst = function () {
				return dataLst;
			};
		}
	]);

	/**
	 * 查询综合营业数据服务
	 * @param  {[type]} $rootScope        [description]
	 * @param  {[type]} $location         [description]
	 * @param  {[type]} $filter           [description]
	 * @param  {[type]} storage           [description]
	 * @param  {[type]} CommonCallServer) {		}	]      [description]
	 * @return {[type]}                   [description]
	 */
	app.service('ShopCompositeBizService',[
		'$rootScope', '$location', '$filter', 'storage', 'CommonCallServer',
		function ($rootScope, $location, $filter, storage, CommonCallServer) {
			var self = this;
			var data;
			this.loadCompBizDataLst = function (params) {
				var callServer = CommonCallServer.queryCompositeBizData(params);
				callServer.success(function (data) {
					var _d = _.result(data, 'data');
					data = _d;
				});
				return callServer;
			};
			this.parseReceiptInfo = function () {
				var reportPrnTxt = _.result(data, 'reportPrnTxt', '');
				var arr = reportPrnTxt.split('\n');
				var htm = _.map(arr, function (line) {
					var reg = /^\<HLLFONT\-\d\-\d\-\d\>/g;
					var fontStyle = line.match(reg)[0],
						txt = line.replace(reg, '').replace(/\s/g, '&nbsp;');
					return '<p class="' + fontStyle + '">' + txt + '</p>';
				});
				return htm.join('');
			};
		}
	]);

	/**
	 * 报表查询字典服务
	 * @param  {[type]} $rootScope        [description]
	 * @param  {[type]} $location         [description]
	 * @param  {[type]} $filter           [description]
	 * @param  {[type]} storage           [description]
	 * @param  {[type]} CommonCallServer) {		}	]      [description]
	 * @return {[type]}                   [description]
	 */
	app.service('ReportDictionaryService', [
		'$rootScope', '$location', '$filter', 'storage', 'CommonCallServer',
		function ($rootScope, $location, $filter, storage, CommonCallServer) {
			var self = this;
			var dictHT = new IX.IListManager(),
				dataLst = {};
			var initListData = function (data) {
				// k : timeNameLst,checkoutByLst,areaLst
				_.each(data, function (el, k) {
					dictHT.register(k, el);
				});
			};
			var getDictDataByType = function (type) {
				var lst = dictHT.get(type);
				return _.map(lst, function (el) {
					return _.extend(el, {
						label : _.result(el, 'Key'),
						value : _.result(el, 'Value')
					});
				});
			};
			// 加载字典表
			this.loadReportDictionary = function () {
				var c = CommonCallServer.getReportDictionary();
				c.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						dataLst = _.result(data, 'data');
						initListData(dataLst);
					}
				});
				return c;
			};
			// 获取时间段
			this.getTimeNames = function () {
				return getDictDataByType('timeNameLst');
			};

			this.getCheckouts = function () {
				return getDictDataByType('checkoutByLst');
			};

			this.getAreas = function () {
				return getDictDataByType('areaLst');
			};


		}
	]);
});