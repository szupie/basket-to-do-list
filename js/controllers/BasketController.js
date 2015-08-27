angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($mdSidenav) {
	var vm = this;
	vm.toggleListsView = toggleListsView;
	vm.closeListsView = closeListsView;

	function toggleListsView() {
		$mdSidenav('left').toggle();
	}

	function closeListsView() {
		$mdSidenav('left').close();
	}
}
