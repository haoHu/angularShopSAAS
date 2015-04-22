define(['app'], function (app) {
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
});