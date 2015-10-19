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
			var compBizData;
			this.loadCompBizDataLst = function (params) {
				var callServer = CommonCallServer.queryCompositeBizData(params);
				callServer.success(function (data) {
					var _d = _.result(data, 'data');
					compBizData = _d;
				});
				return callServer;
			};
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
			this.parseReceiptInfo = function () {
				var reportPrnTxt = decodeURIComponent(_.result(compBizData, 'reportPrnTxt', ''));
				// for test
				// reportPrnTxt = '<HLLFONT-1-2-0>          哗啦啦体验店铺(测试)\n               消费明细单\n----------------------------------------\n单号:0006  开单时间:17:29\n台牌:16  人数:6  开单:1001|丁木\n----------------------------------------\n项目名称                   数量  金额(元)\n----------------------------------------\n蜗居自制豆腐 / 份           1      28.00\n蜗居秘制风味鱼 / 份         1      58.00\n一品山珍宝 / 份             1      58.00\n小飞生焖鲈鱼 / 份           1      78.00\n油炸花生米 / 份             1       8.00\n凉拌文山小木耳 / 份         1      13.00\n下饭菜 / 份                 2      18.00\n萝卜皮 / 份                 1       8.00\n----------------------------------------\n消费项目合计:                     269.00\n----------------------------------------\n           Key:2015062670006\n      打印时间:2015-06-26 17:31:31\n<HLLFONT-1-2-2>    系统由哗啦啦提供 Tel:4006527557    \n\n\n\n<HLLFONT-1-2-0>          哗啦啦体验店铺(测试)\n               消费明细单\n----------------------------------------\n单号:0006  开单时间:17:29\n台牌:16  人数:6  开单:1001|丁木\n----------------------------------------\n项目名称                   数量  金额(元)\n----------------------------------------\n蜗居自制豆腐 / 份           1      28.00\n蜗居秘制风味鱼 / 份         1      58.00\n一品山珍宝 / 份             1      58.00\n小飞生焖鲈鱼 / 份           1      78.00\n油炸花生米 / 份             1       8.00\n凉拌文山小木耳 / 份         1      13.00\n下饭菜 / 份                 2      18.00\n萝卜皮 / 份                 1       8.00\n----------------------------------------\n消费项目合计:                     269.00\n----------------------------------------\n           Key:2015062670006\n      打印时间:2015-06-26 17:31:31\n<HLLFONT-1-2-2>    系统由哗啦啦提供 Tel:4006527557    \n<HLLFONT-1-2-0>          哗啦啦体验店铺(测试)\n             预结账单(外卖)\n----------------------------------------\n单号:0006  开单时间:17:29\n台牌:16  人数:6  开单:1001|丁木\n----------------------------------------\n项目名称                   数量  金额(元)\n----------------------------------------\n蜗居自制豆腐 / 份           1      28.00\n蜗居秘制风味鱼 / 份         1      58.00\n一品山珍宝 / 份             1      58.00\n小飞生焖鲈鱼 / 份           1      78.00\n油炸花生米 / 份             1       8.00\n凉拌文山小木耳 / 份         1      13.00\n下饭菜 / 份                 2      18.00\n萝卜皮 / 份                 1       8.00\n----------------------------------------\n消费项目合计:                     269.00\n----------------------------------------\n账单减免:                           9.00\n----------------------------------------\n※应收:                           260.00\n----------------------------------------\n           Key:2015062670006\n      打印时间:2015-06-26 17:31:31\n<HLLFONT-1-2-2>    系统由哗啦啦提供 Tel:4006527557    \n\n\n\n<HLLFONT-1-2-0>          哗啦啦体验店铺(测试)\n               消费明细单\n----------------------------------------\n单号:0006  开单时间:17:29\n台牌:16  人数:6  开单:1001|丁木\n----------------------------------------\n项目名称                   数量  金额(元)\n----------------------------------------\n蜗居自制豆腐 / 份           1      28.00\n蜗居秘制风味鱼 / 份         1      58.00\n一品山珍宝 / 份             1      58.00\n小飞生焖鲈鱼 / 份           1      78.00\n油炸花生米 / 份             1       8.00\n凉拌文山小木耳 / 份         1      13.00\n下饭菜 / 份                 2      18.00\n萝卜皮 / 份                 1       8.00\n----------------------------------------\n消费项目合计:                     269.00\n----------------------------------------\n           Key:2015062670006\n      打印时间:2015-06-26 17:31:31\n<HLLFONT-1-2-2>    系统由哗啦啦提供 Tel:4006527557    \n<HLLFONT-1-2-0>          哗啦啦体验店铺(测试)\n             预结账单(外卖)\n----------------------------------------\n单号:0006  开单时间:17:29\n台牌:16  人数:6  开单:1001|丁木\n----------------------------------------\n项目名称                   数量  金额(元)\n----------------------------------------\n蜗居自制豆腐 / 份           1      28.00\n蜗居秘制风味鱼 / 份         1      58.00\n一品山珍宝 / 份             1      58.00\n小飞生焖鲈鱼 / 份           1      78.00\n油炸花生米 / 份             1       8.00\n凉拌文山小木耳 / 份         1      13.00\n下饭菜 / 份                 2      18.00\n萝卜皮 / 份                 1       8.00\n----------------------------------------\n消费项目合计:                     269.00\n----------------------------------------\n账单减免:                           9.00\n----------------------------------------\n※应收:                           260.00\n----------------------------------------\n           Key:2015062670006\n      打印时间:2015-06-26 17:31:31\n<HLLFONT-1-2-2>    系统由哗啦啦提供 Tel:4006527557    \n<HLLFONT-1-2-0>          哗啦啦体验店铺(测试)\n             结账清单(外卖)\n----------------------------------------\n单号:0006  收银:1001|丁木 YJZ:0 FJZ:0\n来源:店内  时间:2015-06-26 17:30:33\n台牌:16  人数:6  站点:\n----------------------------------------\n项目名称                   数量  金额(元)\n----------------------------------------\n蜗居自制豆腐 / 份           1      28.00\n蜗居秘制风味鱼 / 份         1      58.00\n一品山珍宝 / 份             1      58.00\n小飞生焖鲈鱼 / 份           1      78.00\n油炸花生米 / 份             1       8.00\n凉拌文山小木耳 / 份         1      13.00\n下饭菜 / 份                 2      18.00\n萝卜皮 / 份                 1       8.00\n----------------------------------------\n消费项目合计:                     269.00\n----------------------------------------\n账单减免:                           9.00\n----------------------------------------\n※应收:                           260.00\n----------------------------------------\n人民币:                           260.00\n----------------------------------------\n           Key:2015062670006\n      打印时间:2015-06-26 17:31:31\n<HLLFONT-1-2-2>    系统由哗啦啦提供 Tel:4006527557    ';
				if (_.isEmpty(reportPrnTxt)) return '';
				var arr = reportPrnTxt.split('\n');
				var htm = _.map(arr, function (line) {
					var t = matchFontStyle(line),
						s = '';
					// var fontStyle = matchFontStyle(line);
					// var reg = /^\<(HLLFONT)\-\d\-\d\-\d\>/,
					// 	txt = line.replace(reg, '').replace(/\s/g, '&nbsp;');
					// return '<p class="' + fontStyle + '"><span>' + txt + '</span></p>';
					s = '<p class="' + _.result(t, 'fontStyle') + '"><span>' + _.result(t, 'txt', '') + '</span></p>';
					return s;
				});
				return htm.join('');
			};
			this.getReportPrintTxt = function () {
				return decodeURIComponent(_.result(compBizData, 'reportPrnTxt', ''));
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

			this.getSiteNames = function () {
				return getDictDataByType('siteLst');
			};


		}
	]);

	app.service('ShopPeriodLogService', [
		'$rootScope', '$location', '$filter', 'storage', 'CommonCallServer',
		function ($rootScope, $location, $filter, storage, CommonCallServer) {
			var self = this;
			var logHT = new IX.IListManager();
			var reportName = '',
				reportHead = '',
				reportFood = '',
				tableHeader = [],
				tableBody = [];
			// 初始化列表数据
			var initListData = function (records) {
				// logHT.clear();
				// _.each(records, function (item, idx) {
				// 	logHT.register(idx, item);
				// });
				tableBody = _.map(records, function (el) {
					var row = _.result(el, 'row', []);
					var ret = {};
					_.each(row, function (item, idx) {
						ret[idx] = item;
					});
					return ret;
				});
			};

			this.loadLogLst = function (params) {
				var callServer = CommonCallServer.queryPeriodData(params);
				callServer.success(function (data) {
					var _d = _.result(data, 'data'),
						records = _.result(_d, 'records', []);
					reportName = _.result(_d, 'reportName', '');
					reportHead = _.result(_d, 'reportHead', '');
					reportFood = _.result(_d, 'reportFood', '');
					tableHeader = _.map(_.result(records.shift(), 'row', []), function (el) {
						return {name : el};
					});

					initListData(records);
				});
				return callServer;
			};
			// 获取搜索结果
			this.getLogLst = function () {
				// return logHT.getAll();
				return tableBody;
			};
			// 获取表格头部
			this.getColHeader = function () {
				return tableHeader;
			};
			// 获取报表头部
			this.getReportHead = function () {
				return reportHead;
			};
			// 获取报表页脚
			this.getReportFoot = function () {
				return reportFood;
			};
			// 获取报表名称
			this.getReportName = function () {
				return reportName;
			};
		}
	]);
});