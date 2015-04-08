define(['app'], function(app)
{
	app.controller('SigninViewController',
    [
        '$scope',

        function($scope)
        {
            $scope.page =
            {
                heading: 'Signin'
            };
        }
    ]);
});