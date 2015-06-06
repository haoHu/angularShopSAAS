define(['app'], function (app) {
	app.controller('MoreViewController',[
		'$scope', '$rootScope', '$modal', '$location', '$filter', 'storage', 'CommonCallServer',
		function ($scope, $rootScope, $modal, $location, $filter, storage, CommonCallServer) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			HC.TopTip.reset($rootScope);
			$scope.closeTopTip = function (index) {
				HC.TopTip.closeTopTip($rootScope, index);
			};
			// 修改密码
			$scope.appModifyPWD = function (e) {

			};
			// app设置
			$scope.appSetting = function (e) {
				Hualala.DevCom.exeCmd('AppSiteSet');
			};
			// app调试
			$scope.appDebug = function (e) {
				Hualala.DevCom.exeCmd('AppDebug');
			};
			// 注销
			$scope.appLogout = function (e) {
				CommonCallServer.empLogout().
					success(function (data, status, headers, config) {
						var code = _.result(data, 'code');
						if (code == '000') {
							$location.path('/signin');
						} else {
							HC.TopTip.addTopTip($rootScope, data);
						}
					});
			};
			// 退出
			$scope.appExit = function (e) {
				Hualala.DevCom.exeCmd('AppExit');
			};
		}
	]);
});