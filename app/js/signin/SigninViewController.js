define(['app'], function (app) {
	app.controller('SigninViewController', [
		'$rootScope', '$scope', '$location', 'storage', 'CommonCallServer', 'AppAlert', 'AppProgressbar',
		function ($rootScope, $scope, $location, storage, CommonCallServer, AppAlert, AppProgressbar) {
			IX.ns("Hualala.Common");
			var HC = Hualala.Common;
			
			var shopInfo = storage.get('SHOPINFO'),
				deviceName = storage.get('deviceName'),
				deviceCode = storage.get('deviceCode'),
				deviceKey = storage.get('deviceKey');
			
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
				var progressbar = AppProgressbar.add('warning', '登录中...');
				CommonCallServer.empLogin($scope.login)
					.success(function (data, status) {
						AppProgressbar.close(progressbar);
						if ($XP(data, 'code') == '000') {
							afterLogin(data);
						} else {
							AppAlert.add('danger', _.result(data, 'msg', ''));
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
					deviceCode : deviceCode,
					deviceName : deviceName,
					deviceKey : deviceKey,
					empCode : "",
					empPWD : ""
				};
			};

			// 退出程序
			$scope.appExit = function (e) {
				Hualala.DevCom.exeCmd('AppExit');
			};

			$scope.inputKeyup = function ($event) {
				if ($event.keyCode != 13) return;
				var el = $($event.target);
				var tabIdx = parseInt(el.attr('tabIndex'));
				var nextEl = $('[tabIndex=' + (tabIdx + 1) + ']');
				
				el.blur();
				(nextEl.length > 0 && !nextEl.is('.btn')) ? nextEl.focus() : $scope.submitForm();
				
			};

			$scope.reset();
		}
	]);

});