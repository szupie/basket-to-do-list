angular
	.module('app')
	.factory('ListObject', ListObject);

function ListObject(ItemObject) {

	var listObject = function(id, name) {
		this.id = id;
		this.name = name;
		this.items = [];
		this.addItem = addItem;
	}

	function addItem() {
		this.items.unshift(new ItemObject());
	}

	return listObject;

}