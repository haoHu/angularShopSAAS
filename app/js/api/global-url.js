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
		["empResetPWD", "/saas/emp/ResetPWD.ajax", "", "POST"],
		// 获取店铺信息
		["getShopInfo", "/saas/base/getShopInfo.ajax", "", "POST"],

		// 获取渠道列表
		["getChannelLst", "/saas/base/getChannelLst.ajax", "", "POST"],
		// 获取订单字典表
		["getOrderNotesLst", "/saas/base/getOrderNotesLst.ajax", "", "POST"],
		// 获取菜单列表数据
		["getFoodLst", "/saas/base/getFoodLst.ajax", "", "POST"],
		// 获取沽清列表
		["getSoldOutFoodLst", "/bass/getSoldOutFoodLst.ajax", "", "POST"],
		// 根据订单Key获取订单详情数据
		["getOrderByOrderKey", "/saas/order/getOrderByOrderKey.ajax", "", "POST"],
		// 修改订单头消息
		["updateOrderHead", "/saas/order/updateOrderHead.ajax", "", "POST"]
	];
	Hualala.Global.AjaxMappingURLs = AjaxMappingURLs;
	return AjaxMappingURLs;
});