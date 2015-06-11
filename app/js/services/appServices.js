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
		'$rootScope', '$timeout', '$sce', '$modal', 
		function ($rootScope, $timeout, $sce, $modal) {
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
						yesFn : function () {},
						noFn : function () {}
					};
					// $rootScope.confirmSet = _.extend(defSetting, cfg, {isOpen : true});
					var curConfirmSet = _.extend(defSetting, cfg, {
						confirmObj : this
					});
					$rootScope.confirmSets.push(curConfirmSet);
					var modalSize = 'sm',
						windowClass = 'site-confirm',
						backdrop = 'fixed',
						controller = 'AppConfirmController',
						templateUrl = 'js/services/confirm.html',
						template = [
							'<div class="modal-body bg-warning text-warning">',
								'<div class="media">',
									'<div class="pull-left">',
										'<span class="media-object">',
											'<span class="glyphicon glyphicon-exclamation-sign"></span>',
										'</span>',
									'</div>',
									'<div class="media-body">',
										'<h4 class="media-heading">{{confirmSet.title}}</h4>',
										'<p>{{confirmSet.msg}}</p>',
									'</div>',
								'</div>',
							'</div>',
							'<div class="modal-footer bg-warning">',
								'<div class="btn-group btn-group-justified" role="group">',
									'<div class="btn-group" role="group">',
										'<button type="button" class="btn btn-warning btn-lg" ng-click="yesFn()">{{confirmSet.yesText}}</button>',
									'</div>',
									'<div class="btn-group" role="group">',
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
					$modal.open({
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
});