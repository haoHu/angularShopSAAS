(function () {
	IX.ns("Hualala.Constants");
	
	IX.extend(Hualala.Constants, {
		NameOfDay : ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
		SecondsOfHour : 3600,
		SecondsOfDay : 24 * 3600,
		SecondsOfWeek : 7 * 24 * 3600,
		NumberKeys : [1,2,3,4,5,6,7,8,9,0],
		Alphabet : 'abcdefghijklmnopqrstuvwxyz'.split(''),
		PersonUnit : "人",
		CashUnit : "元",
		OrderUnit : "单"
	});
})();
(function () {
	IX.ns("Hualala.TypeDef");
	Hualala.TypeDef.ResponseCodes = {
		"000" : '服务成功',
		"404" : '没有找到文件或目录',
		"500" : "内部服务器错误",
		"SY001" : "无法连接云端服务器",
		"SY002" : "云端服务器返回错误",
		"SY003" : "请求云端服务器超时",
		"CS001" : "门店服务器未注册",
		"CS002" : "未登录，不能访问当前页面",
		"CS003" : "登录失败",
		"CS004" : "无权访问"
	};
	Hualala.TypeDef.CommonErrorMsgs = {
		"connect_faild" : "通信失败，请稍后再试"
	};

	// 营业模式
	Hualala.TypeDef.ShopOperationMode = [
		{value : 0, name : 'dinner', label : '正餐'},
		{value : 1, name : 'snack', label : '快餐'},
		{value : 2, name : 'stall', label : '美食广场'}
	];

	/**
	 * 订单类型
	 * 0 : 堂食；20：外卖；21： 自提
	 */
	Hualala.TypeDef.OrderSubTypes = {
		"0" : {value : 0,  label : '堂食', name : "INNER"},
		"20" : {value : 20, label : '外卖', name : "TAKEOUT"},
		"21" : {value : 21, label : '自提', name : "PICKUP"}
	};

	/**
	 * 菜品制作状态
	 * @type {Array} {value, name, label}
	 */
	Hualala.TypeDef.FoodMakeStatus = [
		{value : 0, label : '等', name : 'wait'},
		{value : 1, label : '即', name : 'immediate'},
		{value : 2, label : '急', name : 'urgent'},
		{value : 3, label : '上', name : 'up'}
	];

	/**
	 * 点菜订单菜品条目记录类型
	 * 0:点菜；1：退餐；2：赠菜
	 */
	Hualala.TypeDef.OrderFoodItemType = {
		ORDER : 0,
		CANCEL : 1,
		SEND : 2
	};

	Hualala.TypeDef.OrderNoteTypes = [
		{name : "orderRemark", value : "10", label : "点单备注"},
		{name : "foodMethod", value : "20", label : "作法"},
		{name : "foodRemark", value : "30", label : "口味"},
		{name : "foodCancel", value : "40", label : "退菜原因"},
		{name : "foodSend", value : "50", label : "赠菜原因"},
		{name : "foodPrice", value : "60", label : "改价原因"},
		{name : "orderChange", value : "70", label : "改单原因"},
		{name : "orderCancel", value : "80", label : "预订退订原因"},
		{name : "takeoutCancel", value : "90", label : "外卖退单原因"}
	];

	Hualala.TypeDef.OrderPaySubjectGroups = [
		{name : "sendFoodPromotionPay", value : "51010501", isPrefix : "0", label : "账单赠送"},
		{name : "vipPricePromotionPay", value : "51010502", isPrefix : "0", label : "会员价优惠"},
		{name : "discountPay", value : "51010503", isPrefix : "0", label : "账单折扣"},
		{name : "wipeZeroPay", value : "51010504", isPrefix : "0", label : "账单元整"},
		{name : "remissionPay", value : "51010505", isPrefix : "0", label : "账单减免"},
		{name : "cashPay", value : "10010", isPrefix : "1", label : "现金"},
		{name : "vipCardPay", value : "510106", isPrefix : "1", label : "会员卡"},
		{name : "bankCardPay", value : "10020", isPrefix : "1", label : "银行存款"},
		{name : "hualalaPay", value : "11311000", isPrefix : "0", label : "哗啦啦"},
		{name : "groupBuyPay", value : "11310", isPrefix : "1", label : "团购"},
		{name : "voucherPay", value : "51010507", isPrefix : "0", label : "代金券"},
		{name : "hangingPay", value : "11312", isPrefix : "1", label : "挂账"}
	];
})();