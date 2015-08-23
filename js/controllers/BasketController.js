angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($scope) {
	var vm = this;

	$scope.$on("currentListChanged", function(event, args) {
		$scope.$apply(vm.currentList = args.list);
	});
}
