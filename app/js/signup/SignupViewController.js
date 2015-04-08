define(['app'], function(app)
{
	app.controller('SignupViewController',
    [
        '$scope',

        function($scope)
        {
            $scope.page =
            {
                heading: 'Signup'
            };
        }
    ]);
});