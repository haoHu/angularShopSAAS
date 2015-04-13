define(['IX'], function () {
	IX.ns("Hualala.Global");
	/**
	 * 接口库的维护
	 * @type {Array}	[apiName, apiPath, urlType, method]
	 */
	var AjaxMappingURLs = [
		// 门店注册接口
		["shopRegister", "/saas/shopReg.ajax", "", "POST"],
		// 门店用户登录接口
		["empLogin", "/saas/emp/Login.ajax", "", "POST"],
		// 门店用户注销
		["empLogout", "/saas/emp/Logout.ajax", "", "POST"],
		// 门店用户修改密码
		["empModifyPWD", "/saas/emp/ModifyPWD.ajax", "", "POST"],
		// 门店用户重置密码
		["empResetPWD", "/saas/emp/ResetPWD.ajax", "", "POST"]
	];
	Hualala.Global.AjaxMappingURLs = AjaxMappingURLs;
	return AjaxMappingURLs;
});