define(['app'], function(app)
{
	app.controller('JieDanViewController',
    [
        '$scope',

        function($scope)
        {
            $scope.page =
            {
                heading: '接单'
            };
        }
    ]);
});