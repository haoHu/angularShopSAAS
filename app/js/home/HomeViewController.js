define(['app'], function(app)
{
	app.controller('HomeViewController',
    [
        '$scope',

        function($scope)
        {
            $scope.page =
            {
                heading: 'Welcome'
            };
        }
    ]);
});