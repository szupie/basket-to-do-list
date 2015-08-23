angular
	.module('app')
	.controller('ListsController', ListsController);

function ListsController(listService) {
	
	this.lists = listService.lists;

	this.addList = listService.add;

}