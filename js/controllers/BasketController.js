angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($scope, allListsService) {
	var vm = this;

	vm.newList = addNewList;
	$scope.$on("currentListChanged", function(event, args) {
		$scope.$apply(vm.currentList = args.list);
	});

	function addNewList() {
		vm.currentList = allListsService.add();
	}
}
