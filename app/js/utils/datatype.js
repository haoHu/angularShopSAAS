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
		{id : 0, name : 'dinner', label : '正餐'},
		{id : 1, name : 'snack', label : '快餐'},
		{id : 2, name : 'stall', label : '美食广场'}
	];
})();