angular
	.module('app')
	.factory('ItemObject', ItemObject);

function ItemObject() {

	var itemObject = function() {
		this.title = 'lol';
		this.note = 'wtf';
	}

	return itemObject;

}