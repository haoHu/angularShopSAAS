define(['app'], function(app)
{
	app.controller('BaoBiaoViewController',
    [
        '$scope',

        function($scope)
        {
            $scope.page =
            {
                heading: '报表'
            };
        }
    ]);
});