define(['app'], function(app){
	IX.ns("Hualala.Global");

	var ajaxEngine = Hualala.ajaxEngine;
	var AjaxMappingURLs = Hualala.Global.AjaxMappingURLs;
	// /**
	//  * 接口库的维护
	//  * @type {Array}	[apiName, apiPath, urlType, method]
	//  */
	// var AjaxMappingURLs = [
	// 	// 门店注册接口
	// 	["shopRegister", "/saas/shopReg.ajax", "", "POST"],
	// 	// 门店用户登录接口
	// 	["empLogin", "/saas/emp/Login.ajax", "", "POST"],
	// 	// 门店用户注销
	// 	["empLogout", "/saas/emp/Logout.ajax", "", "POST"],
	// 	// 门店用户修改密码
	// 	["empModifyPWD", "/saas/emp/ModifyPWD.ajax", "", "POST"],
	// 	// 门店用户重置密码
	// 	["empResetPWD", "/saas/emp/ResetPWD.ajax", "", "POST"]
	// ];
	// Hualala.Global.AjaxMappingURLs = AjaxMappingURLs;

	// 接口配置注册
	ajaxEngine.mappingUrls(AjaxMappingURLs);

	/**
	 * 生成ajax接口服务
	 * @return {undefined} 
	 */
	function initServiceRoutes() {
		var ajaxAPICfgs = ajaxEngine.getAll();
		
		app.factory('CommonCallServer', ['$http', function ($http) {
			var ret = {};
			var doRequest = function (pdata, apiCfg) {
				var name = apiCfg.name, url = apiCfg.url, 
					urlType = apiCfg.urlType || 'ajax', type = apiCfg.type;
				var ajaxUrl = Hualala.Global.AJAX_DOMAIN + url;
				return $http({
					method : type,
					url : ajaxUrl,
					data : JSON.stringify(pdata),
					headers : {
						"Content-Type" : "application/json; charset=UTF-8"
					}
				});
			};
			_.each(ajaxAPICfgs, function (apiCfg) {
				ret[apiCfg.name] = (function (_apiCfg) {
					return function (pdata) {
						return doRequest(pdata, _apiCfg);
					};
				})(apiCfg);
			});
			return ret;
		}]);
	}

	initServiceRoutes();
});