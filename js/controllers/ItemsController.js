angular
	.module('app')
	.controller('ItemsController', ItemsController);

function ItemsController($scope) {
	var vm = this;

	vm.addItem = addItem;
	vm.getCurrentList = function() { return main.currentList; };


	var main = $scope.Main;

	function addItem() {
		if (!vm.getCurrentList()) {
			main.newList();
		}
		vm.getCurrentList().addItem();
	}

}