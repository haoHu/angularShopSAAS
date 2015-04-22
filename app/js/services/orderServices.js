define(['app'], function (app) {
	app.service('OrderService', 
		['$location', '$filter', 'storage', 'CommonCallServer', function ($location, $filter, storage, CommonCallServer) {
			var self = this;
			this._OrderData = null;

			var OrderHeaderKeys = 'saasOrderNo,tableName,orderSubType,person,createBy,startTime,userName,userAddress,userMobile,channelName'.split(',');


			/**
			 * 根据orderKey获取订单信息
			 * @param  {Object} params  请求参数
			 * @param  {Function} success 请求成功回调
			 * @param  {Function} error   失败的回调
			 * @return {Object}         deferred/promise的APIs
			 */
			this.getOrderByOrderKey = function (params, success, error) {
				self._OrderData = {};
				var saasOrderKey = _.result(params, 'saasOrderKey');
				if (_.isEmpty(saasOrderKey)) {
					_.isFunction(success) && success();
					return null;
				}
				return CommonCallServer.getOrderByOrderKey(params)
					.success(function (data, status, headers, config) {
						var ret = $XP(data, 'data.records', []);
						self._OrderData = !ret ? {} : ret[0];
						_.isFunction(success) && success(data, status, headers, config);
					})
					.error(function (data, status, headers, config) {
						_.isFunction(error) && error(data, status, headers, config);
					});
			};

			/**
			 * 后去单头信息
			 * @return {[type]} [description]
			 */
			this.getOrderHeaderData = function () {
				var defaultData = {};
				if (_.isEmpty(self._OrderData)) {
					_.each(OrderHeaderKeys, function (k) {
						var v = '';
						switch (k) {
							case "orderSubType":
								v = 0;
								break;
							case "person":
								v = 1;
								break;
							case "createBy":
								v = _.result(storage.get('EMPINFO'), 'empCode');
								break;
							default :
								v = '';
								break;
						}
						defaultData[k] = v;
					});
					self._OrderData = _.extend(self._OrderData, defaultData);
				}
				return _.pick(self._OrderData, OrderHeaderKeys);
			};


			this.updateOrderHeader = function (orderHeader) {

			};

		}]
	);
});