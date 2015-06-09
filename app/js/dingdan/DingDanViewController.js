define(['app'], function(app)
{
	app.controller('DingDanViewController',
	[
		'$scope', '$rootScope', '$modal', '$location', '$filter', '$timeout', 'storage', 'CommonCallServer', 'LocalOrderLstService',
		function($scope, $rootScope, $modal, $location, $filter, $timeout, storage, CommonCallServer, LocalOrderLstService) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			HC.TopTip.reset($rootScope);
			$scope.closeTopTip = function (index) {
				HC.TopTip.closeTopTip($rootScope, index);
			};
			$scope.orderLstData = null;
			$scope.qOrderSubType = '-1';
			$scope.qReportDate = new Date();
			$scope.qOrderStatus = '20';
			$scope.qKeyword = '';
			$scope.curPageNo = 1;
			$scope.totalSize = 0;
			$scope.numPages = 0;
			var updateOrderLstData = function () {
                $scope.orderLstData = LocalOrderLstService.getOrderLst();
                var pageParams = LocalOrderLstService.getPaginationParams();
                $scope.curPageNo = _.result(pageParams, 'pageNo');
                $scope.totalSize = _.result(pageParams, 'totalSize');
                $scope.numPages = Math.ceil(totalSize / _.result(pageParams, 'pageSize'));
			};
			$scope.openDatePicker = function ($event) {
				$event.preventDefault();
				$event.stopPropagation();
				$scope.datePickerOpened = true;
			};
			$scope.today = function () {
				return IX.Date.getDateByFormat(new Date(), 'yyyy-MM-dd');
				// return IX.Date.formatDate(new Date());
			};
			$scope.queryByReportDate = function ($event, v) {
				var evtType = _.result($event, 'type'),
					keyCode = _.result($event, 'keyCode');
				if (evtType == 'keyup' && keyCode != 13) return;
				console.info('qReportDate:' + $scope.qReportDate);
				$scope.queryOrderLst();
			};
			$scope.queryByOrderSubType = function (v) {
				$scope.qOrderSubType = v;
				console.info('qOrderSubType:' + $scope.qOrderSubType);
				$scope.queryOrderLst();
			};
			$scope.queryByOrderStatus = function (v) {
				$scope.qOrderStatus = v;
				console.info('qOrderStatus:' + $scope.qOrderStatus);
				$scope.queryOrderLst();
			};
			$scope.queryByKeyword = function ($event, v) {
				var evtType = $event.type,
					keyCode = $event.keyCode;
				if (evtType == 'keyup' && keyCode != 13) return;
				// $scope.qKeyword = v;
				console.info('qKeyword:' + $scope.qKeyword);
				$scope.queryOrderLst();
			};
			$scope.queryOrderLst = function () {
				var params = {
					orderSubType : $scope.qOrderSubType == -1 ? '' : $scope.qOrderSubType,
					orderStatus : $scope.qOrderStatus,
					reportDate : _.isDate($scope.qReportDate) ? IX.Date.getDateByFormat($scope.qReportDate, 'yyyyMMdd') : '',
					keyword : $scope.qKeyword || ''
				};
				var callServer = LocalOrderLstService.loadLocalOrderLstData(params);
				callServer.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
                        updateOrderLstData()
					} else {
						HC.TopTip.addTopTips($rootScope, data);
					}
				}).error(function (data) {
					HC.TopTip.addTopTips($rootScope, {
						msg : '请求失败'
					});
				});
			};
            $scope.queryOrderLst();
		}
	]);
});