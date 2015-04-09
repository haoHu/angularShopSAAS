/*jshint unused: vars */
define(['angular', 'angular-route', 'app'], function (angular, route, app) {
	'use strict';

	describe('Controller: HomeViewController', function () {
		beforeEach(module('app.controllers.HomeViewController'));
		var MainCtrl, scope;
		beforeEach(inject(function ($controller, $rootScope) {
			scope = $rootScope.$new();
			MainCtrl = $controller('HomeViewController', {
				$scope : scope
			});
		}));
		it('should scope.page is object', function () {
			expect(typeof scope.page).toBe('object');
		});
	});
});