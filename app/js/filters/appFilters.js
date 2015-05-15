define(['app'], function (app) {
	// 显示简写单号
	app.filter("getSaasOrderNo", function () {
		var filterFn = function (t) {
			var l = _.isEmpty(t) ? 0 : t.length;
			return l == 0 ? '' : t.slice(-4);
		};
		return filterFn;
	});
	// 显示订单类型的label
	app.filter("getOrderSubTypeLabel", function () {
		IX.ns('Hualala.TypeDef');
		var filterFn = function (t) {
			if (_.isEmpty(t)) return '';
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
			// IX.Debug.info("Run Count: ");
   //          IX.Debug.info(window.count++);
			var ret = _.find(channels, function (channel) {
				return v == _.result(channel, 'channelCode');
			});
			return _.isUndefined(ret) ? '空' : _.result(ret, 'channelName');
		};
		return filterFn;
	});

	// 格式化时间显示
	app.filter("formatDateTimeStr", function () {
		var filterFn = function (v, format) {
			// IX.Debug.info(v);
			// IX.Debug.info(format);
			var dateStr = Hualala.Common.formatDateTimeValue(v);

			return _.isEmpty(dateStr) ? '' : IX.Date.getDateByFormat(dateStr, 'yyyy/MM/dd HH:mm:ss');

		};
		return filterFn;
	});

	// 格式化货币显示
	app.filter("mycurrency", function () {
		var filterFn = function (v, format) {
			// IX.Debug.info(v);
			// IX.Debug.info(format);
			var dataStr = Hualala.Common.Math.standardPrice(v),
				currencyPrefix = format || '$';

			return _.isEmpty(dataStr) ? '' : currencyPrefix + dataStr;

		};
		return filterFn;
	});
});