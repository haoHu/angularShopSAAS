define(['app'], function(app)
{
	app.controller('BaoBiaoViewController', [
		'$scope', '$rootScope', '$modal', '$location', '$filter', '$timeout', '$sce', 'storage', 'CommonCallServer', 'AppAlert', 'ShopLogService', 'ShopCurBizService', 'ShopCompositeBizService', 'ReportDictionaryService',
		function($scope, $rootScope, $modal, $location, $filter, $timeout, $sce, storage, CommonCallServer, AppAlert, ShopLogService, ShopCurBizService, ShopCompositeBizService, ReportDictionaryService) {
			IX.ns("Hualala");
			var HC = Hualala.Common, dictCallServer = null;
			$scope.curPageType = _.isEmpty(_.result($location.search(), 'tab')) ? 'biz' : _.result($location.search(), 'tab');
			dictCallServer = $scope.curPageType == 'comp' ? ReportDictionaryService.loadReportDictionary() : null;
			$scope.CheckoutUsers = [];
			$scope.TimeNames = [];
			$scope.TableAreas = [];
			$scope.QueryRangeLst = Hualala.TypeDef.CompBizQueryRangeLst;
			$scope.formatDateTime = function (v,  format) {
				console.info(v);
				if (!v) return '';
				var dateStr = IX.Date.format(v),
					f = format || 'yyyy/MM/dd HH:mm:ss';
				console.info(dateStr);
				return _.isEmpty(dateStr) ? '' : IX.Date.getDateByFormat(dateStr, f);
			};
			var initFormParams = function () {
				$scope.qform = {};
				if ($scope.curPageType == 'log') {
					$scope.qform = {
						startDate : new Date(),
						endDate : new Date(),
						keyword : '',
						pageNo : 1,
						pageSize : 15
					}
				} else if ($scope.curPageType == 'comp') {
					return dictCallServer.success(function(data) {
						var code = _.result(data, 'code');
						var today = new Date(),
							tonight = new Date();
						today.setHours(0);
						today.setMinutes(0);
						tonight.setHours(23);
						tonight.setMinutes(59);
						if (code == '000') {
							$scope.CheckoutUsers = ReportDictionaryService.getCheckouts();
							$scope.TimeNames = ReportDictionaryService.getTimeNames();
							$scope.TableAreas = ReportDictionaryService.getAreas();

							$scope.qform = {
								startDate : today,
								endDate : tonight,
								startTime : today,
								endTime : tonight,
								checkoutBy : '全部',
								timeName : '全部',
								areaName : '全部',
								queryRangeLst : _.pluck($scope.QueryRangeLst, 'value')
							};
							$scope.QueryRangeLst = _.map($scope.QueryRangeLst, function (el) {
								var v = _.result(el, 'value');
								var checked = !_.find($scope.qform.queryRangeLst, function (el) {
									return el == v;
								}) ? false : true;
								return _.extend(el, {
									checked : checked
								});
							});
							// $('#startTime, #endTime').popover();
							$('#startTime, #endTime').popover({
								trigger : 'click',
								html : true,
								placement : 'bottom',
								title : '时间'
							});
						}
					}).error(function (data) {
						AppAlert.add('danger', '请求失败!');
					});
				}
				return null;
			};
			var queryLogLst = function (params) {
				var postData = {
					startDate : _.isDate(params.startDate) ? IX.Date.getDateByFormat(params.startDate, 'yyyyMMdd') : '',
					endDate : _.isDate(params.endDate) ? IX.Date.getDateByFormat(params.endDate, 'yyyyMMdd') : '',
					keyword : params.keyword || '',
					pageNo : params.pageNo,
					pageSize : params.pageSize
				};
				var c = ShopLogService.loadLogLst(postData);
				c.success(function (data) {
					var code = _.result(data, 'code');
					if (code != '000') {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					} else {
						// AppAlert.add('success', "数据加载成功");
						$scope.curLogLst = ShopLogService.getLogLst();
					}
				}).error(function (data) {
					AppAlert.add('danger', '请求失败');
				});
			};
			var queryBizLst = function (params) {
				var c = ShopCurBizService.loadCurrBizDataLst(params);
				c.success(function (data) {
					var code = _.result(data, 'code');
					if (code != '000') {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					} else {
						// AppAlert.add('success', "数据加载成功");
						$scope.curBizData = ShopCurBizService.getDataLst();
					}
				}).error(function (data) {
					AppAlert.add('danger', '请求失败');
				});
			};
			var queryCompBizLst = function (params) {
				var postData = {};
				var startDate = _.result(params, 'startDate'),
					startTime = _.result(params, 'startTime'),
					endDate = _.result(params, 'endDate'),
					endTime = _.result(params, 'endTime'),
					areaName = _.result(params, 'areaName'),
					checkoutBy = _.result(params, 'checkoutBy'),
					timeName = _.result(params, 'timeName'),
					queryRangeLst = _.result(params, 'queryRangeLst', []);
				var c ;
				var mapDateTimeStr = function (oDate, oTime) {
					return $scope.formatDateTime(oDate, 'yyyyMMdd') + $scope.formatDateTime(oTime, 'HHmm');
				};
				postData.areaName = areaName;
				postData.checkoutBy = checkoutBy;
				postData.timeName = timeName;
				postData.startDateTime = mapDateTimeStr(startDate, startTime);
				postData.endDateTime = mapDateTimeStr(endDate, endTime);
				postData.queryRangeLst = queryRangeLst.join(',');
				c = ShopCompositeBizService.loadCompBizDataLst(postData);
				c.success(function (data) {
					var code = _.result(data, 'code');
					if (code != '000') {
						AppAlert.add('danger', _.result(data, 'msg', ''));
					} else {
						// AppAlert.add('success', "数据加载成功");
						$scope.compBizData = ShopCompositeBizService.parseReceiptInfo();
					}
				}).error(function (data) {
					AppAlert.add('danger', '请求失败');
					// for test
					// $scope.compBizData = ShopCompositeBizService.parseReceiptInfo();
				});
			};
			
			$scope.openDatePicker = function ($event, idx) {
				$event.preventDefault();
				$event.stopPropagation();
				switch(idx) {
					case '1':
						$scope.qform.dp1 = true;
						break;
					case '2':
						$scope.qform.dp2 = true;
						break;
				}
			};
			$scope.today = function () {
				return IX.Date.getDateByFormat(new Date(), 'yyyy-MM-dd');
			};
			$scope.queryByKeyword = function ($event, v) {
				var evtType = $event.type,
					keyCode = $event.keyCode;
				if (evtType == 'keyup' && keyCode != 13) return;
				console.info('qKeyword:' + $scope.qform.keyword);
				$scope.queryLst();
			};
			$scope.queryByDate = function ($event) {
				// var evtType = $event.type,
				// 	keyCode = $event.keyCode;
				// if (evtType == 'keyup' && keyCode != 13) return;
				$scope.queryLst();
			};
			// 查询结果
			$scope.queryLst = function (pager) {
				var params = _.extend($scope.qform, pager);
				switch ($scope.curPageType) {
					case "log":
						queryLogLst(params);
						break;
					case "biz":
						queryBizLst(params);
						break;
					case "comp":
						queryCompBizLst(params);
						break;
				}
			};
			// 分页
			$scope.selectPage = function () {
				$scope.queryLst({
					pageNo : $scope.qform.curPageNo,
					pageSize : $scope.qform.pageSize
				});
			};
			$scope.queryByFilterItem = function (item, key) {
				$scope.qform[key] = _.result(item, 'value');
			};

			$scope.popupTimePicker = function ($event, key) {
				var $el = $($event.currentTarget);
				if (key == 'startTime' && $scope.startTimeOpen) return;
				if (key == 'endTime' && $scope.endTimeOpen) return;
				var setClosed = function () {
					$scope[key + 'Open'] = false;
				};
				$scope[key + 'Open'] = true;
				
				// $el.popover('show');
				$el.unbind('shown.bs.popover').on('shown.bs.popover', function () {
					var $this = $(this);
					var tp = $this.parent().find('.timepicker-box').removeClass('hidden');
					$this.parent().find('.popover .popover-content').empty().append(tp);
					$this.parent().find('.popover .btn-block').unbind().on('click', function (e) {
						setClosed();
						$this.popover('toggle');
					});
				});
				$el.unbind('hide.bs.popover').on('hide.bs.popover', function () {
					setClosed();
					var $this = $(this);
					var tp = $this.parent().find('.timepicker-box').addClass('hidden');
					$this.parent().append(tp);
				});
			};

			$scope.onQueryRangeChange = function () {
				var ret = _.filter($scope.QueryRangeLst, function (el) {
					return el.checked;
				});
				$scope.qform.queryRangeLst = _.pluck(ret, 'value');
				console.info($scope.qform.queryRangeLst);
				$scope.queryLst();
			};

			// html解析
			$scope.parseSnippet = function (v) {
				return $sce.trustAsHtml(v);
			};
			// 打印综合营业数据
			$scope.printCompBizData = function () {
				var printTxt = ShopCompositeBizService.getReportPrintTxt();
				Hualala.DevCom.exeCmd("PrintOther", printTxt);
			};
			

			initFormParams();
			if (dictCallServer) {
				dictCallServer.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						$scope.queryLst();
					}
				});
			} else {
				$scope.queryLst();
			}
			
		}
	]);
});