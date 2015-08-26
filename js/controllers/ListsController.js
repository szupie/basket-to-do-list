angular
	.module('app')
	.controller('ListsController', ListsController);

function ListsController(allListsService) {
	
	this.lists = allListsService.lists;

	this.addList = function() {
		allListsService.setCurrentList(allListsService.add());
	};

	this.currentList = allListsService.getCurrentList;

}