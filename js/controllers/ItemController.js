angular
	.module('app')
	.controller('ItemController', ItemController);

function ItemController(allListsService) {
	var vm = this;
	vm.fabIsOpen = false;
	vm.searchName = searchName;

	function searchName(query) {
		var allItems = allListsService.getCurrentList().items;
		var names = [query];
		// get list of all unique names
		for (var i=0; i<allItems.length; i++) {
			var name = allItems[i].assign;
			if (name && names.indexOf(name) < 0) { // if name isn't already in list
				names.push(name);
			}
		}
		// find matched names
		var matches = names.filter(function(name) {
			return name.toLowerCase().indexOf(query.toLowerCase()) === 0;
		});
		return matches;
	}
}
