define(['app'], function (app) {
	app.controller('MoreViewController',[
		'$scope', '$rootScope', '$modal', '$location', '$filter', 'storage', 'CommonCallServer', 'AppAlert', 'AppConfirm', 'EMPPermission',
		function ($scope, $rootScope, $modal, $location, $filter, storage, CommonCallServer, AppAlert, AppConfirm, EMPPermission) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			var shopInfo = storage.get('SHOPINFO'),
				webAppPageAnimationIsActive = _.result(shopInfo, 'webAppPageAnimationIsActive') == 1 ? ' fade ' : '';
			var modalIsOpenning = false;
			// 跳转沽清菜品设置
			$scope.appSoldOutSetting = function (e) {
				$location.path('/more/soldout');
			};
			// 版本信息表
			$scope.appVersionSetting = function (e) {
				if ($scope.modalIsOpen()) return;
				var modalSize = 'lg',
					windowClass = 'server-modal ' + webAppPageAnimationIsActive,
					backdrop = 'static',
					controller = 'AppVersionInfoModalController',
					templateUrl = 'js/profile/appversion.html',
					resolve = {
						_scope : function() {
							return $scope;
						}
					};
				$scope.modalIsOpen(true);
				// $modal.open({
				// 	size : modalSize,
				// 	windowClass : windowClass,
				// 	controller : controller,
				// 	templateUrl : templateUrl,
				// 	resolve : resolve,
				// 	backdrop : backdrop
				// });
				Hualala.ModalCom.openModal($rootScope, $modal, {
                    size : modalSize,
					windowClass : windowClass,
					controller : controller,
					templateUrl : templateUrl,
					resolve : resolve,
					backdrop : backdrop
                });
			};
			// 设置/获取当前是否打开了详情模态窗口
			$scope.modalIsOpen = function (b) {
				if (_.isBoolean(b)) {
					modalIsOpenning = b;
				}
				return modalIsOpenning;
			};
			// 修改密码
			$scope.appModifyPWD = function (e) {
				if ($scope.modalIsOpen()) return;
				var modalSize = 'md',
					windowClass = webAppPageAnimationIsActive,
					backdrop = 'static',
					controller = 'ModifyPWDController',
					templateUrl = 'js/profile/modifypwd.html',
					resolve = {
						_scope : function () {
							return $scope;
						}
					};
				$scope.modalIsOpen(true);
				// $modal.open({
				// 	size : modalSize,
				// 	windowClass : windowClass,
				// 	controller : controller,
				// 	templateUrl : templateUrl,
				// 	resolve : resolve,
				// 	backdrop : backdrop
				// });
				Hualala.ModalCom.openModal($rootScope, $modal, {
                    size : modalSize,
					windowClass : windowClass,
					controller : controller,
					templateUrl : templateUrl,
					resolve : resolve,
					backdrop : backdrop
                });
			};
			// app设置
			$scope.appSetting = function (e) {
				Hualala.DevCom.exeCmd('AppSiteSet');
			};
			// app调试
			$scope.appDebug = function (e) {
				Hualala.DevCom.exeCmd('AppDebug');
			};
			// 查看服务器信息
			$scope.appServerInfo = function (e) {
				if ($scope.modalIsOpen()) return;
				var modalSize = 'lg',
					windowClass = 'server-modal ' + webAppPageAnimationIsActive,
					backdrop = 'static',
					controller = 'LocalServerInfoModalController',
					templateUrl = 'js/profile/servermodal.html',
					resolve = {
						_scope : function () {
							return $scope;
						}
					};
				$scope.modalIsOpen(true);
				// $modal.open({
				// 	size : modalSize,
				// 	windowClass : windowClass,
				// 	controller : controller,
				// 	templateUrl : templateUrl,
				// 	resolve : resolve,
				// 	backdrop : backdrop
				// });
				Hualala.ModalCom.openModal($rootScope, $modal, {
                    size : modalSize,
					windowClass : windowClass,
					controller : controller,
					templateUrl : templateUrl,
					resolve : resolve,
					backdrop : backdrop
                });
			};
			// 班结表
			$scope.appChangeShiftInfo = function (e) {
				if ($scope.modalIsOpen()) return;
				var hasPermission = EMPPermission.chkPermission('2010050');
				if (!hasPermission) {
					AppAlert.add('danger', '没有权限班结!');
					return;
				}
				var modalSize = 'lg',
					windowClass = 'server-modal ' + webAppPageAnimationIsActive,
					backdrop = 'static',
					controller = 'changeShiftModalController',
					templateUrl = 'js/profile/changeshift.html',
					resolve = {
						_scope : function () {
							return $scope;
						}
					};
				$scope.modalIsOpen(true);
				// $modal.open({
				// 	size : modalSize,
				// 	windowClass : windowClass,
				// 	controller : controller,
				// 	templateUrl : templateUrl,
				// 	resolve : resolve,
				// 	backdrop : backdrop
				// });
				Hualala.ModalCom.openModal($rootScope, $modal, {
                    size : modalSize,
					windowClass : windowClass,
					controller : controller,
					templateUrl : templateUrl,
					resolve : resolve,
					backdrop : backdrop
                });
			};
			// 注销
			$scope.appLogout = function (e) {
				CommonCallServer.empLogout().
					success(function (data, status, headers, config) {
						var code = _.result(data, 'code');
						if (code == '000') {
							// 需求变更，由于要缓存店铺会员信息参数SHOPVIPINFO，所以在注销时，需要将这部分缓存清空，
							// 尽量保证下一次登录时，能够获取到最新的集团会员信息
							storage.remove('SHOPVIPINFO');
							storage.remove('EMPINFO');
							$location.path('/signin');
						} else {
							// HC.TopTip.addTopTip($rootScope, data);
							AppAlert.add("danger", _.result(data, 'msg', ''));
						}
					});
			};
			// 退出
			$scope.appExit = function (e) {
				// 确认退出窗口
				AppConfirm.add({
					title : "确认退出",
					msg : '是否确认退出？',
					yesFn : function () {
						// 清空本地缓存信息并执行退出指令
						storage.clearAll();
						Hualala.DevCom.exeCmd('AppExit');
					},
					noFn : function () {

						return;
					}
				});
				// storage.clearAll();
				// Hualala.DevCom.exeCmd('AppExit');
			};
			$scope.isDevMode = function () {
				return window.HualalaWorkMode == 'dev';
			};
		}
	]);

	app.controller('LocalServerInfoModalController', [
		'$scope', '$modalInstance', '$filter', '$location', '_scope', 'storage', 'SAASLocalServerInfo', 'AppAlert',
		function ($scope, $modalInstance, $filter, $location, _scope, storage, SAASLocalServerInfo, AppAlert) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			$scope.shopInfo = null;
			$scope.HLLServiceTel = '';
			$scope.cloudServer = null;
			$scope.localApp = null;
			$scope.localServer = null;
			$scope.localMonitor = null;
			$scope.ShopServiceFeatures = _.map(Hualala.TypeDef.ShopServiceFeatures, function (el) {
				return _.extend(el, {
					active : false
				});
			});
			$scope.getLocalServerLocation = function () {
				var loc = document.location;
				return loc.protocol + '//' + loc.host;
			};
			// 格式化账单元整类型名
			$scope.mapMoneyWipeZeroTypeLabel = function (v) {
				var moneyWipeZeroTypes = Hualala.TypeDef.MoneyWipeZeroTypes;
				var el = _.find(moneyWipeZeroTypes, function (item) {
					return _.result(item, 'value') == v;
				});
				return _.result(el, 'label', '');
			};
			$scope.chkServiceFeatureIsOpen = function (v) {
				var curServiceFeatures = _.result($scope.shopInfo, 'shopServiceFeatures', '');
				var idx = curServiceFeatures.indexOf(v + ',');
				return idx > -1;
			};
			var initModalData = function () {
				$scope.shopInfo = SAASLocalServerInfo.getShopInfo();
				$scope.HLLServiceTel = SAASLocalServerInfo.getHLLServiceTel();
				$scope.cloudServer = SAASLocalServerInfo.getCloudServerInfo();
				$scope.localApp = SAASLocalServerInfo.getLocalAppInfo();
				$scope.localServer = SAASLocalServerInfo.getLocalServerInfo();
				$scope.localMonitor = SAASLocalServerInfo.getLocalMonitorInfo();
			};
			SAASLocalServerInfo.loadLocalServerInfo()
				.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						initModalData();
					} else {
						AppAlert.add("danger", _.result(data, 'msg', ''));
					}
				}).error(function (data) {
					AppAlert.add("danger", "服务请求失败!")
				});
			// 关闭窗口
			$scope.close = function () {
				_scope.modalIsOpen(false);
				$modalInstance.close();
			};
			$scope.formatTimeInterval = function (timeTick) {
				if (_.isEmpty(timeTick)) return '';
				return HC.formatTimeInterval(Math.floor(parseInt(timeTick) / 1000));
			};
			$scope.RefreshConfirmationCode = function () {
				SAASLocalServerInfo.refreshcodeServer()
				.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						$scope.localServer.ConfirmationCode = data.data.checkCode;
					} else {
						AppAlert.add("danger", _.result(data, 'msg', ''));
					}
				}).error(function (data) {
					AppAlert.add("danger", "服务请求失败!")
				});
			}
		}
	]);
	
	app.controller('changeShiftModalController', [
		'$scope', '$modalInstance', '$sce', '$filter', '$location', '_scope', 'storage', 'ChangeShiftServer', 'AppAlert','DisposeFormService',
		function ($scope, $modalInstance, $sce, $filter, $location, _scope, storage, ChangeShiftServer, AppAlert, DisposeFormService) {
			IX.ns("Hualala");
			var initModalData = function () {
				var changeShiftInfo = ChangeShiftServer.changeServerInfoFn();
				$scope.shiftForm = DisposeFormService.parseReceiptInfo(changeShiftInfo.printTxt);
				$scope.shiftFormPrint = DisposeFormService.parseReceiptInfo(changeShiftInfo.printTxt,print);
				$scope.shiftNote = changeShiftInfo.shiftRemark;
				$scope.pettyCash = changeShiftInfo.inSpareCashAmount;
				$scope.shiftCode = changeShiftInfo.shiftKey;
			};
			var modifyModalData = function () {
				$scope.modifyShiftInfo = ChangeShiftServer.modifyServerInfo;
			}
			$scope.save = function(){
				upAjax("UPDATE");
			};
			$scope.print = function(){
				Hualala.DevCom.exeCmd("PrintOther", $scope.shiftFormPrint);
			};
			$scope.submit = function(){
				upAjax("COMPLETED");
			};
			var upAjax = function(type){
				ChangeShiftServer.modifyChangeShiftInfo(type,$scope.shiftCode,$scope.pettyCash,$scope.shiftNote)
				.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						initModalData();
						AppAlert.add("success", "提交成功");
						if (type == "COMPLETED"){
							$scope.close();
						}
					} else {
						AppAlert.add("danger", _.result(data, 'msg', ''));
					}
				}).error(function (data) {
					AppAlert.add("danger", "服务请求失败!")
				});
			};
		    var shopInfo = storage.get('SHOPINFO'),
                empInfo = storage.get('EMPINFO');
			ChangeShiftServer.loadChangeShiftInfo(empInfo.empName, shopInfo.shopName)
				.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						initModalData();
					} else {
						AppAlert.add("danger", _.result(data, 'msg', ''));
					}
				}).error(function (data) {
					AppAlert.add("danger", "服务请求失败!")
				});
			// 关闭窗口
			$scope.close = function () {
				_scope.modalIsOpen(false);
				$modalInstance.close();
			};
			// 输入框聚焦事件
            // 告诉软键盘当前操作控件
            $scope.inputFocus = function ($event) {
                var curEl = $($event.target);
                var keyboard = $('.site-numkeyboard');
                if (!curEl.attr('readonly')) {
                    $scope.focusInputEl = curEl;
                } else {
                    $scope.focusInputEl = null;
                }
                return;
            };
    		// html解析
			$scope.parseSnippet = function (v) {
				return $sce.trustAsHtml(v);
			};
		}
	]);

	app.controller('ModifyPWDController', [
		'$scope', '$modalInstance', '$filter', '$location', '_scope', 'storage', 'CommonCallServer', 'AppAlert',
		function ($scope, $modalInstance, $filter, $location, _scope, storage, CommonCallServer, AppAlert) {
			var empInfo = storage.get('EMPINFO');
			$scope.formData = {
				empOldPWD : '',
				empNewPWD : '',
				confirmPWD : '',
				empKey : _.result(empInfo, 'empCode', ''),
				empCode : _.result(empInfo, 'empCode', ''),
				empName : _.result(empInfo, 'empName', '')
			};
			
			// 关闭窗口
			$scope.close = function () {
				_scope.modalIsOpen(false);
				$modalInstance.close();
			};
			var afterSave = function (data) {
				AppAlert.add('success', "修改密码成功,请重新登录!");
				setTimeout(function () {
					$scope.close();
					_scope.appLogout();
				}, 1500);
				
			};
			// 提交表单
			$scope.save = function () {
				IX.Debug.info($scope.formData);
				CommonCallServer.empModifyPWD($scope.formData)
					.success(function (data, status) {
						if ($XP(data, 'code') == '000') {
							afterSave(data);
						} else {
							AppAlert.add('danger', _.result(data, 'msg', ''));
						}
					})
					.error(function (data) {
						AppAlert.add('danger', "修改密码服务失败");
					});
			};
		}
	]);

	app.controller('AppVersionInfoModalController', [
		'$scope', '$modalInstance', '$filter', '$location', '_scope', 'storage', 'AppBaseDataVersion', 'AppAlert',
		function ($scope, $modalInstance, $filter, $location, _scope, storage, AppBaseDataVersion, AppAlert) {
			var shopInfo = storage.get('SHOPINFO'),
				groupID = _.result(shopInfo, 'groupID'),
				shopID = _.result(shopInfo, 'shopID');
			var loadBaseDataLst = function () {
					var callServer = AppBaseDataVersion.initBaseDataVersionLst({
						shopID : shopID,
						groupID : groupID
					});
					callServer.success(function (data) {
						var code = _.result(data, 'code');
						if (code == '000') {
							$scope.baseDataVersionLst = AppBaseDataVersion.getBaseDataVersionLst();
						}
					});
				};
			loadBaseDataLst();
			// 关闭窗口
			$scope.close = function () {
				_scope.modalIsOpen(false);
				$modalInstance.close();
			};
			// 更新信息 
			$scope.update = function (param) {
				var c = AppBaseDataVersion.updateBaseInfo(param);
				c.success(function (data) {
					var code = _.result(data, 'code');
					if (code == '000') {
						AppAlert.add('success', '更新成功!');
						loadBaseDataLst();
					} else {
						AppAlert.add('danger', _.reuslt(data, 'msg', ''));
					}
				});
			};
		}
	]);
});