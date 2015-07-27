define(['app'], function(app){
	IX.ns("Hualala.Global");

	var ajaxEngine = Hualala.ajaxEngine;
	var AjaxMappingURLs = Hualala.Global.AjaxMappingURLs;
	var pendingRequests = {};
	var storePendingRequest = function (name, pdata, apiCfg) {
		pendingRequests[name] = {
			pdata : pdata,
			apiCfg : apiCfg
		};
	};
	// var AjaxDomain = window.HualalaWorkMode == 'dev' ? 'http://10.10.2.15:8080' : Hualala.Global.AJAX_DOMAIN;

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
		
		app.factory('CommonCallServer', ['$http', '$location', function ($http, $location) {
			var ret = {};
			var doRequest = function (pdata, apiCfg) {
				var AjaxDomain = Hualala.Global.AJAX_DOMAIN;
				var name = apiCfg.name, url = apiCfg.url, 
					urlType = apiCfg.urlType || 'ajax', type = apiCfg.type;
				var ajaxUrl = AjaxDomain + url;
				var params = !pdata ? {} : pdata;
				console.info(params);
				// 由于Angular采用postJSON方式发送数据到后台，所以form-data字段会变成json字符串
				// 处理方法就是Angular中使用transformRequest，进行转换，利用jQuery的$.param将postJOSN解析成paras
				var transFn = function (data) {
					return $.param(data);
				};
				// 防止重复ajax请求
				if (_.isEmpty(pendingRequests[name])) {
					storePendingRequest(name, pdata, apiCfg);
				} else {
					return null;
				}
				return $http({
					method : type,
					url : ajaxUrl,
					// data : JSON.stringify(params),
					data : params,
					headers : {
						// "Content-Type" : "application/json; charset=UTF-8"
						"Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8",
						// "X-Requested-With" : "XMLHttpRequest",
						"Accept" : "*/*"
					},
					transformRequest : transFn,
					withCredentials : true
				}).success(function (data) {
					var code = _.result(data, 'code');
					pendingRequests[name] = null;
					if (code == 'CS002') {
						$location.path('/signin');
					}
				}).error(function (data) {
					pendingRequests[name] = null;
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