angular
	.module('app')
	.factory('listService', listService);

function listService() {

	return {
		add: add
	};

	function add() {
		console.log('hi');
	}
}