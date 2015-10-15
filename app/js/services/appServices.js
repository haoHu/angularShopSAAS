define(['app'], function (app) {
	// 订单渠道服务
	app.service('OrderChannel', 
		['$location', '$filter', 'storage', 'CommonCallServer', function ($location, $filter, storage, CommonCallServer) {
			var self = this;
			this._Channels = [];
			this.ChannelHT = new IX.IListManager();


			/**
			 * 获取订单渠道列表数据
			 * @param  {Object} params  请求参数
			 * @param  {Function} success 请求成功回调
			 * @param  {Function} error   请求失败回调
			 * @return {Object}			deferred/promise的APIs
			 */
			this.loadOrderChannels = function (params, success, error) {
				return CommonCallServer.getChannelLst(params)
					.success(function (data, status, headers, config) {
						self.ChannelHT.clear();
						self._Channels = $filter('mapOrderChannels')($XP(data, 'data.records', []));
						_.each(self._Channels, function (channel) {
							self.ChannelHT.register(_.result(channel, 'channelCode'), channel);
						});
						_.isFunction(success) && success(data, status, headers, config);
					})
					.error(function (data, status, headers, config) {
						_.isFunction(error) && error(data, status, headers, config);
					});
			};

			/**
			 * 根据channelCode获取渠道数据
			 * @param  {String} channelCode 渠道编码
			 * @return {Object | NULL}              Channel Data
			 */
			this.get = function (channelCode) {
				if (_.isEmpty(channelCode) || !_.isString(channelCode)) return null;
				return self.ChannelHT.get(channelCode);
			};

			/**
			 * 根据渠道号序列获取渠道数据
			 * @param  {Array} channelCodes 渠道编码序列
			 * @return {Array | NULL}              渠道数据
			 */
			this.getByKeys = function (channelCodes) {
				if (_.isEmpty(channelCodes) || _.isString(channelCode) || _.isObject(channelCode)) return null;
				return self.ChannelHT.getByKeys(channelCodes);
			};

			/**
			 * 获取所有渠道数据
			 * @return {Array} 渠道数据
			 */
			this.getAll = function () {
				return self.ChannelHT.getAll();
			}
		}]
	);

	// Alert service新版实现，代替旧的toptip用于顶部消息提示
	// 不用在每个controller都去绑定
	app.factory('AppAlert', [
		'$rootScope', '$timeout', '$sce',
		function ($rootScope, $timeout, $sce) {
			var alertService;
			$rootScope.alerts = [];
			return alertService = {
				add : function (type, msg, timeout) {
					timeout = timeout || 1500;
					$rootScope.alerts.push({
						type : type,
						msg : $sce.trustAsHtml(msg),
						close : function () {
							return alertService.closeAlert(this);
						}
					});
					if (timeout) {
						$timeout(function () {
							alertService.closeAlert(this);
						}, timeout);
					}
				},
				closeAlert : function (alert) {
					return this.closeAlertIdx($rootScope.alerts.indexOf(alert));
				},
				closeAlertIdx : function (index) {
					return $rootScope.alerts.splice(index, 1);
				},
				clear : function () {
					$rootScope.alerts = [];
				}
			};
		}
	]);

	// Confirm实现，代替浏览器默认confirm组件
	app.factory('AppConfirm', [
		'$rootScope', '$timeout', '$sce', '$modal', 'storage', 
		function ($rootScope, $timeout, $sce, $modal, storage) {
			var shopInfo = storage.get('SHOPINFO'),
				webAppPageAnimationIsActive = _.result(shopInfo, 'webAppPageAnimationIsActive') == 1 ? ' fade ' : '';
			var confirmService;
			$rootScope.confirmSets = [];
			app.controller('AppConfirmController', [
				'$scope', '$rootScope', '$modalInstance', '_scope',
				function ($scope, $rootScope, $modalInstance, _scope) {
					var curConfirmSet = _.result(_scope, 'curConfirmSet');
					$scope.confirmSet = curConfirmSet;
					var closeConfirm = function () {
						$modalInstance.close();
						curConfirmSet.confirmObj.closeConfirm(curConfirmSet);
					};
					$scope.yesFn = function () {
						$scope.confirmSet.yesFn();
						closeConfirm();
					};
					$scope.noFn = function () {
						$scope.confirmSet.noFn();
						closeConfirm();
					};
				}
			]);
			return confirmService = {
				add : function (cfg) {
					// if ($rootScope.confirmSet.isOpen) return;
					var defSetting = {
						title : "确认窗口",
						msg : "",
						yesText : "确认",
						noText : "取消",
						hasNoBtn : true,
						yesFn : function () {},
						noFn : function () {}
					};
					// $rootScope.confirmSet = _.extend(defSetting, cfg, {isOpen : true});
					var curConfirmSet = _.extend(defSetting, cfg, {
						confirmObj : this
					});
					$rootScope.confirmSets.push(curConfirmSet);
					var modalSize = 'sm',
						windowClass = 'site-confirm ' + webAppPageAnimationIsActive,
						backdrop = 'fixed',
						controller = 'AppConfirmController',
						templateUrl = 'js/services/confirm.html',
						template = [
							'<div class="modal-body text-warning">',
								'<div class="media">',
									'<div class="pull-left">',
										'<span class="media-object">',
											'<span class="glyphicon glyphicon-exclamation-sign"></span>',
										'</span>',
									'</div>',
									'<div class="media-body">',
										'<h4 class="media-heading">{{confirmSet.title}}</h4>',
										'<p ng-bind-html="confirmSet.msg"></p>',
									'</div>',
								'</div>',
							'</div>',
							'<div class="modal-footer bg-warning">',
								'<div class="btn-group btn-group-justified" role="group">',
									'<div class="btn-group" role="group">',
										'<button type="button" class="btn btn-warning btn-lg" ng-click="yesFn()">{{confirmSet.yesText}}</button>',
									'</div>',
									'<div class="btn-group" role="group" ng-if="confirmSet.hasNoBtn">',
										'<button type="button" class="btn btn-default btn-lg" ng-click="noFn()">{{confirmSet.noText}}</button>',
									'</div>',
								'</div>',
							'</div>'
						].join(''),
						resolve = {
							_scope : function () {
								return {
									curConfirmSet : curConfirmSet
								}
							}
						};
					// $modal.open({
					// 	size : modalSize,
					// 	windowClass : windowClass,
					// 	// scope : $rootScope,
					// 	controller : controller,
					// 	// templateUrl : templateUrl,
					// 	template : template,
					// 	resolve : resolve,
					// 	backdrop : backdrop
					// });
					Hualala.ModalCom.openModal($rootScope, $modal, {
	                    size : modalSize,
						windowClass : windowClass,
						// scope : $rootScope,
						controller : controller,
						// templateUrl : templateUrl,
						template : template,
						resolve : resolve,
						backdrop : backdrop
	                });
				},
				closeConfirm : function (confirmSet) {
					return this.closeConfirmIdx($rootScope.confirmSets.indexOf(confirmSet));
				},
				closeConfirmIdx : function (index) {
					return $rootScope.confirmSets.splice(index, 1);
				},
				clear : function () {
					$rootScope.confirmSets = [];
				}
			};
		}
	]);

	// 消息推送窗口
	app.factory('AppMsgBox', [
		'$rootScope', '$timeout', '$sce', '$modal', 'storage',
		function ($rootScope, $timeout, $sce, $modal, storage) {
			var shopInfo = storage.get('SHOPINFO'),
				webAppPageAnimationIsActive = _.result(shopInfo, 'webAppPageAnimationIsActive') == 1 ? ' fade ' : '';
			var msgBoxService;
			$rootScope.msgBoxSets = [];
			app.controller('AppMsgBoxController', [
				'$scope', '$rootScope', '$modalInstance', '$timeout', '_scope',
				function ($scope, $rootScope, $modalInstance, $timeout, _scope) {
					var setting = _.result(_scope, 'setting'),
						boxObj = _.result(_scope, 'boxObj');
					var closeBox = function () {
						$modalInstance.close();
						boxObj.close(setting);
					};
					var getModalStyle = function (icon) {
						var iconClz, textClz;
						if (icon == "ERROR") {
							iconClz = 'glyphicon-question-sign';
							textClz = 'text-danger';
						} else if (icon == "WARNING") {
							iconClz = 'glyphicon-exclamation-sign';
							textClz = 'text-warning';
						} else {
							iconClz = 'glyphicon-info-sign';
							textClz = 'text-info';
						}
						return {
							iconClz : iconClz,
							textClz : textClz
						};
					};
					$scope.setting = _.extend(setting, getModalStyle(_.result(setting, 'icon')));
					$scope.yesFn = function () {
						$scope.setting.yesFn();
						closeBox();
					};
					$scope.noFn = function () {
						$scope.setting.noFn();
						closeBox();
					};
					$timeout(function () {
						closeBox();
					}, 5000);
				}
			]);
			return msgBoxService = {
				add : function (cfg) {
					var defSetting = {
						title : "消息通知",
						body : "",
						//icon包含INFORMATION,WARNING,ERROR
						icon : "INFORMATION",
						yesText : "知道了",
						noText : "取消",
						hasNoBtn : false,
						yesFn : function () {},
						noFn : function () {}
					};
					var curSet = _.extend(defSetting, cfg);
					$rootScope.msgBoxSets.push(curSet);
					var modalSize = 'md',
						windowClass = 'site-confirm ' + webAppPageAnimationIsActive,
						backdrop = 'fixed',
						controller = 'AppMsgBoxController',
						template = [
							'<div class="modal-body {{setting.textClz}}">',
								'<div class="media">',
									'<div class="pull-left">',
										'<span class="media-object">',
											'<span class="glyphicon {{setting.iconClz}}"></span>',
										'</span>',
									'</div>',
									'<div class="media-body">',
										'<h4 class="media-heading">{{setting.title}}</h4>',
										'<p ng-bind-html="setting.body"></p>',
									'</div>',
								'</div>',
							'</div>',
							'<div class="modal-footer bg-warning">',
								'<div class="btn-group btn-group-justified" role="group">',
									'<div class="btn-group" role="group">',
										'<button type="button" class="btn btn-warning btn-lg" ng-click="yesFn()">{{setting.yesText}}</button>',
									'</div>',
									'<div class="btn-group" role="group" ng-if="setting.hasNoBtn">',
										'<button type="button" class="btn btn-default btn-lg" ng-click="noFn()">{{setting.noText}}</button>',
									'</div>',
								'</div>',
							'</div>'
						].join(''),
						resolve = {
							_scope : function () {
								return {
									boxObj : this,
									setting : curSet
								}
							}
						};
					Hualala.ModalCom.openModal($rootScope, $modal, {
	                    size : modalSize,
						windowClass : windowClass,
						controller : controller,
						// templateUrl : templateUrl,
						template : template,
						resolve : resolve,
						backdrop : backdrop
	                });
				},
				close : function (set) {
					return this.closeIdx($rootScope.msgBoxSets.indexOf(set));
				},
				closeIdx : function (index) {
					return $rootScope.msgBoxSets.splice(index, 1);
				},
				clear : function () {
					$rootScope.msgBoxSets = [];
				}
			};
		}
	]);

	// 权限校验
	app.factory('AppAuthEMP', [
		'$rootScope', '$timeout', '$sce', '$modal', 'storage',
		function ($rootScope, $timeout, $sce, $modal, storage) {
			var appAuthService;
			var shopInfo = storage.get('SHOPINFO'),
				webAppPageAnimationIsActive = _.result(shopInfo, 'webAppPageAnimationIsActive') == 1 ? ' fade ' : '';
			$rootScope.authSets = [];
			app.controller('AppAuthController', [
				'$scope', '$rootScope', '$modalInstance', '_scope',
				function ($scope, $rootScope, $modalInstance, _scope) {
					var curAuthSet = _.result(_scope, 'curAuthSet');
					$scope.authSet = curAuthSet;
					var closeAuth = function () {
						$modalInstance.close();
						curAuthSet.authObj.closeAuth(curAuthSet);
					};
					$scope.yesFn = function () {
						$scope.authSet.yesFn({
							tempAllowEmpCode : $scope.tempAllowEmpCode,
							tempAllowEmpPWD : $scope.tempAllowEmpPWD
						});
						
						closeAuth();
					};
					$scope.noFn = function () {
						$scope.authSet.noFn();
						closeAuth();
					};
					$scope.inputKeypress = function ($event) {
						if ($event.keyCode != 13) return;
						var el = $($event.target);
						var tabIdx = parseInt(el.attr('tabIndex'));
						var nextEl = $('[tabIndex=' + (tabIdx + 1) + ']');
						
						el.blur();
						(nextEl.length > 0 && !nextEl.is('.btn')) ? nextEl.focus() : $scope.yesFn();
						
					};
					// 输入框聚焦事件
					// 告诉软键盘当前操作控件
					$scope.inputFocus = function ($event) {
						console.info($event);
						console.info(arguments);
						var curEl = $($event.target);
						if (!curEl.attr('readonly')) {
							$scope.focusInputEl = curEl;
						} else {
							$scope.focusInputEl = null;
						}
						return;

					};
				}
			]);
			return appAuthService = {
				add : function (cfg) {
					var defSetting = {
						title : "权限验证窗口",
						msg : "",
						yesText : "确认",
						noText : "取消",
						yesFn : function () {},
						noFn : function () {}
					};
					var curAuthSet = _.extend(defSetting, cfg, {
						authObj : this
					});
					$rootScope.authSets.push(curAuthSet);
					var modalSize = 'md',
						windowClass = 'site-confirm ' + webAppPageAnimationIsActive,
						backdrop = 'fixed',
						controller = 'AppAuthController',
						// templateUrl = 'js/services/confirm.html',
						template = [
							'<div class="modal-header">',
								'<h4 class="modal-title">获取临时权限</h4>',
							'</div>',
							'<div class="modal-body text-warning clearfix">',
								'<div class="form-horizontal">',
									'<div class="form-group">',
										'<label for="empID" class="col-xs-3 control-label">工号</label>',
										'<div class="col-xs-7">',
											'<input type="text" class="form-control" id="empID" ng-model="tempAllowEmpCode" autofocus="true" tabIndex="1" ng-keypress="inputKeypress($event)"  ng-focus="inputFocus($event)"/>',
										'</div>',
									'</div>',
									'<div class="form-group">',
										'<label for="empPWD" class="col-xs-3 control-label">密码</label>',
										'<div class="col-xs-7">',
											'<input type="password" class="form-control" id="empPWD" ng-model="tempAllowEmpPWD" tabIndex="2" ng-keypress="inputKeypress($event)"  ng-focus="inputFocus($event)"/>',
										'</div>',
									'</div>',
								'</div>',
								'<div class="col-xs-12">',
									'<!-- 软键盘 -->',
									'<numkeyboard cur-target="focusInputEl"></numkeyboard>',
								'</div>',
							'</div>',
							'<div class="modal-footer bg-warning">',
								'<div class="btn-group btn-group-justified" role="group">',
									'<div class="btn-group" role="group">',
										'<button type="button" class="btn btn-warning btn-lg" ng-click="yesFn()" tabIndex="3">{{authSet.yesText}}</button>',
									'</div>',
									'<div class="btn-group" role="group">',
										'<button type="button" class="btn btn-default btn-lg" ng-click="noFn()">{{authSet.noText}}</button>',
									'</div>',
								'</div>',
							'</div>'
						].join(''),
						resolve = {
							_scope : function () {
								return {
									curAuthSet : curAuthSet
								};
							}
						};
					// $modal.open({
					// 	size : modalSize,
					// 	windowClass : windowClass,
					// 	// scope : $rootScope,
					// 	controller : controller,
					// 	// templateUrl : templateUrl,
					// 	template : template,
					// 	resolve : resolve,
					// 	backdrop : backdrop
					// });
					Hualala.ModalCom.openModal($rootScope, $modal, {
	                    size : modalSize,
						windowClass : windowClass,
						// scope : $rootScope,
						controller : controller,
						// templateUrl : templateUrl,
						template : template,
						resolve : resolve,
						backdrop : backdrop
	                });
				},
				closeAuth : function (authSet) {
					return this.closeAuthIdx($rootScope.authSets.indexOf(authSet));
				},
				closeAuthIdx : function (index) {
					return $rootScope.authSets.splice(index, 1);
				},
				clear : function () {
					$rootScope.authSets = [];
				}
			};

		}
	]);

	app.factory('AppProgressbar', [
		'$rootScope', '$timeout', '$sce',
		function ($rootScope, $timeout, $sce) {
			var progressService;
			$rootScope.progresses = [];
			return progressService = {
				add : function (type, msg) {
					var _cfg = {
						type : type || 'warning',
						msg : $sce.trustAsHtml(msg),
						curval : 100,
						max : 100
					};
					$rootScope.progresses.push(_cfg);
					return _cfg;
				},
				clear : function () {
					$rootScope.progresses = [];
				},
				close : function (progress) {
					return this.closeByIdx($rootScope.progresses.indexOf(progress));
				},
				closeByIdx : function (index) {
					return $rootScope.progresses.splice(index, 1);
				}
			};
		}
	]);

	// 门店系统服务器相关信息服务
	app.service('SAASLocalServerInfo',[
		'$rootScope', '$location', '$filter', 'storage', 'CommonCallServer',
		function ($rootScope, $location, $filter, storage, CommonCallServer) {
			IX.ns("Hualala");
			var self = this;
			var _LocalServerInfo = null;
			var baseShopInfoKeys = 'IsShopReged,groupID,groupName,shopID,shopName,shopTel,shopCityName,'
					+ 'shopAddress,shopBizMode,shopServiceFeatures',
				baseCloudServerKeys = 'apiAPIHost,CloudHostConnecttionStatus',
				baseLocalAppKeys = 'appVersionNo,appPath,DBFileName,DBFileSize,WebAppVersionNo,DebugModel',
				baseLocalServerKeys = 'HttpServerComputerName,HttpServerSysDateTimeFormatStr,'
					+ 'KitchenPrintBillTypeLst,moneyWipeZeroType,ConfirmationCode,LocalSitePrinterPortName,'
					+ 'LocalSitePrinterPortType,LocalSitePrinterPageSize,LocalSitePrinterLineMaxCharCount',
				baseLocalMonitorKeys = 'HttpServerStartTickCount,MonitorThreadLastTickCount,MsgThreadLastTickCount,'
					+ 'PrintThreadLastTickCount,KitchenPrintActive,IsRevMsgFormAPIHost';
			/**
			 * 加载本地服务器信息
			 * @return {[type]} [description]
			 */
			this.loadLocalServerInfo = function (checkKey) {
				var callServer = CommonCallServer.getSaasLocalServerInfo({
					checkKey : checkKey || 'ilovehualala'
				});
				callServer.success(function (data, status, headers, config) {
					var code = _.result(data, 'code');
					if (code == '000') {
						_LocalServerInfo = _.result(data, 'data', {});
					}
				});
				return callServer;
			};

			/**
			 * 获取店铺配置信息
			 * @return {[type]} [description]
			 */
			this.getShopInfo = function () {
				return _.pick(_LocalServerInfo, baseShopInfoKeys.split(','));
			};

			/**
			 * 获取哗啦啦服务热线
			 * @return {[type]} [description]
			 */
			this.getHLLServiceTel = function () {
				return _.result(_.pick(_LocalServerInfo, 'HLLServiceTel'), 'HLLServiceTel', '');
			};
			/**
			 * 获取云端服务器配置信息
			 * @return {[type]} [description]
			 */
			this.getCloudServerInfo = function () {
				return _.pick(_LocalServerInfo, baseCloudServerKeys.split(','));
			};
			/**
			 * 获取本地APP信息
			 * 
			 * @return {[type]} [description]
			 */
			this.getLocalAppInfo = function () {
				return _.pick(_LocalServerInfo, baseLocalAppKeys.split(','));
			};
			/**
			 * 获取本地服务器信息
			 * @return {[type]} [description]
			 */
			this.getLocalServerInfo = function () {
				return _.pick(_LocalServerInfo, baseLocalServerKeys.split(','));
			};
			/**
			 * 获取本地监控数据信息
			 * @return {[type]} [description]
			 */
			this.getLocalMonitorInfo = function () {
				return _.pick(_LocalServerInfo, baseLocalMonitorKeys.split(','));
			};
		}
	]);

	// 沽清菜品列表服务
	app.service('SoldoutService', [
		'$rootScope', '$location', '$filter', 'storage', 'CommonCallServer',
		function ($rootScope, $location, $filter, storage, CommonCallServer) {
			var self = this,
				_SoldOutFoods = [],
				_SoldOutFoodHT = new IX.IListManager();
			/**
			 * 加载沽清菜品列表
			 * @return {[type]} [description]
			 */
			this.loadSoldoutLst = function () {
				return CommonCallServer.getSoldOutFoodLst()
					.success(function (data, status, headers, config) {
						var code = $XP(data, 'code'),
							ret = $XP(data, 'data.records', []);
						_SoldOutFoods = ret;
					})
					.error(function (data, status, headers, config) {

					});
			};
			/**
			 * 构建沽清菜品列表数据结构
			 * @return {[type]} [description]
			 */
			this.initSoldoutLst = function () {
				var c = self.loadSoldoutLst();
				_SoldOutFoodHT.clear();
				c.success(function (data) {
					_.each(_SoldOutFoods, function (food) {
						var unitKey = _.result(food, 'unitKey');
						_SoldOutFoodHT.register(unitKey, food);
					});
				});
				return c;
			};
			/**
			 * 获取沽清菜品数据列表
			 * @return {[type]} [description]
			 */
			this.getSoldoutFoodLst = function () {
				return _SoldOutFoodHT.getAll();
			};

			/**
			 * 根据unitKey获取沽清菜品
			 * @param  {[type]} unitKey [description]
			 * @return {[type]}         [description]
			 */
			this.getSoldoutFoodItem = function (unitKey) {
				if (_.isEmpty(unitKey)) return null;
				return _SoldOutFoodHT.get(unitKey);
			};
			/**
			 * 判断菜品是否为沽清菜品
			 * @param  {[type]}  unitKey [description]
			 * @return {Boolean}         [description]
			 */
			this.isSoldoutFood = function (unitKey) {
				var food = _SoldOutFoodHT.get(unitKey);
				return !_.isEmpty(food);
			};
			/**
			 * 删除沽清菜品记录
			 * @param  {[type]} food [description]
			 * @return {[type]}      [description]
			 */
			this.deleteSoldoutFoodItem = function (food) {
				var unitKey = _.result(food, 'unitKey'),
					isSoldoutFood = self.isSoldoutFood(unitKey);
				isSoldoutFood && _SoldOutFoodHT.unregister(unitKey);
			};
			/**
			 * 新增沽清菜品记录
			 * @param {[type]} food [description]
			 */
			this.addSoldoutFoodItem = function (food) {
				var unitKey = _.result(food, 'unitKey'),
					isSoldoutFood = self.isSoldoutFood(unitKey);
				_SoldOutFoodHT.register(unitKey, food);
			};
			/**
			 * 取消所有沽清菜品
			 * @return {[type]} [description]
			 */
			this.cleanSoldoutFoods = function () {
				_SoldOutFoodHT.clear();
				var params = {
					soldOutFoodLst : JSON.stringify({
						soldOutFoodLst : []
					})
				}
				return CommonCallServer.setSoldOutFoodLst(params);
			};

			this.commitSoldoutFoods = function () {
				var foods = self.getSoldoutFoodLst();
				var params = {
					soldOutFoodLst : JSON.stringify({
						soldOutFoodLst : Hualala.Common.formatPostData(foods)
					})
				};
				return CommonCallServer.setSoldOutFoodLst(params);
			};
		}
	]);

	// 基本信息版本服务
	app.service('AppBaseDataVersion', [
		'$rootScope', '$location', '$filter', 'storage', 'CommonCallServer',
		function ($rootScope, $location, $filter, storage, CommonCallServer) {
			var self = this,
				_BaseDataLst = [],
				_BaseDataHT = new IX.IListManager();
			/**
			 * 加载基本信息版本表
			 * @return {[type]} [description]
			 */
			this.loadBaseDataVersionLst = function (param) {
				var c = CommonCallServer.getBaseDataVersionLst(param);
				c.success(function (data) {
					var ret = $XP(data, 'data.records', []);
					_BaseDataLst = ret;
				});
				return c;
			};
			/**
			 * 构建基本信息版本表
			 * @return {[type]} [description]
			 */
			this.initBaseDataVersionLst = function (param) {
				var c = self.loadBaseDataVersionLst(param);
				_BaseDataHT.clear();
				c.success(function (data) {
					_.each(_BaseDataLst, function (el) {
						var msgType = _.result(el, 'msgType');
						_BaseDataHT.register(msgType, el);
					});
				});
				return c;
			};
			/**
			 * 获取全部数据
			 * @return {[type]} [description]
			 */
			this.getBaseDataVersionLst = function () {
				return _BaseDataHT.getAll();
			};
			/**
			 * 更新基本信息
			 * @param  {[type]} param [description]
			 * @return {[type]}       [description]
			 */
			this.updateBaseInfo = function (param) {
				var action = _.result(param, 'msgType');
				var c = CommonCallServer.updateBaseInfo({
					action : action
				});
				return c;
			};

		}
	]);

	// 判断登录用户是否存在权限
	app.factory('EMPPermission', [
		'$rootScope', 'storage',
		function ($rootScope, storage) {
			return {
				chkPermission : function (pID) {
					var empInfo = storage.get('EMPINFO'),
						rightIDLst = _.result(empInfo, 'rightIDLst', '');
					return rightIDLst.indexOf(pID) > -1;
				}
			};
		}
	]);
});