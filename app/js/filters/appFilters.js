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
			if (v == '0' || _.isEmpty(v)) return '';
			var dateStr = Hualala.Common.formatDateTimeValue(v),
				f = format || 'yyyy/MM/dd HH:mm:ss';

			return _.isEmpty(dateStr) ? '' : IX.Date.getDateByFormat(dateStr, f);

		};
		return filterFn;
	});

	// 格式化至今时间间隔显示
	app.filter("formatTimeInterval", function () {
		var filterFn = function (v) {
			if (v == '0' || _.isEmpty(v)) return '';
			var dateStr = Hualala.Common.formatDateTimeValue(v),
				f = 'yyyy/MM/dd HH:mm:ss';
			var timeSec = IX.Date.getTimeTickInSec(IX.Date.getDateByFormat(dateStr, f));
			var curTime = (new Date()).getTime();
			var ret = IX.Date.getDateText(timeSec, curTime / 1000);
			return ret;
		};
		return filterFn;
	});

	// 格式化货币显示
	app.filter("mycurrency", function () {
		var filterFn = function (v, format) {
			// IX.Debug.info(v);
			// IX.Debug.info(format);
			var dataStr = Hualala.Common.Math.prettyPrice(v),
				currencyPrefix = format || '$';

			return _.isEmpty(dataStr) ? '' : currencyPrefix + dataStr;

		};
		return filterFn;
	});

	// VIP会员卡状态
	app.filter("vipCardStatus", function () {
		IX.ns("Hualala");
		var filterFn = function (v) {
			var items = Hualala.TypeDef.VIPCardStatus;
			var status = _.find(items, function (item) {
				return _.result(item, 'value') == v;
			});
			return _.result(status, 'label', '');
		};
		return filterFn;
	});

	// 用户性别显示
	app.filter("gender", function() {
		IX.ns("Hualala");
		var filterFn = function (v) {
			var items = Hualala.TypeDef.GENDER;
			var gender = _.find(items, function (item) {
				return _.result(item, 'value') == v;
			});
			return _.result(gender, 'label', '');
		};
		return filterFn;
	});
});