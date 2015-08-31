angular
	.module('app')
	.factory('allListsService', allListsService);

function allListsService(ListObject, $q, idGenerator, $rootScope, $timeout) {

	var lists = [];
	var currentListId = undefined;
	var deleteTimer;
	var deleteDefer;
	var deletingListId;
	var deletingItemId;
	var fireRef;
	if (window.Firebase) {
		fireRef = new Firebase("https://torrid-fire-6266.firebaseio.com/");
	}
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
		if (item.photo == "./img/loading-bubbles.svg") {
			item.photo = undefined;
		}
		item.done = values.done;
		item.lastEdited = values.lastEdited;
		item.deleting = values.deleting;
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

	function deleteList(id, immediate) {
		// Set list status for deletion
		var index = findListIndexById(id);
		if (index >= 0) {
			lists[index].deleting = true;
			currentListId = '';
		}
		// delete delay
		var delay = 5000;
		if (!immediate) delay = 0;
		deletingListId = id;
		deleteDefer = $q.defer();
		deleteTimer = $timeout(function() {
			// get index again, as it may have changed
			var index = findListIndexById(id);
			if (index >= 0) {
				lists.splice(index, 1);
				deleteDefer.resolve('deleted');
			} else {
				deleteDefer.reject('listNotFound');
			}
			deletingListId = undefined;
		}, delay);
		return deleteDefer.promise;
	}

	function deleteItem(id, immediate) {
		// Set list status for deletion
		var index = getCurrentList().getItemIndexById(id);
		if (index >= 0) {
			getCurrentList().items[index].deleting = true;
		}
		// delete delay
		deletingItemId = id;
		deletingListId = getCurrentList().id; // store list id in case current list is changed
		deleteDefer = $q.defer();
		var delay = 5000;
		if (!immediate) delay = 0;
		deleteTimer = $timeout(function() {
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
		}, delay);
		return deleteDefer.promise;
	}

	function cancelDelete() {
		$timeout.cancel(deleteTimer);
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
		var list;
		var localIndex = findListIndexById(id);
		if (localIndex < 0) {
			lists.unshift(new ListObject(id, 'Synchronising...'))
			list = lists[0];
		} else {
			list = lists[localIndex];
		}
		if (window.Firebase) {
			var listRef = fireRef.child(id);
			listRef.once('value', function(snapshot) {
				if (snapshot.val()) { // if list exists
					list.name = snapshot.val().name;
					angular.forEach(snapshot.val().items, function(value, key) {
						updateItem(value);
					});

					listRef.child('name').on('value', function(snapshot) {
						list.name = snapshot.val();
						$rootScope.$broadcast('firebaseSync');
					});
					listRef.child('items').on('child_changed', function(snapshot) {
						updateItem(snapshot.val())
						$rootScope.$broadcast('firebaseSync');
					});
				} else {
					list.name = 'New List '+lists.length;
				}
				$rootScope.$broadcast('firebaseSync');
			});
		}
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
				if (!parsed[i].deleting) {
					var list = new ListObject(parsed[i].id, parsed[i].name);
					list.items = parsed[i].items;
					lists.push(list);
					importList(list.id);
				}
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
			if (window.Firebase) {
				fireRef.child(getCurrentList().id).child('name').set(getCurrentList().name);
				for (var i=0; i<items.length; i++) {
					fireRef.child(getCurrentList().id).child('items').child(items[i].id).update(items[i]);
				}
			}
		}
	}
}