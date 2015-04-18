define(['app'], function (app) {
	// 显示订单类型的label
	app.filter("getOrderSubTypeLabel", function () {
		IX.ns('Hualala.TypeDef');
		var filterFn = function (t) {
			var orderSubTypes = Hualala.TypeDef.OrderSubTypes;
			var label = orderSubTypes[t]['label'];
			return label;
		};
		return filterFn;
	});

	// 格式化订单渠道的数据
	app.filter("mapOrderChannels", function () {
		var filterFn = function (channels) {
			var ret = _.map(channels, function (channel) {
				return _.extend(channel, {
					value : _.result(channel, 'channelCode', ''),
					label : _.result(channel, 'channelName', '')
				});
			});
			return ret;
		};
		return filterFn;
	});

	// 显示订单渠道label
	app.filter("getOrderChannelLabel", function () {
		var filterFn = function (v, channels) {
			console.info(window.count++);
			var ret = _.find(channels, function (channel) {
				return v == _.result(channel, 'channelCode');
			});
			return _.isUndefined(ret) ? '空' : _.result(ret, 'channelName');
		};
		return filterFn;
	});
});