define(['app'], function (app) {
	// 桌台控制器
	app.controller('TableViewController', [
		'$scope', '$rootScope', '$modal', '$location', '$filter', 'storage', 'CommonCallServer', 'OrderService', 'TableService',
		function ($scope, $rootScope, $modal, $location, $filter, storage, CommonCallServer, OrderService, TableService) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			HC.TopTip.reset($scope);
			$scope.closeTopTip = function (index) {
				HC.TopTip.closeTopTip($scope, index);
			};
			var allTableLstPromise = TableService.loadTableStatusLst();

			// 桌台名称搜索关键字
			$scope.qTblStatus = '-1';
			// 桌台状态过滤字段
			$scope.qTblName = '';
			// 当前选中桌台区域名
			$scope.curAreaName = '';
			// 桌台区域数据
			$scope.TableAreas = [];
			// 格式化区域选项的渲染数据
			var mapTableAreaRenderData = function (areas) {
				// areas.unshift({
				// 	__ID__ : 'all_tables',
				// 	areaName : '',
				// 	tblLst : null
				// });
				var ret = _.map(areas, function (area) {
					return _.extend(area, {
						value : _.result(area, 'areaName'),
						label : _.result(area, '__ID__') == 'all_tables' ? '全部' : _.result(area, 'areaName')
					});
				});
				return ret;
			};
			// 获取当前的桌台信息
			var getCurTables = function () {
				// 获取所有桌台数据
				var tables = TableService.filterTableLst($scope.qTblStatus, $scope.curAreaName);
				$scope.curTables = tables;
			};
			allTableLstPromise.success(function (data) {
				var areas = TableService.getTableAreas();
				getCurTables();
				$scope.TableAreas = mapTableAreaRenderData(areas);
				
			});
			/**
			 * 选择桌台区域
			 * @param  {[type]} v areaName
			 * @return {[type]}   [description]
			 */
			$scope.selectTableArea = function (v) {
				$scope.curAreaName = v;
				// 获取指定区域桌台状态数据
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName
				});
				callServer.success(function (data) {
					// var areas = TableService.getTableAreas();
					getCurTables();
					// $scope.TableAreas = mapTableAreaRenderData(areas);
				});
				
			};

			/**
			 * 根据桌台状态过滤桌台
			 * @param  {[type]} s [description]
			 * @return {[type]}   [description]
			 */
			$scope.queryTablesByStatus = function (s) {
				var callServer = TableService.loadTableStatusLst({
					areaName : $scope.curAreaName
				});
				callServer.success(function (data) {
					getCurTables();
				});
			};
		}
	]);
});
