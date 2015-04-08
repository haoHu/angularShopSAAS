define(['app'], function(app)
{
	app.controller('DianDanViewController',
    [
        '$scope',

        function($scope)
        {
            $scope.page =
            {
                heading: '点单'
            };
        }
    ]);
});