define([], function () {
	return {
		defaultRoutePaths : '/',
		routes : {
			// 欢迎
			'/' : {
				templateUrl : 'js/home/home.html',
				dependencies : [
					'home/HomeViewController'
				]
			},
			// 接单
			'/jiedan' : {
				templateUrl : 'js/jiedan/jiedan.html',
				dependencies : [
					'jiedan/JieDanViewController',
					'directives/appDirectives'
				]
			},
			// 快餐点单
			'/snack' : {
				templateUrl : 'js/diandan/snack.html',
				dependencies : [
					'diandan/SnackViewController',
					'directives/appDirectives',
					'services/appServices'
				]
			},
			// 正餐桌台选择
			'/dinner/table' : {
				templateUrl : 'js/diandan/table.html',
				dependencies : [
					'diandan/TableViewController',
					'directives/appDirectives'
				]
			},
			// 正餐点菜
			'/dinner/:tableID' : {
				templateUrl : 'js/diandan/dinner.html',
				dependencies : [
					'diandan/DinnerViewController',
					'directives/appDirectives'
				]
			},
			'/dingdan' : {
				templateUrl : 'js/dingdan/dingdan.html',
				dependencies : [
					'dingdan/DingDanViewController',
					'directives/appDirectives'
				]
			},
			'/huiyuan' : {
				templateUrl : 'js/huiyuan/huiyuan.html',
				dependencies : [
					'huiyuan/HuiYuanViewController',
					'directives/appDirectives'
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
					'directives/appDirectives'
				]
			},
			'/signup' : {
				templateUrl : 'js/signup/signup.html',
				dependencies : [
					'signup/SignupViewController',
					'directives/appDirectives'
				]
			}
		}
	};
});