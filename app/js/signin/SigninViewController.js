define(['app'], function (app) {
	app.controller('SigninViewController', ['$scope', '$location', 'storage', 'CommonCallServer', function ($scope, $location, storage, CommonCallServer) {
		IX.ns("Hualala.Common");
		var HC = Hualala.Common;
		
		var shopInfo = storage.get('SHOPINFO');
		
		HC.TopTip.reset($scope);
		$scope.closeTopTip = function (index) {
			HC.TopTip.closeTopTip($scope, index);
		};

		// 登陆成功后，保存登录用户的配置信息到localStorage中
		var afterLogin = function (data) {
			var empInfo = $XP(data, 'data.records')[0],
				operationMode = $XP(shopInfo, 'operationMode'),
				opset = Hualala.TypeDef.ShopOperationMode[parseInt(operationMode)],
				path = '/' + (opset.id == 0 ? (opset.name + '/table') : opset.name);
			// 保存登录员工的信息到缓存中
			storage.set("EMPINFO", empInfo);
			// 根据餐厅业态跳转模块页
			$location.path(path).replace();
		}

		// 登录操作
		$scope.submitForm = function () {
			CommonCallServer.empLogin($scope.login)
				.success(function (data, status) {
					
					if ($XP(data, 'code') == '000') {
						afterLogin(data);
					} else {
						HC.TopTip.addTopTips($scope, data);
					}

					
				})
				.error(function (data, status) {
					HC.TopTip.addTopTips($scope, data);
				});
		};
		
		// 初始化登录表单数据
		$scope.reset = function (shopInfo) {
			$scope.login = {
				shopName : $XP(shopInfo, 'shopName', ''),
				deviceCode : $XP(shopInfo, 'deviceCode', ''),
				empCode : "",
				empPWD : ""
			};
		};

		$scope.reset(shopInfo);
	}]);

});