define(['app'], function(app)
{
	app.controller('DingDanViewController',
    [
        '$scope',

        function($scope)
        {
            $scope.page =
            {
                heading: '订单'
            };
        }
    ]);
});