angular
	.module('app')
	.factory('allListsService', allListsService);

function allListsService(ListObject, $q, idGenerator, $rootScope) {

	var lists = [];
	var currentListId = undefined;
	var deleteTimer;
	var deleteDefer;
	var deletingListId;
	var deletingItemId;
	var fireRef = new Firebase("https://torrid-fire-6266.firebaseio.com/");
	localRetrieve();

	return {
		add: add,
		lists: lists,
		setCurrentList: setCurrentList,
		getCurrentList: getCurrentList,
		deleteList: deleteList,
		deleteItem: deleteItem,
		cancelDelete: cancelDelete,
		syncAll: syncAll,
		importList: importList,
	};

	function add() {
		lists.unshift(
			new ListObject(idGenerator.get(8), "New List "+(lists.length+1))
		);
		return lists[0];
	}

	function findListIndexById(id) {
		for (var i=0; i<lists.length; i++) {
			if (lists[i].id === id) {
				return i;
			}
		}
		return -1;
	}

	function updateItemData(item, values) {
		item.id = values.id;
		item.title = values.title;
		item.note = values.note;
		item.assign = values.assign;
		item.audio = values.audio;
		item.photo = values.photo;
		if (item.photo == "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2032%2032%22%20width%3D%2232%22%20height%3D%2232%22%20fill%3D%22black%22%3E%0A%20%20%3Ccircle%20transform%3D%22translate%288%200%29%22%20cx%3D%220%22%20cy%3D%2216%22%20r%3D%220%22%3E%20%0A%20%20%20%20%3Canimate%20attributeName%3D%22r%22%20values%3D%220%3B%204%3B%200%3B%200%22%20dur%3D%221.2s%22%20repeatCount%3D%22indefinite%22%20begin%3D%220%22%0A%20%20%20%20%20%20keytimes%3D%220%3B0.2%3B0.7%3B1%22%20keySplines%3D%220.2%200.2%200.4%200.8%3B0.2%200.6%200.4%200.8%3B0.2%200.6%200.4%200.8%22%20calcMode%3D%22spline%22%20/%3E%0A%20%20%3C/circle%3E%0A%20%20%3Ccircle%20transform%3D%22translate%2816%200%29%22%20cx%3D%220%22%20cy%3D%2216%22%20r%3D%220%22%3E%20%0A%20%20%20%20%3Canimate%20attributeName%3D%22r%22%20values%3D%220%3B%204%3B%200%3B%200%22%20dur%3D%221.2s%22%20repeatCount%3D%22indefinite%22%20begin%3D%220.3%22%0A%20%20%20%20%20%20keytimes%3D%220%3B0.2%3B0.7%3B1%22%20keySplines%3D%220.2%200.2%200.4%200.8%3B0.2%200.6%200.4%200.8%3B0.2%200.6%200.4%200.8%22%20calcMode%3D%22spline%22%20/%3E%0A%20%20%3C/circle%3E%0A%20%20%3Ccircle%20transform%3D%22translate%2824%200%29%22%20cx%3D%220%22%20cy%3D%2216%22%20r%3D%220%22%3E%20%0A%20%20%20%20%3Canimate%20attributeName%3D%22r%22%20values%3D%220%3B%204%3B%200%3B%200%22%20dur%3D%221.2s%22%20repeatCount%3D%22indefinite%22%20begin%3D%220.6%22%0A%20%20%20%20%20%20keytimes%3D%220%3B0.2%3B0.7%3B1%22%20keySplines%3D%220.2%200.2%200.4%200.8%3B0.2%200.6%200.4%200.8%3B0.2%200.6%200.4%200.8%22%20calcMode%3D%22spline%22%20/%3E%0A%20%20%3C/circle%3E%0A%3C/svg%3E") {
			item.photo = undefined;
		}
		item.done = values.done;
		item.lastEdited = values.lastEdited;
	}

	function getDataOnlyItem(original) {
		var item = {};
		updateItemData(item, original);
		for (var key in item) {
			if (item[key] === null || item[key] === undefined) {
				delete item[key];
			}
		}
		return item;
	}

	function getDataOnlyList(id) {
		var list = lists[findListIndexById(id)];
		var textOnlyList = [];
		for (var i=0; i<list.items.length; i++) {
			textOnlyList.push(getDataOnlyItem(list.items[i]));
		}
		return textOnlyList;
	}

	function deleteList(id) {
		// Set list status for deletion
		var index = findListIndexById(id);
		if (index >= 0) {
			lists[index].deleting = true;
			currentListId = '';
		}
		// delete delay
		deletingListId = id;
		deleteDefer = $q.defer();
		deleteTimer = setTimeout(function() {
			// get index again, as it may have changed
			var index = findListIndexById(id);
			if (index >= 0) {
				lists.splice(index, 1);
				deleteDefer.resolve('deleted');
			} else {
				deleteDefer.reject('listNotFound');
			}
			deletingListId = undefined;
		}, 5000);
		return deleteDefer.promise;
	}

	function deleteItem(id) {
		// Set list status for deletion
		var index = getCurrentList().getItemIndexById(id);
		if (index >= 0) {
			getCurrentList().items[index].deleting = true;
		}
		// delete delay
		deletingItemId = id;
		deletingListId = getCurrentList().id; // store list id in case current list is changed
		deleteDefer = $q.defer();
		deleteTimer = setTimeout(function() {
			// get index again, as it may have changed
			var listIndex = findListIndexById(deletingListId);
			if (listIndex >= 0) {
				var index = lists[listIndex].getItemIndexById(id);
				if (index >= 0) {
					lists[listIndex].items.splice(index, 1);
					deleteDefer.resolve('deleted');
				} else {
					deleteDefer.reject('listNotFound');
				}
			}
			deletingItemId = undefined;
		}, 5000);
		return deleteDefer.promise;
	}

	function cancelDelete() {
		clearTimeout(deleteTimer);
		if (deletingItemId) {
			var list = lists[findListIndexById(deletingListId)];
			var index = list.getItemIndexById(deletingId);
			if (index >= 0) {
				list.items[index].deleting = false;
			}
			deletingItemId = undefined;
		} else {
			var index = findListIndexById(deletingId);
			if (index >= 0) {
				lists[index].deleting = false;
			}
			deletingListId = undefined;
		}
		deleteDefer.reject('deleteCancelled');
	}

	function setCurrentList(list) {
		if (typeof list === 'number') {
			currentListId = findListIndexById(list);
		} else if (typeof list === 'object') {
			currentListId = list.id;
		} else {
			console.warn('unknown input for list: '+ typeof list);
			console.warn(list);
		}
	}

	function getCurrentList() {
		try {
			return lists[findListIndexById(currentListId)];
		} catch(e) {
			console.warn('List not found. ID: '+currentListId);
			console.warn(lists);
			return false;
		}
	}

	function importList(id) {
		var listRef = fireRef.child(id);
		var list;
		var localIndex = findListIndexById(id);
		if (localIndex < 0) {
			lists.unshift(new ListObject(id, 'Synchronising...'))
			list = lists[0];
		} else {
			list = lists[localIndex];
		}
		listRef.once('value', function(snapshot) {
			list.name = snapshot.val().name;
			angular.forEach(snapshot.val().items, function(value, key) {
				updateItem(value);
			});
			$rootScope.$broadcast('firebaseSync');
		});
		listRef.child('name').on('value', function(snapshot) {
			list.name = snapshot.val();
			$rootScope.$broadcast('firebaseSync');
		});
		listRef.child('items').on('child_changed', function(snapshot) {
			updateItem(snapshot.val())
			$rootScope.$broadcast('firebaseSync');
		});
		function updateItem(item) {
			var localItemIndex = list.getItemIndexById(item.id);
			if (localItemIndex < 0) {
				list.items.push(getDataOnlyItem(item));
			} else {
				if (list.items[localItemIndex] != item) {
					updateItemData(list.items[localItemIndex], item);
				}
			}
		}
	}

	function localRetrieve() {
		var retrieved = localStorage.getItem('Baskets');
		if (retrieved) {
			var parsed = JSON.parse(retrieved);
			for (var i=0; i<parsed.length; i++) {
				var list = new ListObject(parsed[i].id, parsed[i].name);
				list.items = parsed[i].items;
				lists.push(list);
				importList(list.id);
			}
		}
	}

	function localSave() {
		var json = JSON.stringify(lists);
		if (localStorage.getItem('Baskets') !== json) {
			try {
				localStorage.setItem('Baskets', json);
				return true;
			} catch(e) {
				console.warn('Cannot store data to local storage: '+e);
			}
		}
		return false;
	}

	function syncAll() {
		if (localSave()) {
			syncCurrentList();
		}
	}

	function syncCurrentList() {
		if (getCurrentList()) {
			var items = getDataOnlyList(getCurrentList().id);
			fireRef.child(getCurrentList().id).child('name').set(getCurrentList().name);
			for (var i=0; i<items.length; i++) {
				fireRef.child(getCurrentList().id).child('items').child(items[i].id).update(items[i]);
			}
		}
	}
}