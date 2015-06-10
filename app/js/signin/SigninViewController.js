define(['app'], function (app) {
	app.controller('SigninViewController', [
		'$rootScope', '$scope', '$location', 'storage', 'CommonCallServer', 'AppAlert',
		function ($rootScope, $scope, $location, storage, CommonCallServer, AppAlert) {
			IX.ns("Hualala.Common");
			var HC = Hualala.Common;
			
			var shopInfo = storage.get('SHOPINFO');
			
			// HC.TopTip.reset($rootScope);
			// $scope.closeTopTip = function (index) {
			// 	HC.TopTip.closeTopTip($rootScope, index);
			// };

			// 登陆成功后，保存登录用户的配置信息到localStorage中
			var afterLogin = function (data) {
				var empInfo = $XP(data, 'data.records')[0],
					operationMode = $XP(shopInfo, 'operationMode'),
					opset = Hualala.TypeDef.ShopOperationMode[parseInt(operationMode)],
					path = '/' + (opset.value == 0 ? (opset.name + '/table') : opset.name);
				// 保存登录员工的信息到缓存中
				storage.set("EMPINFO", empInfo);
				// 根据餐厅业态跳转模块页
				$location.path(path).replace();
			}

			// 登录操作
			$scope.submitForm = function () {
				IX.Debug.info($scope.login);
				CommonCallServer.empLogin($scope.login)
					.success(function (data, status) {
						
						if ($XP(data, 'code') == '000') {
							afterLogin(data);
						} else {
							AppAlert.add('danger', _.reulst(data, 'msg', ''));
							// HC.TopTip.addTopTips($rootScope, data);
						}

						
					})
					.error(function (data, status) {
						// HC.TopTip.addTopTips($rootScope, data);
						AppAlert.add('danger', "服务请求失败");
					});
			};
			
			// 初始化登录表单数据
			$scope.reset = function () {
				$scope.login = {
					shopName : $XP(shopInfo, 'shopName', ''),
					deviceCode : $XP(shopInfo, 'deviceCode', ''),
					empCode : "",
					empPWD : ""
				};
			};

			$scope.reset();
		}
	]);

});