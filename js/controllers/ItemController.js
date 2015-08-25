angular
	.module('app')
	.controller('ItemController', ItemController);

function ItemController() {
	var vm = this;

	vm.deselect = deselect;
	vm.edit = edit;

	function deselect() {
		vm.editing = '';
	}

	function edit(mode) {
		vm.editing = mode;
	}

}