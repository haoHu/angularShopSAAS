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
		["getSoldOutFoodLst", "/saas/base/getSoldOutFoodLst.ajax", "", "POST"],
		// 根据订单Key获取订单详情数据
		["getOrderByOrderKey", "/saas/order/getOrderByOrderKey.ajax", "", "POST"],
		// 修改订单头消息
		["updateOrderHead", "/saas/order/updateOrderHead.ajax", "", "POST"],
		// 提交订单服务
		["submitOrder", "/saas/order/submitOrder.ajax", "", "POST"],
		// 已落单菜品操作
		["foodOperation", "/saas/order/foodOperation.ajax", "", "POST"],
		// 获取支付科目列表字典信息
		["getPaySubjectLst", "/saas/base/getPaySubjectLst.ajax", "", "POST"],
		// 获取订单打折方案列表
		["getDiscountRuleLst", "/saas/base/getDiscountRuleLst.ajax", "", "POST"],

		// 获取会员卡信息
		["getVIPCardInfo", "/crm/card/get.ajax", "", "POST"],
		// 会员卡扣款操作
		["cardDeductMoney", "/crm/card/deductMoney.ajax", "", "POST"],
		// 会员卡交易撤销
		["cardTransRevoke", "/crm/card/transRevoke.ajax", "", "POST"],

		// 获取桌台及状态列表
		["getTableStatusLst", "/saas/order/getTableStatusLst.ajax", "", "POST"],
		// 桌台操作
		["tableOperation", "/saas/order/tableOperation.ajax", "", "POST"],

		// 获取订单列表
		["getLocalOrderLst", "/saas/order/getLocalOrderLst.ajax", "", "POST"],
		// 获取云端订单列表
		["getCloudOrderLst", "/saas/order/getCloudOrderLst.ajax", "", "POST"],
		// 确认网上订单服务
		["acceptCloudOrder", "/saas/order/accept.ajax", "", "POST"]
	];
	Hualala.Global.AjaxMappingURLs = AjaxMappingURLs;
	return AjaxMappingURLs;
});