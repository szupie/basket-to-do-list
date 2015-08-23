angular
	.module('app')
	.controller('ListsController', ListsController);

function ListsController(listService) {
	
	this.addList = listService.add;
	
}