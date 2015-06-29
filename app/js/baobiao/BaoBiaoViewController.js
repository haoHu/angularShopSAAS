define(['app'], function(app)
{
	app.controller('BaoBiaoViewController', [
		'$scope', '$rootScope', '$modal', '$location', '$filter', '$timeout', 'storage', 'CommonCallServer', 'AppAlert',
		function($scope, $rootScope, $modal, $location, $filter, $timeout, storage, CommonCallServer, AppAlert) {
			IX.ns("Hualala");
			var HC = Hualala.Common;
			$scope.curPageType = _.isEmpty(_.result($location.search(), 'tab')) ? 'biz' : _.result($location.search(), 'tab');
			
			
		}
	]);
});