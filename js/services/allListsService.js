angular
	.module('app')
	.factory('allListsService', allListsService);

function allListsService() {

	var lists = [];

	return {
		add: add,
		lists: lists
	};

	function add() {
		lists.push( {
			id: getUniqId(),
			name: "New List "+(lists.length+1)
		} );
	}

	function getUniqId() {
		var length = 8;
		return (Math.floor(Math.random()*Math.pow(36,length)).toString(36)).slice(-length);
	}
}