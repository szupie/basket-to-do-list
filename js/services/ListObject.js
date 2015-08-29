angular
	.module('app')
	.factory('ListObject', ListObject);

function ListObject(ItemObject) {

	var listObject = function(id, name) {
		this.id = id;
		this.name = name;
		this.items = [];
		this.addItem = addItem;
		this.getItemIndexById = getItemIndexById;
		this.getDescription = getDescription;
	}
	var nextItemId = 0;

	function addItem() {
		this.items.unshift(new ItemObject(nextItemId++));
	}

	function getItemIndexById(id) {
		for (var i=0; i<this.items.length; i++) {
			if (this.items[i].id === id) {
				return i;
			}
		}
	}

	function getDescription() {
		return this.items.map(function(item) { if (!item.done) return item.title })
						.filter(function(val) { return val; })// get non-empty items
						.join(', ');
	}

	return listObject;

}