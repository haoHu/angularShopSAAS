define([], function () {
	return {
		defaultRoutePaths : '/',
		routes : {
			// 欢迎
			'/' : {
				templateUrl : 'js/home/home.html',
				dependencies : [
					'home/HomeViewController',
					'services/appServices'
				]
			},
			// 接单
			'/jiedan' : {
				templateUrl : 'js/jiedan/jiedan.html',
				dependencies : [
					'jiedan/JieDanViewController',
					'directives/appDirectives',
					'services/appServices',
					'services/orderServices',
					'services/tableServices',
					'filters/appFilters'
				]
			},
			// 快餐点单
			'/snack' : {
				templateUrl : 'js/diandan/dinner.html',
				dependencies : [
					// 'diandan/SnackViewController',
					'diandan/DinnerViewController',
					'directives/appDirectives',
					'services/appServices',
					'services/orderServices',
					'services/foodMenuServices',
					'filters/appFilters'
				]
			},
			// 正餐桌台选择
			'/dinner/table' : {
				templateUrl : 'js/diandan/table.html',
				dependencies : [
					'diandan/TableViewController',
					'directives/appDirectives',
					'services/appServices',
					'services/orderServices',
					'services/tableServices',
					'filters/appFilters'
				]
			},
			// 正餐点菜
			'/dinner/:tableID' : {
				templateUrl : 'js/diandan/dinner.html',
				dependencies : [
					'diandan/DinnerViewController',
					'directives/appDirectives',
					'services/appServices',
					'services/orderServices',
					'services/foodMenuServices',
					'filters/appFilters'
				]
			},
			'/dingdan' : {
				templateUrl : 'js/dingdan/dingdan.html',
				dependencies : [
					'dingdan/DingDanViewController',
					'directives/appDirectives',
					'services/appServices',
					'services/orderServices',
					'filters/appFilters'
				]
			},
			'/huiyuan' : {
				templateUrl : 'js/huiyuan/huiyuan.html',
				dependencies : [
					'huiyuan/HuiYuanViewController',
					'directives/appDirectives',
					'services/appServices',
					'filters/appFilters'
				]
			},
			'/baobiao' : {
				templateUrl : 'js/baobiao/baobiao.html',
				dependencies : [
					'baobiao/BaoBiaoViewController',
					'directives/appDirectives'
				]
			},
			'/signin' : {
				templateUrl : 'js/signin/signin.html',
				dependencies : [
					'signin/SigninViewController',
					'services/appServices',
					'directives/appDirectives'
				]
			},
			'/signup' : {
				templateUrl : 'js/signup/signup.html',
				dependencies : [
					'signup/SignupViewController',
					'services/appServices',
					'directives/appDirectives'
				]
			},
			'/more' : {
				templateUrl : 'js/profile/more.html',
				dependencies : [
					'profile/moreViewController',
					'services/appServices',
					'directives/appDirectives'
				]
			},
			'/more/soldout' : {
				templateUrl : 'js/profile/soldout.html',
				dependencies : [
					'profile/soldoutViewController',
					'services/appServices',
					'directives/appDirectives',
					'filters/appFilters',
					'services/orderServices',
					'services/foodMenuServices'
				]
			}
		}
	};
});