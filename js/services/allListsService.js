angular
	.module('app')
	.factory('allListsService', allListsService);

function allListsService(ListObject) {

	var lists = [];

	return {
		add: add,
		lists: lists
	};

	function add() {
		lists.unshift(
			new ListObject(getUniqId(), "New List "+(lists.length+1))
		);
		return lists[0];
	}

	function getUniqId() {
		var length = 8;
		return (Math.floor(Math.random()*Math.pow(36,length)).toString(36)).slice(-length);
	}
}