define(['IX'], function () {
	IX.ns("Hualala.Global");
	/**
	 * 接口库的维护
	 * @type {Array}	[apiName, apiPath, urlType, method]
	 */
	var AjaxMappingURLs = [
		// 门店注册接口
		["shopRegister", "/test/shopReg.json", "", "GET"],
		// 门店用户登录接口
		["empLogin", "/test/emp/Login.json", "", "GET"],
		// 门店用户注销
		["empLogout", "/test/emp/Logout.ajax", "", "GET"],
		// 门店用户修改密码
		["empModifyPWD", "/test/emp/ModifyPWD.ajax", "", "GET"],
		// 门店用户重置密码
		["empResetPWD", "/test/emp/ResetPWD.ajax", "", "GET"]
	];
	Hualala.Global.AjaxMappingURLs = AjaxMappingURLs;
	return AjaxMappingURLs;
});