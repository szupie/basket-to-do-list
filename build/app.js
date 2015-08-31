if (window.FileReader) {
	fileSupport = true;
}

var app = angular.module('app', ['ngMaterial'])
				.constant('support', {fileReader: fileSupport});

angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($mdSidenav, $mdMedia, allListsService, $mdToast, support, $scope, $mdDialog, shareService) {
	var vm = this;
	vm.toggleListsView = toggleListsView;
	vm.closeListsView = closeListsView;
	vm.deleteListById = deleteListById;
	vm.shareList = shareList;
	vm.support = support;

	// load/save data
	allListsService.syncAll();
	setInterval(allListsService.syncAll, 5000);

	$scope.$on('firebaseSync', function() {
		$scope.$apply();
	});

	if (location.hash.substring(1).indexOf('list=') === 0) {
		allListsService.importList(location.hash.substring(6));
	}
	window.importBasketList = allListsService.importList;

	function shareList(list, e) {
		$mdDialog.show(
			$mdDialog.alert()
					.clickOutsideToClose(true)
					.targetEvent(e)
					.title('Share '+list.name)
					.content('View and edit this list on any device at '+shareService.getLink(list))
		);
		//window.open(shareService.writeEmail(list));
	}

	// sidenav behaviour
	vm.$mdMedia = $mdMedia;
	if (!vm.$mdMedia('lg')) {
		vm.listsViewOpen = true;
	}
	function toggleListsView() {
		$mdSidenav('left').toggle();
	}
	function closeListsView() {
		$mdSidenav('left').close();
	}

	// Lists delete operations
	function deleteListById(id) {
		// show undo toast
		var deleteToast = $mdToast.simple().content('List Deleted').action('Undo').highlightAction(true);
		$mdToast.show(deleteToast).then(function(response) {
			if (response === 'ok') {
				undoDelete();
			}
		});
		// perform delete
		allListsService.deleteList(id).then(function() {
			$mdToast.hide();
		});
		// hide currently editing list
		$mdSidenav('left').open();
	}

	function undoDelete() {
		allListsService.cancelDelete();
	}
}
BasketController.$inject = ["$mdSidenav", "$mdMedia", "allListsService", "$mdToast", "support", "$scope", "$mdDialog", "shareService"];

angular
	.module('app')
	.controller('ItemsController', ItemsController);

function ItemsController(allListsService, $mdToast, $mdMedia) {
	var vm = this;

	vm.addItem = addItem;
	vm.getCurrentList = allListsService.getCurrentList;
	vm.deleteItem = deleteItem;
	vm.searchName = searchName;
	vm.getPhoto = getPhoto;

	function addItem() {
		if (!allListsService.getCurrentList()) {
			allListsService.setCurrentList(allListsService.add());
		}
		vm.getCurrentList().addItem();
	}

	function deleteItem(id) {
		// show undo toast
		var deleteToast = $mdToast.simple().content('Item Deleted').action('Undo').highlightAction(true);
		$mdToast.show(deleteToast).then(function(response) {
			if (response === 'ok') {
				undoDelete();
			}
		});
		// perform delete
		allListsService.deleteItem(id).then(function() {
			$mdToast.hide();
		});
	}

	function undoDelete() {
		allListsService.cancelDelete();
	}

	function searchName(query) {
		var allItems = allListsService.getCurrentList().items;
		var names = [query];
		// get list of all unique names
		for (var i=0; i<allItems.length; i++) {
			var name = allItems[i].assign;
			if (name && names.indexOf(name) < 0) { // if name isn't already in list
				names.push(name);
			}
		}
		// find matched names
		var matches = names.filter(function(name) {
			return name.toLowerCase().indexOf(query.toLowerCase()) === 0;
		});
		return matches;
	}

	function getPhoto(id, promise) {
		var list = allListsService.getCurrentList();
		var index = list.getItemIndexById(id);
		var loadingIcon = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2032%2032%22%20width%3D%2232%22%20height%3D%2232%22%20fill%3D%22black%22%3E%0A%20%20%3Ccircle%20transform%3D%22translate%288%200%29%22%20cx%3D%220%22%20cy%3D%2216%22%20r%3D%220%22%3E%20%0A%20%20%20%20%3Canimate%20attributeName%3D%22r%22%20values%3D%220%3B%204%3B%200%3B%200%22%20dur%3D%221.2s%22%20repeatCount%3D%22indefinite%22%20begin%3D%220%22%0A%20%20%20%20%20%20keytimes%3D%220%3B0.2%3B0.7%3B1%22%20keySplines%3D%220.2%200.2%200.4%200.8%3B0.2%200.6%200.4%200.8%3B0.2%200.6%200.4%200.8%22%20calcMode%3D%22spline%22%20/%3E%0A%20%20%3C/circle%3E%0A%20%20%3Ccircle%20transform%3D%22translate%2816%200%29%22%20cx%3D%220%22%20cy%3D%2216%22%20r%3D%220%22%3E%20%0A%20%20%20%20%3Canimate%20attributeName%3D%22r%22%20values%3D%220%3B%204%3B%200%3B%200%22%20dur%3D%221.2s%22%20repeatCount%3D%22indefinite%22%20begin%3D%220.3%22%0A%20%20%20%20%20%20keytimes%3D%220%3B0.2%3B0.7%3B1%22%20keySplines%3D%220.2%200.2%200.4%200.8%3B0.2%200.6%200.4%200.8%3B0.2%200.6%200.4%200.8%22%20calcMode%3D%22spline%22%20/%3E%0A%20%20%3C/circle%3E%0A%20%20%3Ccircle%20transform%3D%22translate%2824%200%29%22%20cx%3D%220%22%20cy%3D%2216%22%20r%3D%220%22%3E%20%0A%20%20%20%20%3Canimate%20attributeName%3D%22r%22%20values%3D%220%3B%204%3B%200%3B%200%22%20dur%3D%221.2s%22%20repeatCount%3D%22indefinite%22%20begin%3D%220.6%22%0A%20%20%20%20%20%20keytimes%3D%220%3B0.2%3B0.7%3B1%22%20keySplines%3D%220.2%200.2%200.4%200.8%3B0.2%200.6%200.4%200.8%3B0.2%200.6%200.4%200.8%22%20calcMode%3D%22spline%22%20/%3E%0A%20%20%3C/circle%3E%0A%3C/svg%3E";
		// set as loading icon on mobile
		promise.then(function(file){
			list.items[index].photo = file;
		}, null
		, function(update) {
			if (update === 'getting') {
				list.items[index].photo = loadingIcon;
			} else if (update === 'noImage') {
				if (list.items[index].photo == loadingIcon) {
					list.items[index].photo = undefined;
				}
			}
		});
	}

}
ItemsController.$inject = ["allListsService", "$mdToast", "$mdMedia"];
angular
	.module('app')
	.controller('ListsController', ListsController);

function ListsController(allListsService) {

	var vm = this;
	
	vm.lists = allListsService.lists;

	vm.addList = function() {
		allListsService.setCurrentList(allListsService.add());
	};

	vm.currentList = allListsService.getCurrentList;

}
ListsController.$inject = ["allListsService"];
angular
	.module('app')
	.directive('bkItem', bkItem);

function bkItem($q) {
	var directive = {
		restrict: 'EA',
		link: link,
		templateUrl: './templates/bkItem.html',
		controller: 'ItemsController',
		controllerAs: 'Items'
	};

	return directive;

	function link(scope, element, attrs) {
		// End custom edit mode on click
		element.on('click', function (e) {
			deselect();
		});

		var listView = document.querySelector('[bk-list-view]');
		var assignInput;

		// Enter assign mode
		function enterAssignMode() {
			element.addClass("editable editing assign");
			assignInput.select(); // iOS fix
			setTimeout(function() { assignInput.focus(); }, 100); // delay to wait for classes to apply
			listView.classList.add("hasEditableItem");
		}

		// Photo select
		var photoInput = element[0].querySelector('input.photo');
		var fileDefer;
		var waitingInput = 0;
		function photoPrompt() {
			fileDefer = $q.defer();
			scope.Items.getPhoto(attrs.itemId, fileDefer.promise);
			photoInput.click();
			photoInput.value = null;
		}
		function photoPromptClose() {
			if (waitingInput > 0) {
				waitingInput = 0;
				if (fileDefer) fileDefer.notify('noImage');
			} else {
				waitingInput++;
				if (fileDefer) fileDefer.notify('getting');
			}
		}
		photoInput.addEventListener('change', function(e) {
			var file = e.target.files[0];
			waitingInput = 0;
			if (file) {
				var reader = new FileReader();
				reader.onloadend = function() {
					fileDefer.resolve(reader.result);
					fileDefer = undefined;
				}
				reader.readAsDataURL(file);
			}
		});
		element[0].querySelector('img.photo').addEventListener('click', function(e) {
			e.stopPropagation();
			element.toggleClass('photoView');
		});
		element[0].querySelector('.media').addEventListener('click', function(e) {
			e.stopPropagation();
			element.removeClass('photoView');
		});

		// Toggle item doneness
		element[0].querySelector('button.done').addEventListener('click', function() {
			element.toggleClass("done").removeClass("editable");
			listView.classList.remove("hasEditableItem");
			deselect();
		});
		
		// Reattach listener to buttons on screen size change
		var assignButton = getAssignButton();
		var photoButton = getPhotoButton();
		scope.$watch(function() { return scope.Main.$mdMedia('md'); }, function() {
			if (assignButton) {
				assignButton.removeEventListener('click', enterAssignMode);
			}
			assignButton = getAssignButton();
			if (assignButton) {
				assignButton.addEventListener('click', enterAssignMode);
			}
			if (photoButton) {
				photoButton.removeEventListener('click', photoPrompt);
				document.removeEventListener("visibilitychange", photoPromptClose);
			}
			photoButton = getPhotoButton();
			if (photoButton) {
				photoButton.addEventListener('click', photoPrompt);
				document.addEventListener("visibilitychange", photoPromptClose);
			}
			// Prevent ending edit mode when clicking button
			element.find('button').on('click', function(e) {
				e.stopPropagation();
			});
			// iOS fix to deselect button
			element.find('button').on('touchstart', function(e) {
				document.activeElement.blur();
			});
		});

		setTimeout(function() {
			// Delay querying for input until element created
			assignInput = element[0].querySelector('md-autocomplete.assign input');
			// Prevent ending edit mode when selecting input
			element.find('md-input-container').on('click', function(e) {
				e.stopPropagation();
			});
		}, 100);

		// Leave custom edit mode
		function deselect() {
			element.removeClass("editing assign");
		}

		function getAssignButton() {
			return element[0].querySelector('button.assign');
		}
		function getPhotoButton() {
			return element[0].querySelector('button.photo');
		}
	}
}
bkItem.$inject = ["$q"];

angular
	.module('app')
	.directive('bkListInfo', bkListInfo);

function bkListInfo(allListsService) {
	var directive = {
		restrict: 'EA',
		link: link,
		templateUrl: './templates/bkListInfo.html'
	};

	return directive;

	function link(scope, element, attrs) {
		element.on('click', function() {
			scope.$apply(function() { allListsService.setCurrentList(scope.list) });
		});
	}
}
bkListInfo.$inject = ["allListsService"];
angular
	.module('app')
	.directive('bkListView', bkListView);

function bkListView() {
	var directive = {
		restrict: 'EA',
		link: link,
		controller: 'ItemsController',
		controllerAs: 'Items'
	};

	return directive;

	function link(scope, element, attrs) {

		var subheader = element[0].querySelector('.md-subheader');
		var titleInput = element[0].querySelector('.md-subheader input');

		// Click outside of items to exit edit mode
		element.on('click', function(e) {
			deselectAll();
			if (e.target) {
				var bkItem = isBkItemChild(e.target);
				if (bkItem) {
					makeItemEditable(bkItem);
				}
			}
		});

		// Prevent losing focus on button clicks
		element.find('button').on('click', function(e) {
			e.stopPropagation();
		});

		// Make title editable on click
		element[0].querySelector('.md-subheader .name').addEventListener('click', function() {
			makeTitleEditable();
		});

		// Exit title edit mode on title input losing focus
		titleInput.addEventListener('blur', function() {
			element[0].querySelector('.md-subheader').classList.remove('editable');
		});

		// Switch focus to new item
		element[0].querySelector('button.newItem').addEventListener('click', function(e) {
			var newItem = element[0].querySelector('bk-item');
			if (newItem) {
				deselectAll();
				makeItemEditable(newItem);
				var title = newItem.querySelector('.title input');
				// focus title field by default; delay to wait for style to take effect
				setTimeout(function() { title.focus(); }, 100);
				title.select(); // iOS fix
				window.scroll(1,1); // iOS fix
			}
		});

		function makeTitleEditable() {
			subheader.classList.add('editable');
			titleInput.focus();
		}
		scope.makeTitleEditable = makeTitleEditable;

		function deselectAll() {
			element.find('bk-item').removeClass("editable editing assign");
			element.removeClass('hasEditableItem');
		}

		function makeItemEditable(item) {
			item.classList.add('editable');
			element.addClass('hasEditableItem');
		}

		function isBkItemChild(node) {
			var isCardContent = false;
			while (node && node !== element[0]) {
				if (node.nodeName === 'MD-CARD-CONTENT') {
					isCardContent = true;
				}
				if (isCardContent && node.nodeName === 'BK-ITEM') {
					return node;
				}
				node = node.parentNode;
			}
			return false;
		}
	}
}

angular
	.module('app')
	.factory('ItemObject', ItemObject);

function ItemObject() {

	var itemObject = function(id) {
		this.id = id;
		this.title = '';
		this.note = '';
		this.assign = '';
		this.done = false;
		this.lastEdited = Date.now();
	}

	return itemObject;

}
angular
	.module('app')
	.factory('ListObject', ListObject);

function ListObject(ItemObject, idGenerator) {

	var listObject = function(id, name) {
		this.id = id;
		this.name = name;
		this.items = [];
		this.addItem = addItem;
		this.getItemIndexById = getItemIndexById;
		this.getDescription = getDescription;
	}

	function addItem() {
		this.items.unshift(new ItemObject(idGenerator.get(4)));
	}

	function getItemIndexById(id) {
		for (var i=0; i<this.items.length; i++) {
			if (this.items[i].id === id) {
				return i;
			}
		}
		return -1;
	}

	function getDescription() {
		return this.items.map(function(item) { if (!item.done) return item.title })
						.filter(function(val) { return val; })// get non-empty items
						.join(', ');
	}

	return listObject;

}
ListObject.$inject = ["ItemObject", "idGenerator"];
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
allListsService.$inject = ["ListObject", "$q", "idGenerator", "$rootScope"];
angular
	.module('app')
	.factory('idGenerator', idGenerator);

function idGenerator() {

	return {
		get: getUniqId,
	};

	function getUniqId(length) {
		return (Math.floor(Math.random()*Math.pow(36,length)).toString(36)).slice(-length);
	}
}
angular
	.module('app')
	.factory('shareService', shareService);

function shareService() {

	return {
		getLink: getLink,
		writeEmail: writeEmail,
	};

	function getLink(list) {
		return location.origin+location.pathname+"#list="+list.id;
	}

	function writeEmail(list) {
		var results = [];
		results.push("Add this list to your Basket at "+getLink(list));
		results.push("====================");
		results.push(list.name);
		results.push("====================");
		results.push("");
		for (var i=0; i<list.items.length; i++) {
			var item = list.items[i];
			results.push(item.title);
			results.push("");
			if (item.note) results.push('Notes: '+item.note);
			if (item.assign) results.push('Assigned to '+item.assign);
			results.push("--------------------");
			results.push("");
		}
		var body = results.join('%0A'); // new line
		return 'mailto:?body='+body;
	}
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9MaXN0c0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2JrSXRlbS5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0SW5mby5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0Vmlldy5qcyIsInNlcnZpY2VzL0l0ZW1PYmplY3QuanMiLCJzZXJ2aWNlcy9MaXN0T2JqZWN0LmpzIiwic2VydmljZXMvYWxsTGlzdHNTZXJ2aWNlLmpzIiwic2VydmljZXMvaWRHZW5lcmF0b3IuanMiLCJzZXJ2aWNlcy9zaGFyZVNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxPQUFPLFlBQVk7Q0FDdEIsY0FBYzs7O0FBR2YsSUFBSSxNQUFNLFFBQVEsT0FBTyxPQUFPLENBQUM7S0FDNUIsU0FBUyxXQUFXLENBQUMsWUFBWTtBQUN0QztBQ05BO0VBQ0UsT0FBTztFQUNQLFdBQVcsb0JBQW9COztBQUVqQyxTQUFTLGlCQUFpQixZQUFZLFVBQVUsaUJBQWlCLFVBQVUsU0FBUyxRQUFRLFdBQVcsY0FBYztDQUNwSCxJQUFJLEtBQUs7Q0FDVCxHQUFHLGtCQUFrQjtDQUNyQixHQUFHLGlCQUFpQjtDQUNwQixHQUFHLGlCQUFpQjtDQUNwQixHQUFHLFlBQVk7Q0FDZixHQUFHLFVBQVU7OztDQUdiLGdCQUFnQjtDQUNoQixZQUFZLGdCQUFnQixTQUFTOztDQUVyQyxPQUFPLElBQUksZ0JBQWdCLFdBQVc7RUFDckMsT0FBTzs7O0NBR1IsSUFBSSxTQUFTLEtBQUssVUFBVSxHQUFHLFFBQVEsYUFBYSxHQUFHO0VBQ3RELGdCQUFnQixXQUFXLFNBQVMsS0FBSyxVQUFVOztDQUVwRCxPQUFPLG1CQUFtQixnQkFBZ0I7O0NBRTFDLFNBQVMsVUFBVSxNQUFNLEdBQUc7RUFDM0IsVUFBVTtHQUNULFVBQVU7TUFDUCxvQkFB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QU0sR0FBRyxJQUFJLE9BQU8sTUFBTTs7Ozs7NEVBSXJGO0FDdFBEO0VBQ0UsT0FBTztFQUNQLFFBQVEsZUFBZTs7QUFFekIsU0FBUyxjQUFjOztDQUV0QixPQUFPO0VBQ04sS0FBSzs7O0NBR04sU0FBUyxVQUFVLFFBQVE7RUFDMUIsT0FBTyxDQUFDLEtBQUssTUFBTSxLQUFLLFNBQVMsS0FBSyxJQUFJLEdBQUcsU0FBUyxTQUFTLEtBQUssTUFBTSxDQUFDOztDQUU1RTtBQ2JEO0VBQ0UsT0FBTztFQUNQLFFBQVEsZ0JBQWdCOztBQUUxQixTQUFTLGVBQWU7O0NBRXZCLE9BQU87RUFDTixTQUFTO0VBQ1QsWUFBWTs7O0NBR2IsU0FBUyxRQUFRLE1BQU07RUFDdEIsT0FBTyxTQUFTLE9BQU8sU0FBUyxTQUFTLFNBQVMsS0FBSzs7O0NBR3hELFNBQVMsV0FBVyxNQUFNO0VBQ3pCLElBQUksVUFBVTtFQUNkLFFBQVEsS0FBSyxtQ0FBbUMsUUFBUTtFQUN4RCxRQUFRLEtBQUs7RUFDYixRQUFRLEtBQUssS0FBSztFQUNsQixRQUFRLEtBQUs7RUFDYixRQUFRLEtBQUs7RUFDYixLQUFLLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxNQUFNLFFBQVEsS0FBSztHQUN2QyxJQUFJLE9BQU8sS0FBSyxNQUFNO0dBQ3RCLFFBQVEsS0FBSyxLQUFLO0dBQ2xCLFFBQVEsS0FBSztHQUNiLElBQUksS0FBSyxNQUFNLFFBQVEsS0FBSyxVQUFVLEtBQUs7R0FDM0MsSUFBSSxLQUFLLFFBQVEsUUFBUSxLQUFLLGVBQWUsS0FBSztHQUNsRCxRQUFRLEtBQUs7R0FDYixRQUFRLEtBQUs7O0VBRWQsSUFBSSxPQUFPLFFBQVEsS0FBSztFQUN4QixPQUFPLGdCQUFnQjs7Q0FFeEIiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaWYgKHdpbmRvdy5GaWxlUmVhZGVyKSB7XG5cdGZpbGVTdXBwb3J0ID0gdHJ1ZTtcbn1cblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nTWF0ZXJpYWwnXSlcblx0XHRcdFx0LmNvbnN0YW50KCdzdXBwb3J0Jywge2ZpbGVSZWFkZXI6IGZpbGVTdXBwb3J0fSk7XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdCYXNrZXRDb250cm9sbGVyJywgQmFza2V0Q29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEJhc2tldENvbnRyb2xsZXIoJG1kU2lkZW5hdiwgJG1kTWVkaWEsIGFsbExpc3RzU2VydmljZSwgJG1kVG9hc3QsIHN1cHBvcnQsICRzY29wZSwgJG1kRGlhbG9nLCBzaGFyZVNlcnZpY2UpIHtcblx0dmFyIHZtID0gdGhpcztcblx0dm0udG9nZ2xlTGlzdHNWaWV3ID0gdG9nZ2xlTGlzdHNWaWV3O1xuXHR2bS5jbG9zZUxpc3RzVmlldyA9IGNsb3NlTGlzdHNWaWV3O1xuXHR2bS5kZWxldGVMaXN0QnlJZCA9IGRlbGV0ZUxpc3RCeUlkO1xuXHR2bS5zaGFyZUxpc3QgPSBzaGFyZUxpc3Q7XG5cdHZtLnN1cHBvcnQgPSBzdXBwb3J0O1xuXG5cdC8vIGxvYWQvc2F2ZSBkYXRhXG5cdGFsbExpc3RzU2VydmljZS5zeW5jQWxsKCk7XG5cdHNldEludGVydmFsKGFsbExpc3RzU2VydmljZS5zeW5jQWxsLCA1MDAwKTtcblxuXHQkc2NvcGUuJG9uKCdmaXJlYmFzZVN5bmMnLCBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdH0pO1xuXG5cdGlmIChsb2NhdGlvbi5oYXNoLnN1YnN0cmluZygxKS5pbmRleE9mKCdsaXN0PScpID09PSAwKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmltcG9ydExpc3QobG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoNikpO1xuXHR9XG5cdHdpbmRvdy5pbXBvcnRCYXNrZXRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmltcG9ydExpc3Q7XG5cblx0ZnVuY3Rpb24gc2hhcmVMaXN0KGxpc3QsIGUpIHtcblx0XHQkbWREaWFsb2cuc2hvdyhcblx0XHRcdCRtZERpYWxvZy5hbGVydCgpXG5cdFx0XHRcdFx0LmNsaWNrT3V0c2lkZVRvQ2xvc2UodHJ1ZSlcblx0XHRcdFx0XHQudGFyZ2V0RXZlbnQoZSlcblx0XHRcdFx0XHQudGl0bGUoJ1NoYXJlICcrbGlzdC5uYW1lKVxuXHRcdFx0XHRcdC5jb250ZW50KCdWaWV3IGFuZCBlZGl0IHRoaXMgbGlzdCBvbiBhbnkgZGV2aWNlIGF0ICcrc2hhcmVTZXJ2aWNlLmdldExpbmsobGlzdCkpXG5cdFx0KTtcblx0XHQvL3dpbmRvdy5vcGVuKHNoYXJlU2VydmljZS53cml0ZUVtYWlsKGxpc3QpKTtcblx0fVxuXG5cdC8vIHNpZGVuYXYgYmVoYXZpb3VyXG5cdHZtLiRtZE1lZGlhID0gJG1kTWVkaWE7XG5cdGlmICghdm0uJG1kTWVkaWEoJ2xnJykpIHtcblx0XHR2bS5saXN0c1ZpZXdPcGVuID0gdHJ1ZTtcblx0fVxuXHRmdW5jdGlvbiB0b2dnbGVMaXN0c1ZpZXcoKSB7XG5cdFx0JG1kU2lkZW5hdignbGVmdCcpLnRvZ2dsZSgpO1xuXHR9XG5cdGZ1bmN0aW9uIGNsb3NlTGlzdHNWaWV3KCkge1xuXHRcdCRtZFNpZGVuYXYoJ2xlZnQnKS5jbG9zZSgpO1xuXHR9XG5cblx0Ly8gTGlzdHMgZGVsZXRlIG9wZXJhdGlvbnNcblx0ZnVuY3Rpb24gZGVsZXRlTGlzdEJ5SWQoaWQpIHtcblx0XHQvLyBzaG93IHVuZG8gdG9hc3Rcblx0XHR2YXIgZGVsZXRlVG9hc3QgPSAkbWRUb2FzdC5zaW1wbGUoKS5jb250ZW50KCdMaXN0IERlbGV0ZWQnKS5hY3Rpb24oJ1VuZG8nKS5oaWdobGlnaHRBY3Rpb24odHJ1ZSk7XG5cdFx0JG1kVG9hc3Quc2hvdyhkZWxldGVUb2FzdCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0aWYgKHJlc3BvbnNlID09PSAnb2snKSB7XG5cdFx0XHRcdHVuZG9EZWxldGUoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHQvLyBwZXJmb3JtIGRlbGV0ZVxuXHRcdGFsbExpc3RzU2VydmljZS5kZWxldGVMaXN0KGlkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0JG1kVG9hc3QuaGlkZSgpO1xuXHRcdH0pO1xuXHRcdC8vIGhpZGUgY3VycmVudGx5IGVkaXRpbmcgbGlzdFxuXHRcdCRtZFNpZGVuYXYoJ2xlZnQnKS5vcGVuKCk7XG5cdH1cblxuXHRmdW5jdGlvbiB1bmRvRGVsZXRlKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5jYW5jZWxEZWxldGUoKTtcblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignSXRlbXNDb250cm9sbGVyJywgSXRlbXNDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gSXRlbXNDb250cm9sbGVyKGFsbExpc3RzU2VydmljZSwgJG1kVG9hc3QsICRtZE1lZGlhKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cblx0dm0uYWRkSXRlbSA9IGFkZEl0ZW07XG5cdHZtLmdldEN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXHR2bS5kZWxldGVJdGVtID0gZGVsZXRlSXRlbTtcblx0dm0uc2VhcmNoTmFtZSA9IHNlYXJjaE5hbWU7XG5cdHZtLmdldFBob3RvID0gZ2V0UGhvdG87XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHRpZiAoIWFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpKSB7XG5cdFx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0XHR9XG5cdFx0dm0uZ2V0Q3VycmVudExpc3QoKS5hZGRJdGVtKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWxldGVJdGVtKGlkKSB7XG5cdFx0Ly8gc2hvdyB1bmRvIHRvYXN0XG5cdFx0dmFyIGRlbGV0ZVRvYXN0ID0gJG1kVG9hc3Quc2ltcGxlKCkuY29udGVudCgnSXRlbSBEZWxldGVkJykuYWN0aW9uKCdVbmRvJykuaGlnaGxpZ2h0QWN0aW9uKHRydWUpO1xuXHRcdCRtZFRvYXN0LnNob3coZGVsZXRlVG9hc3QpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZSA9PT0gJ29rJykge1xuXHRcdFx0XHR1bmRvRGVsZXRlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcGVyZm9ybSBkZWxldGVcblx0XHRhbGxMaXN0c1NlcnZpY2UuZGVsZXRlSXRlbShpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRtZFRvYXN0LmhpZGUoKTtcblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVuZG9EZWxldGUoKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmNhbmNlbERlbGV0ZSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2VhcmNoTmFtZShxdWVyeSkge1xuXHRcdHZhciBhbGxJdGVtcyA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpLml0ZW1zO1xuXHRcdHZhciBuYW1lcyA9IFtxdWVyeV07XG5cdFx0Ly8gZ2V0IGxpc3Qgb2YgYWxsIHVuaXF1ZSBuYW1lc1xuXHRcdGZvciAodmFyIGk9MDsgaTxhbGxJdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIG5hbWUgPSBhbGxJdGVtc1tpXS5hc3NpZ247XG5cdFx0XHRpZiAobmFtZSAmJiBuYW1lcy5pbmRleE9mKG5hbWUpIDwgMCkgeyAvLyBpZiBuYW1lIGlzbid0IGFscmVhZHkgaW4gbGlzdFxuXHRcdFx0XHRuYW1lcy5wdXNoKG5hbWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBmaW5kIG1hdGNoZWQgbmFtZXNcblx0XHR2YXIgbWF0Y2hlcyA9IG5hbWVzLmZpbHRlcihmdW5jdGlvbihuYW1lKSB7XG5cdFx0XHRyZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkudG9Mb3dlckNhc2UoKSkgPT09IDA7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIG1hdGNoZXM7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRQaG90byhpZCwgcHJvbWlzZSkge1xuXHRcdHZhciBsaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0KCk7XG5cdFx0dmFyIGluZGV4ID0gbGlzdC5nZXRJdGVtSW5kZXhCeUlkKGlkKTtcblx0XHR2YXIgbG9hZGluZ0ljb24gPSBcImRhdGE6aW1hZ2Uvc3ZnK3htbCwlM0NzdmclMjB4bWxucyUzRCUyMmh0dHAlM0EvL3d3dy53My5vcmcvMjAwMC9zdmclMjIlMjB2aWV3Qm94JTNEJTIyMCUyMDAlMjAzMiUyMDMyJTIyJTIwd2lkdGglM0QlMjIzMiUyMiUyMGhlaWdodCUzRCUyMjMyJTIyJTIwZmlsbCUzRCUyMmJsYWNrJTIyJTNFJTBBJTIwJTIwJTNDY2lyY2xlJTIwdHJhbnNmb3JtJTNEJTIydHJhbnNsYXRlJTI4OCUyMDAlMjklMjIlMjBjeCUzRCUyMjAlMjIlMjBjeSUzRCUyMjE2JTIyJTIwciUzRCUyMjAlMjIlM0UlMjAlMEElMjAlMjAlMjAlMjAlM0NhbmltYXRlJTIwYXR0cmlidXRlTmFtZSUzRCUyMnIlMjIlMjB2YWx1ZXMlM0QlMjIwJTNCJTIwNCUzQiUyMDAlM0IlMjAwJTIyJTIwZHVyJTNEJTIyMS4ycyUyMiUyMHJlcGVhdENvdW50JTNEJTIyaW5kZWZpbml0ZSUyMiUyMGJlZ2luJTNEJTIyMCUyMiUwQSUyMCUyMCUyMCUyMCUyMCUyMGtleXRpbWVzJTNEJTIyMCUzQjAuMiUzQjAuNyUzQjElMjIlMjBrZXlTcGxpbmVzJTNEJTIyMC4yJTIwMC4yJTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTIyJTIwY2FsY01vZGUlM0QlMjJzcGxpbmUlMjIlMjAvJTNFJTBBJTIwJTIwJTNDL2NpcmNsZSUzRSUwQSUyMCUyMCUzQ2NpcmNsZSUyMHRyYW5zZm9ybSUzRCUyMnRyYW5zbGF0ZSUyODE2JTIwMCUyOSUyMiUyMGN4JTNEJTIyMCUyMiUyMGN5JTNEJTIyMTYlMjIlMjByJTNEJTIyMCUyMiUzRSUyMCUwQSUyMCUyMCUyMCUyMCUzQ2FuaW1hdGUlMjBhdHRyaWJ1dGVOYW1lJTNEJTIyciUyMiUyMHZhbHVlcyUzRCUyMjAlM0IlMjA0JTNCJTIwMCUzQiUyMDAlMjIlMjBkdXIlM0QlMjIxLjJzJTIyJTIwcmVwZWF0Q291bnQlM0QlMjJpbmRlZmluaXRlJTIyJTIwYmVnaW4lM0QlMjIwLjMlMjIlMEElMjAlMjAlMjAlMjAlMjAlMjBrZXl0aW1lcyUzRCUyMjAlM0IwLjIlM0IwLjclM0IxJTIyJTIwa2V5U3BsaW5lcyUzRCUyMjAuMiUyMDAuMiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUyMiUyMGNhbGNNb2RlJTNEJTIyc3BsaW5lJTIyJTIwLyUzRSUwQSUyMCUyMCUzQy9jaXJjbGUlM0UlMEElMjAlMjAlM0NjaXJjbGUlMjB0cmFuc2Zvcm0lM0QlMjJ0cmFuc2xhdGUlMjgyNCUyMDAlMjklMjIlMjBjeCUzRCUyMjAlMjIlMjBjeSUzRCUyMjE2JTIyJTIwciUzRCUyMjAlMjIlM0UlMjAlMEElMjAlMjAlMjAlMjAlM0NhbmltYXRlJTIwYXR0cmlidXRlTmFtZSUzRCUyMnIlMjIlMjB2YWx1ZXMlM0QlMjIwJTNCJTIwNCUzQiUyMDAlM0IlMjAwJTIyJTIwZHVyJTNEJTIyMS4ycyUyMiUyMHJlcGVhdENvdW50JTNEJTIyaW5kZWZpbml0ZSUyMiUyMGJlZ2luJTNEJTIyMC42JTIyJTBBJTIwJTIwJTIwJTIwJTIwJTIwa2V5dGltZXMlM0QlMjIwJTNCMC4yJTNCMC43JTNCMSUyMiUyMGtleVNwbGluZXMlM0QlMjIwLjIlMjAwLjIlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglMjIlMjBjYWxjTW9kZSUzRCUyMnNwbGluZSUyMiUyMC8lM0UlMEElMjAlMjAlM0MvY2lyY2xlJTNFJTBBJTNDL3N2ZyUzRVwiO1xuXHRcdC8vIHNldCBhcyBsb2FkaW5nIGljb24gb24gbW9iaWxlXG5cdFx0cHJvbWlzZS50aGVuKGZ1bmN0aW9uKGZpbGUpe1xuXHRcdFx0bGlzdC5pdGVtc1tpbmRleF0ucGhvdG8gPSBmaWxlO1xuXHRcdH0sIG51bGxcblx0XHQsIGZ1bmN0aW9uKHVwZGF0ZSkge1xuXHRcdFx0aWYgKHVwZGF0ZSA9PT0gJ2dldHRpbmcnKSB7XG5cdFx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLnBob3RvID0gbG9hZGluZ0ljb247XG5cdFx0XHR9IGVsc2UgaWYgKHVwZGF0ZSA9PT0gJ25vSW1hZ2UnKSB7XG5cdFx0XHRcdGlmIChsaXN0Lml0ZW1zW2luZGV4XS5waG90byA9PSBsb2FkaW5nSWNvbikge1xuXHRcdFx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLnBob3RvID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0xpc3RzQ29udHJvbGxlcicsIExpc3RzQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIExpc3RzQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblxuXHR2YXIgdm0gPSB0aGlzO1xuXHRcblx0dm0ubGlzdHMgPSBhbGxMaXN0c1NlcnZpY2UubGlzdHM7XG5cblx0dm0uYWRkTGlzdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChhbGxMaXN0c1NlcnZpY2UuYWRkKCkpO1xuXHR9O1xuXG5cdHZtLmN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0l0ZW0nLCBia0l0ZW0pO1xuXG5mdW5jdGlvbiBia0l0ZW0oJHEpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdHRlbXBsYXRlVXJsOiAnLi90ZW1wbGF0ZXMvYmtJdGVtLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdJdGVtc0NvbnRyb2xsZXInLFxuXHRcdGNvbnRyb2xsZXJBczogJ0l0ZW1zJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHQvLyBFbmQgY3VzdG9tIGVkaXQgbW9kZSBvbiBjbGlja1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cblx0XHR2YXIgbGlzdFZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbYmstbGlzdC12aWV3XScpO1xuXHRcdHZhciBhc3NpZ25JbnB1dDtcblxuXHRcdC8vIEVudGVyIGFzc2lnbiBtb2RlXG5cdFx0ZnVuY3Rpb24gZW50ZXJBc3NpZ25Nb2RlKCkge1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcyhcImVkaXRhYmxlIGVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdFx0YXNzaWduSW5wdXQuc2VsZWN0KCk7IC8vIGlPUyBmaXhcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGFzc2lnbklucHV0LmZvY3VzKCk7IH0sIDEwMCk7IC8vIGRlbGF5IHRvIHdhaXQgZm9yIGNsYXNzZXMgdG8gYXBwbHlcblx0XHRcdGxpc3RWaWV3LmNsYXNzTGlzdC5hZGQoXCJoYXNFZGl0YWJsZUl0ZW1cIik7XG5cdFx0fVxuXG5cdFx0Ly8gUGhvdG8gc2VsZWN0XG5cdFx0dmFyIHBob3RvSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LnBob3RvJyk7XG5cdFx0dmFyIGZpbGVEZWZlcjtcblx0XHR2YXIgd2FpdGluZ0lucHV0ID0gMDtcblx0XHRmdW5jdGlvbiBwaG90b1Byb21wdCgpIHtcblx0XHRcdGZpbGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0XHRzY29wZS5JdGVtcy5nZXRQaG90byhhdHRycy5pdGVtSWQsIGZpbGVEZWZlci5wcm9taXNlKTtcblx0XHRcdHBob3RvSW5wdXQuY2xpY2soKTtcblx0XHRcdHBob3RvSW5wdXQudmFsdWUgPSBudWxsO1xuXHRcdH1cblx0XHRmdW5jdGlvbiBwaG90b1Byb21wdENsb3NlKCkge1xuXHRcdFx0aWYgKHdhaXRpbmdJbnB1dCA+IDApIHtcblx0XHRcdFx0d2FpdGluZ0lucHV0ID0gMDtcblx0XHRcdFx0aWYgKGZpbGVEZWZlcikgZmlsZURlZmVyLm5vdGlmeSgnbm9JbWFnZScpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0d2FpdGluZ0lucHV0Kys7XG5cdFx0XHRcdGlmIChmaWxlRGVmZXIpIGZpbGVEZWZlci5ub3RpZnkoJ2dldHRpbmcnKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cGhvdG9JbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHR2YXIgZmlsZSA9IGUudGFyZ2V0LmZpbGVzWzBdO1xuXHRcdFx0d2FpdGluZ0lucHV0ID0gMDtcblx0XHRcdGlmIChmaWxlKSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXHRcdFx0XHRyZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0ZmlsZURlZmVyLnJlc29sdmUocmVhZGVyLnJlc3VsdCk7XG5cdFx0XHRcdFx0ZmlsZURlZmVyID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignaW1nLnBob3RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZWxlbWVudC50b2dnbGVDbGFzcygncGhvdG9WaWV3Jyk7XG5cdFx0fSk7XG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWVkaWEnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKCdwaG90b1ZpZXcnKTtcblx0XHR9KTtcblxuXHRcdC8vIFRvZ2dsZSBpdGVtIGRvbmVuZXNzXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24uZG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50LnRvZ2dsZUNsYXNzKFwiZG9uZVwiKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlXCIpO1xuXHRcdFx0bGlzdFZpZXcuY2xhc3NMaXN0LnJlbW92ZShcImhhc0VkaXRhYmxlSXRlbVwiKTtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cdFx0XG5cdFx0Ly8gUmVhdHRhY2ggbGlzdGVuZXIgdG8gYnV0dG9ucyBvbiBzY3JlZW4gc2l6ZSBjaGFuZ2Vcblx0XHR2YXIgYXNzaWduQnV0dG9uID0gZ2V0QXNzaWduQnV0dG9uKCk7XG5cdFx0dmFyIHBob3RvQnV0dG9uID0gZ2V0UGhvdG9CdXR0b24oKTtcblx0XHRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBzY29wZS5NYWluLiRtZE1lZGlhKCdtZCcpOyB9LCBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChhc3NpZ25CdXR0b24pIHtcblx0XHRcdFx0YXNzaWduQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJBc3NpZ25Nb2RlKTtcblx0XHRcdH1cblx0XHRcdGFzc2lnbkJ1dHRvbiA9IGdldEFzc2lnbkJ1dHRvbigpO1xuXHRcdFx0aWYgKGFzc2lnbkJ1dHRvbikge1xuXHRcdFx0XHRhc3NpZ25CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlbnRlckFzc2lnbk1vZGUpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHBob3RvQnV0dG9uKSB7XG5cdFx0XHRcdHBob3RvQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcGhvdG9Qcm9tcHQpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCBwaG90b1Byb21wdENsb3NlKTtcblx0XHRcdH1cblx0XHRcdHBob3RvQnV0dG9uID0gZ2V0UGhvdG9CdXR0b24oKTtcblx0XHRcdGlmIChwaG90b0J1dHRvbikge1xuXHRcdFx0XHRwaG90b0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHBob3RvUHJvbXB0KTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgcGhvdG9Qcm9tcHRDbG9zZSk7XG5cdFx0XHR9XG5cdFx0XHQvLyBQcmV2ZW50IGVuZGluZyBlZGl0IG1vZGUgd2hlbiBjbGlja2luZyBidXR0b25cblx0XHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSk7XG5cdFx0XHQvLyBpT1MgZml4IHRvIGRlc2VsZWN0IGJ1dHRvblxuXHRcdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbigndG91Y2hzdGFydCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBEZWxheSBxdWVyeWluZyBmb3IgaW5wdXQgdW50aWwgZWxlbWVudCBjcmVhdGVkXG5cdFx0XHRhc3NpZ25JbnB1dCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignbWQtYXV0b2NvbXBsZXRlLmFzc2lnbiBpbnB1dCcpO1xuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gc2VsZWN0aW5nIGlucHV0XG5cdFx0XHRlbGVtZW50LmZpbmQoJ21kLWlucHV0LWNvbnRhaW5lcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdH0sIDEwMCk7XG5cblx0XHQvLyBMZWF2ZSBjdXN0b20gZWRpdCBtb2RlXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3QoKSB7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKFwiZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ2V0QXNzaWduQnV0dG9uKCkge1xuXHRcdFx0cmV0dXJuIGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmFzc2lnbicpO1xuXHRcdH1cblx0XHRmdW5jdGlvbiBnZXRQaG90b0J1dHRvbigpIHtcblx0XHRcdHJldHVybiBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5waG90bycpO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RJbmZvJywgYmtMaXN0SW5mbyk7XG5cbmZ1bmN0aW9uIGJrTGlzdEluZm8oYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrTGlzdEluZm8uaHRtbCdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHsgYWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KHNjb3BlLmxpc3QpIH0pO1xuXHRcdH0pO1xuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RWaWV3JywgYmtMaXN0Vmlldyk7XG5cbmZ1bmN0aW9uIGJrTGlzdFZpZXcoKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cblx0XHR2YXIgc3ViaGVhZGVyID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJyk7XG5cdFx0dmFyIHRpdGxlSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgaW5wdXQnKTtcblxuXHRcdC8vIENsaWNrIG91dHNpZGUgb2YgaXRlbXMgdG8gZXhpdCBlZGl0IG1vZGVcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRpZiAoZS50YXJnZXQpIHtcblx0XHRcdFx0dmFyIGJrSXRlbSA9IGlzQmtJdGVtQ2hpbGQoZS50YXJnZXQpO1xuXHRcdFx0XHRpZiAoYmtJdGVtKSB7XG5cdFx0XHRcdFx0bWFrZUl0ZW1FZGl0YWJsZShia0l0ZW0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBQcmV2ZW50IGxvc2luZyBmb2N1cyBvbiBidXR0b24gY2xpY2tzXG5cdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gTWFrZSB0aXRsZSBlZGl0YWJsZSBvbiBjbGlja1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlciAubmFtZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRtYWtlVGl0bGVFZGl0YWJsZSgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gRXhpdCB0aXRsZSBlZGl0IG1vZGUgb24gdGl0bGUgaW5wdXQgbG9zaW5nIGZvY3VzXG5cdFx0dGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXInKS5jbGFzc0xpc3QucmVtb3ZlKCdlZGl0YWJsZScpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gU3dpdGNoIGZvY3VzIHRvIG5ldyBpdGVtXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24ubmV3SXRlbScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIG5ld0l0ZW0gPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2JrLWl0ZW0nKTtcblx0XHRcdGlmIChuZXdJdGVtKSB7XG5cdFx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUobmV3SXRlbSk7XG5cdFx0XHRcdHZhciB0aXRsZSA9IG5ld0l0ZW0ucXVlcnlTZWxlY3RvcignLnRpdGxlIGlucHV0Jyk7XG5cdFx0XHRcdC8vIGZvY3VzIHRpdGxlIGZpZWxkIGJ5IGRlZmF1bHQ7IGRlbGF5IHRvIHdhaXQgZm9yIHN0eWxlIHRvIHRha2UgZWZmZWN0XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRpdGxlLmZvY3VzKCk7IH0sIDEwMCk7XG5cdFx0XHRcdHRpdGxlLnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRcdHdpbmRvdy5zY3JvbGwoMSwxKTsgLy8gaU9TIGZpeFxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gbWFrZVRpdGxlRWRpdGFibGUoKSB7XG5cdFx0XHRzdWJoZWFkZXIuY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdHRpdGxlSW5wdXQuZm9jdXMoKTtcblx0XHR9XG5cdFx0c2NvcGUubWFrZVRpdGxlRWRpdGFibGUgPSBtYWtlVGl0bGVFZGl0YWJsZTtcblxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuXHRcdFx0ZWxlbWVudC5maW5kKCdiay1pdGVtJykucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG1ha2VJdGVtRWRpdGFibGUoaXRlbSkge1xuXHRcdFx0aXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcygnaGFzRWRpdGFibGVJdGVtJyk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaXNCa0l0ZW1DaGlsZChub2RlKSB7XG5cdFx0XHR2YXIgaXNDYXJkQ29udGVudCA9IGZhbHNlO1xuXHRcdFx0d2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gZWxlbWVudFswXSkge1xuXHRcdFx0XHRpZiAobm9kZS5ub2RlTmFtZSA9PT0gJ01ELUNBUkQtQ09OVEVOVCcpIHtcblx0XHRcdFx0XHRpc0NhcmRDb250ZW50ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoaXNDYXJkQ29udGVudCAmJiBub2RlLm5vZGVOYW1lID09PSAnQkstSVRFTScpIHtcblx0XHRcdFx0XHRyZXR1cm4gbm9kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnSXRlbU9iamVjdCcsIEl0ZW1PYmplY3QpO1xuXG5mdW5jdGlvbiBJdGVtT2JqZWN0KCkge1xuXG5cdHZhciBpdGVtT2JqZWN0ID0gZnVuY3Rpb24oaWQpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy50aXRsZSA9ICcnO1xuXHRcdHRoaXMubm90ZSA9ICcnO1xuXHRcdHRoaXMuYXNzaWduID0gJyc7XG5cdFx0dGhpcy5kb25lID0gZmFsc2U7XG5cdFx0dGhpcy5sYXN0RWRpdGVkID0gRGF0ZS5ub3coKTtcblx0fVxuXG5cdHJldHVybiBpdGVtT2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnTGlzdE9iamVjdCcsIExpc3RPYmplY3QpO1xuXG5mdW5jdGlvbiBMaXN0T2JqZWN0KEl0ZW1PYmplY3QsIGlkR2VuZXJhdG9yKSB7XG5cblx0dmFyIGxpc3RPYmplY3QgPSBmdW5jdGlvbihpZCwgbmFtZSkge1xuXHRcdHRoaXMuaWQgPSBpZDtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuaXRlbXMgPSBbXTtcblx0XHR0aGlzLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHRcdHRoaXMuZ2V0SXRlbUluZGV4QnlJZCA9IGdldEl0ZW1JbmRleEJ5SWQ7XG5cdFx0dGhpcy5nZXREZXNjcmlwdGlvbiA9IGdldERlc2NyaXB0aW9uO1xuXHR9XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHR0aGlzLml0ZW1zLnVuc2hpZnQobmV3IEl0ZW1PYmplY3QoaWRHZW5lcmF0b3IuZ2V0KDQpKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRJdGVtSW5kZXhCeUlkKGlkKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuaXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICh0aGlzLml0ZW1zW2ldLmlkID09PSBpZCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGVzY3JpcHRpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKCFpdGVtLmRvbmUpIHJldHVybiBpdGVtLnRpdGxlIH0pXG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9KS8vIGdldCBub24tZW1wdHkgaXRlbXNcblx0XHRcdFx0XHRcdC5qb2luKCcsICcpO1xuXHR9XG5cblx0cmV0dXJuIGxpc3RPYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdhbGxMaXN0c1NlcnZpY2UnLCBhbGxMaXN0c1NlcnZpY2UpO1xuXG5mdW5jdGlvbiBhbGxMaXN0c1NlcnZpY2UoTGlzdE9iamVjdCwgJHEsIGlkR2VuZXJhdG9yLCAkcm9vdFNjb3BlKSB7XG5cblx0dmFyIGxpc3RzID0gW107XG5cdHZhciBjdXJyZW50TGlzdElkID0gdW5kZWZpbmVkO1xuXHR2YXIgZGVsZXRlVGltZXI7XG5cdHZhciBkZWxldGVEZWZlcjtcblx0dmFyIGRlbGV0aW5nTGlzdElkO1xuXHR2YXIgZGVsZXRpbmdJdGVtSWQ7XG5cdHZhciBmaXJlUmVmID0gbmV3IEZpcmViYXNlKFwiaHR0cHM6Ly90b3JyaWQtZmlyZS02MjY2LmZpcmViYXNlaW8uY29tL1wiKTtcblx0bG9jYWxSZXRyaWV2ZSgpO1xuXG5cdHJldHVybiB7XG5cdFx0YWRkOiBhZGQsXG5cdFx0bGlzdHM6IGxpc3RzLFxuXHRcdHNldEN1cnJlbnRMaXN0OiBzZXRDdXJyZW50TGlzdCxcblx0XHRnZXRDdXJyZW50TGlzdDogZ2V0Q3VycmVudExpc3QsXG5cdFx0ZGVsZXRlTGlzdDogZGVsZXRlTGlzdCxcblx0XHRkZWxldGVJdGVtOiBkZWxldGVJdGVtLFxuXHRcdGNhbmNlbERlbGV0ZTogY2FuY2VsRGVsZXRlLFxuXHRcdHN5bmNBbGw6IHN5bmNBbGwsXG5cdFx0aW1wb3J0TGlzdDogaW1wb3J0TGlzdCxcblx0fTtcblxuXHRmdW5jdGlvbiBhZGQoKSB7XG5cdFx0bGlzdHMudW5zaGlmdChcblx0XHRcdG5ldyBMaXN0T2JqZWN0KGlkR2VuZXJhdG9yLmdldCg4KSwgXCJOZXcgTGlzdCBcIisobGlzdHMubGVuZ3RoKzEpKVxuXHRcdCk7XG5cdFx0cmV0dXJuIGxpc3RzWzBdO1xuXHR9XG5cblx0ZnVuY3Rpb24gZmluZExpc3RJbmRleEJ5SWQoaWQpIHtcblx0XHRmb3IgKHZhciBpPTA7IGk8bGlzdHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChsaXN0c1tpXS5pZCA9PT0gaWQpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAtMTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZUl0ZW1EYXRhKGl0ZW0sIHZhbHVlcykge1xuXHRcdGl0ZW0uaWQgPSB2YWx1ZXMuaWQ7XG5cdFx0aXRlbS50aXRsZSA9IHZhbHVlcy50aXRsZTtcblx0XHRpdGVtLm5vdGUgPSB2YWx1ZXMubm90ZTtcblx0XHRpdGVtLmFzc2lnbiA9IHZhbHVlcy5hc3NpZ247XG5cdFx0aXRlbS5hdWRpbyA9IHZhbHVlcy5hdWRpbztcblx0XHRpdGVtLnBob3RvID0gdmFsdWVzLnBob3RvO1xuXHRcdGlmIChpdGVtLnBob3RvID09IFwiZGF0YTppbWFnZS9zdmcreG1sLCUzQ3N2ZyUyMHhtbG5zJTNEJTIyaHR0cCUzQS8vd3d3LnczLm9yZy8yMDAwL3N2ZyUyMiUyMHZpZXdCb3glM0QlMjIwJTIwMCUyMDMyJTIwMzIlMjIlMjB3aWR0aCUzRCUyMjMyJTIyJTIwaGVpZ2h0JTNEJTIyMzIlMjIlMjBmaWxsJTNEJTIyYmxhY2slMjIlM0UlMEElMjAlMjAlM0NjaXJjbGUlMjB0cmFuc2Zvcm0lM0QlMjJ0cmFuc2xhdGUlMjg4JTIwMCUyOSUyMiUyMGN4JTNEJTIyMCUyMiUyMGN5JTNEJTIyMTYlMjIlMjByJTNEJTIyMCUyMiUzRSUyMCUwQSUyMCUyMCUyMCUyMCUzQ2FuaW1hdGUlMjBhdHRyaWJ1dGVOYW1lJTNEJTIyciUyMiUyMHZhbHVlcyUzRCUyMjAlM0IlMjA0JTNCJTIwMCUzQiUyMDAlMjIlMjBkdXIlM0QlMjIxLjJzJTIyJTIwcmVwZWF0Q291bnQlM0QlMjJpbmRlZmluaXRlJTIyJTIwYmVnaW4lM0QlMjIwJTIyJTBBJTIwJTIwJTIwJTIwJTIwJTIwa2V5dGltZXMlM0QlMjIwJTNCMC4yJTNCMC43JTNCMSUyMiUyMGtleVNwbGluZXMlM0QlMjIwLjIlMjAwLjIlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglMjIlMjBjYWxjTW9kZSUzRCUyMnNwbGluZSUyMiUyMC8lM0UlMEElMjAlMjAlM0MvY2lyY2xlJTNFJTBBJTIwJTIwJTNDY2lyY2xlJTIwdHJhbnNmb3JtJTNEJTIydHJhbnNsYXRlJTI4MTYlMjAwJTI5JTIyJTIwY3glM0QlMjIwJTIyJTIwY3klM0QlMjIxNiUyMiUyMHIlM0QlMjIwJTIyJTNFJTIwJTBBJTIwJTIwJTIwJTIwJTNDYW5pbWF0ZSUyMGF0dHJpYnV0ZU5hbWUlM0QlMjJyJTIyJTIwdmFsdWVzJTNEJTIyMCUzQiUyMDQlM0IlMjAwJTNCJTIwMCUyMiUyMGR1ciUzRCUyMjEuMnMlMjIlMjByZXBlYXRDb3VudCUzRCUyMmluZGVmaW5pdGUlMjIlMjBiZWdpbiUzRCUyMjAuMyUyMiUwQSUyMCUyMCUyMCUyMCUyMCUyMGtleXRpbWVzJTNEJTIyMCUzQjAuMiUzQjAuNyUzQjElMjIlMjBrZXlTcGxpbmVzJTNEJTIyMC4yJTIwMC4yJTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTIyJTIwY2FsY01vZGUlM0QlMjJzcGxpbmUlMjIlMjAvJTNFJTBBJTIwJTIwJTNDL2NpcmNsZSUzRSUwQSUyMCUyMCUzQ2NpcmNsZSUyMHRyYW5zZm9ybSUzRCUyMnRyYW5zbGF0ZSUyODI0JTIwMCUyOSUyMiUyMGN4JTNEJTIyMCUyMiUyMGN5JTNEJTIyMTYlMjIlMjByJTNEJTIyMCUyMiUzRSUyMCUwQSUyMCUyMCUyMCUyMCUzQ2FuaW1hdGUlMjBhdHRyaWJ1dGVOYW1lJTNEJTIyciUyMiUyMHZhbHVlcyUzRCUyMjAlM0IlMjA0JTNCJTIwMCUzQiUyMDAlMjIlMjBkdXIlM0QlMjIxLjJzJTIyJTIwcmVwZWF0Q291bnQlM0QlMjJpbmRlZmluaXRlJTIyJTIwYmVnaW4lM0QlMjIwLjYlMjIlMEElMjAlMjAlMjAlMjAlMjAlMjBrZXl0aW1lcyUzRCUyMjAlM0IwLjIlM0IwLjclM0IxJTIyJTIwa2V5U3BsaW5lcyUzRCUyMjAuMiUyMDAuMiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUyMiUyMGNhbGNNb2RlJTNEJTIyc3BsaW5lJTIyJTIwLyUzRSUwQSUyMCUyMCUzQy9jaXJjbGUlM0UlMEElM0Mvc3ZnJTNFXCIpIHtcblx0XHRcdGl0ZW0ucGhvdG8gPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGl0ZW0uZG9uZSA9IHZhbHVlcy5kb25lO1xuXHRcdGl0ZW0ubGFzdEVkaXRlZCA9IHZhbHVlcy5sYXN0RWRpdGVkO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGF0YU9ubHlJdGVtKG9yaWdpbmFsKSB7XG5cdFx0dmFyIGl0ZW0gPSB7fTtcblx0XHR1cGRhdGVJdGVtRGF0YShpdGVtLCBvcmlnaW5hbCk7XG5cdFx0Zm9yICh2YXIga2V5IGluIGl0ZW0pIHtcblx0XHRcdGlmIChpdGVtW2tleV0gPT09IG51bGwgfHwgaXRlbVtrZXldID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0ZGVsZXRlIGl0ZW1ba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGl0ZW07XG5cdH1cblxuXHRmdW5jdGlvbiBnZXREYXRhT25seUxpc3QoaWQpIHtcblx0XHR2YXIgbGlzdCA9IGxpc3RzW2ZpbmRMaXN0SW5kZXhCeUlkKGlkKV07XG5cdFx0dmFyIHRleHRPbmx5TGlzdCA9IFtdO1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0Lml0ZW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0ZXh0T25seUxpc3QucHVzaChnZXREYXRhT25seUl0ZW0obGlzdC5pdGVtc1tpXSkpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGV4dE9ubHlMaXN0O1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlTGlzdChpZCkge1xuXHRcdC8vIFNldCBsaXN0IHN0YXR1cyBmb3IgZGVsZXRpb25cblx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChpZCk7XG5cdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdGxpc3RzW2luZGV4XS5kZWxldGluZyA9IHRydWU7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gJyc7XG5cdFx0fVxuXHRcdC8vIGRlbGV0ZSBkZWxheVxuXHRcdGRlbGV0aW5nTGlzdElkID0gaWQ7XG5cdFx0ZGVsZXRlRGVmZXIgPSAkcS5kZWZlcigpO1xuXHRcdGRlbGV0ZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdC8vIGdldCBpbmRleCBhZ2FpbiwgYXMgaXQgbWF5IGhhdmUgY2hhbmdlZFxuXHRcdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoaWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVzb2x2ZSgnZGVsZXRlZCcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdsaXN0Tm90Rm91bmQnKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nTGlzdElkID0gdW5kZWZpbmVkO1xuXHRcdH0sIDUwMDApO1xuXHRcdHJldHVybiBkZWxldGVEZWZlci5wcm9taXNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlSXRlbShpZCkge1xuXHRcdC8vIFNldCBsaXN0IHN0YXR1cyBmb3IgZGVsZXRpb25cblx0XHR2YXIgaW5kZXggPSBnZXRDdXJyZW50TGlzdCgpLmdldEl0ZW1JbmRleEJ5SWQoaWQpO1xuXHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRnZXRDdXJyZW50TGlzdCgpLml0ZW1zW2luZGV4XS5kZWxldGluZyA9IHRydWU7XG5cdFx0fVxuXHRcdC8vIGRlbGV0ZSBkZWxheVxuXHRcdGRlbGV0aW5nSXRlbUlkID0gaWQ7XG5cdFx0ZGVsZXRpbmdMaXN0SWQgPSBnZXRDdXJyZW50TGlzdCgpLmlkOyAvLyBzdG9yZSBsaXN0IGlkIGluIGNhc2UgY3VycmVudCBsaXN0IGlzIGNoYW5nZWRcblx0XHRkZWxldGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0ZGVsZXRlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gZ2V0IGluZGV4IGFnYWluLCBhcyBpdCBtYXkgaGF2ZSBjaGFuZ2VkXG5cdFx0XHR2YXIgbGlzdEluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoZGVsZXRpbmdMaXN0SWQpO1xuXHRcdFx0aWYgKGxpc3RJbmRleCA+PSAwKSB7XG5cdFx0XHRcdHZhciBpbmRleCA9IGxpc3RzW2xpc3RJbmRleF0uZ2V0SXRlbUluZGV4QnlJZChpZCk7XG5cdFx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdFx0bGlzdHNbbGlzdEluZGV4XS5pdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRcdGRlbGV0ZURlZmVyLnJlc29sdmUoJ2RlbGV0ZWQnKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkZWxldGVEZWZlci5yZWplY3QoJ2xpc3ROb3RGb3VuZCcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRkZWxldGluZ0l0ZW1JZCA9IHVuZGVmaW5lZDtcblx0XHR9LCA1MDAwKTtcblx0XHRyZXR1cm4gZGVsZXRlRGVmZXIucHJvbWlzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNhbmNlbERlbGV0ZSgpIHtcblx0XHRjbGVhclRpbWVvdXQoZGVsZXRlVGltZXIpO1xuXHRcdGlmIChkZWxldGluZ0l0ZW1JZCkge1xuXHRcdFx0dmFyIGxpc3QgPSBsaXN0c1tmaW5kTGlzdEluZGV4QnlJZChkZWxldGluZ0xpc3RJZCldO1xuXHRcdFx0dmFyIGluZGV4ID0gbGlzdC5nZXRJdGVtSW5kZXhCeUlkKGRlbGV0aW5nSWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdC5pdGVtc1tpbmRleF0uZGVsZXRpbmcgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nSXRlbUlkID0gdW5kZWZpbmVkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChkZWxldGluZ0lkKTtcblx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdGxpc3RzW2luZGV4XS5kZWxldGluZyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdMaXN0SWQgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGRlbGV0ZURlZmVyLnJlamVjdCgnZGVsZXRlQ2FuY2VsbGVkJyk7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDdXJyZW50TGlzdChsaXN0KSB7XG5cdFx0aWYgKHR5cGVvZiBsaXN0ID09PSAnbnVtYmVyJykge1xuXHRcdFx0Y3VycmVudExpc3RJZCA9IGZpbmRMaXN0SW5kZXhCeUlkKGxpc3QpO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gbGlzdC5pZDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc29sZS53YXJuKCd1bmtub3duIGlucHV0IGZvciBsaXN0OiAnKyB0eXBlb2YgbGlzdCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Q3VycmVudExpc3QoKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBsaXN0c1tmaW5kTGlzdEluZGV4QnlJZChjdXJyZW50TGlzdElkKV07XG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ0xpc3Qgbm90IGZvdW5kLiBJRDogJytjdXJyZW50TGlzdElkKTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0cyk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaW1wb3J0TGlzdChpZCkge1xuXHRcdHZhciBsaXN0UmVmID0gZmlyZVJlZi5jaGlsZChpZCk7XG5cdFx0dmFyIGxpc3Q7XG5cdFx0dmFyIGxvY2FsSW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChpZCk7XG5cdFx0aWYgKGxvY2FsSW5kZXggPCAwKSB7XG5cdFx0XHRsaXN0cy51bnNoaWZ0KG5ldyBMaXN0T2JqZWN0KGlkLCAnU3luY2hyb25pc2luZy4uLicpKVxuXHRcdFx0bGlzdCA9IGxpc3RzWzBdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsaXN0ID0gbGlzdHNbbG9jYWxJbmRleF07XG5cdFx0fVxuXHRcdGxpc3RSZWYub25jZSgndmFsdWUnLCBmdW5jdGlvbihzbmFwc2hvdCkge1xuXHRcdFx0bGlzdC5uYW1lID0gc25hcHNob3QudmFsKCkubmFtZTtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChzbmFwc2hvdC52YWwoKS5pdGVtcywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHR1cGRhdGVJdGVtKHZhbHVlKTtcblx0XHRcdH0pO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdmaXJlYmFzZVN5bmMnKTtcblx0XHR9KTtcblx0XHRsaXN0UmVmLmNoaWxkKCduYW1lJykub24oJ3ZhbHVlJywgZnVuY3Rpb24oc25hcHNob3QpIHtcblx0XHRcdGxpc3QubmFtZSA9IHNuYXBzaG90LnZhbCgpO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdmaXJlYmFzZVN5bmMnKTtcblx0XHR9KTtcblx0XHRsaXN0UmVmLmNoaWxkKCdpdGVtcycpLm9uKCdjaGlsZF9jaGFuZ2VkJywgZnVuY3Rpb24oc25hcHNob3QpIHtcblx0XHRcdHVwZGF0ZUl0ZW0oc25hcHNob3QudmFsKCkpXG5cdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2ZpcmViYXNlU3luYycpO1xuXHRcdH0pO1xuXHRcdGZ1bmN0aW9uIHVwZGF0ZUl0ZW0oaXRlbSkge1xuXHRcdFx0dmFyIGxvY2FsSXRlbUluZGV4ID0gbGlzdC5nZXRJdGVtSW5kZXhCeUlkKGl0ZW0uaWQpO1xuXHRcdFx0aWYgKGxvY2FsSXRlbUluZGV4IDwgMCkge1xuXHRcdFx0XHRsaXN0Lml0ZW1zLnB1c2goZ2V0RGF0YU9ubHlJdGVtKGl0ZW0pKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmIChsaXN0Lml0ZW1zW2xvY2FsSXRlbUluZGV4XSAhPSBpdGVtKSB7XG5cdFx0XHRcdFx0dXBkYXRlSXRlbURhdGEobGlzdC5pdGVtc1tsb2NhbEl0ZW1JbmRleF0sIGl0ZW0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbG9jYWxSZXRyaWV2ZSgpIHtcblx0XHR2YXIgcmV0cmlldmVkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0Jhc2tldHMnKTtcblx0XHRpZiAocmV0cmlldmVkKSB7XG5cdFx0XHR2YXIgcGFyc2VkID0gSlNPTi5wYXJzZShyZXRyaWV2ZWQpO1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHBhcnNlZC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIgbGlzdCA9IG5ldyBMaXN0T2JqZWN0KHBhcnNlZFtpXS5pZCwgcGFyc2VkW2ldLm5hbWUpO1xuXHRcdFx0XHRsaXN0Lml0ZW1zID0gcGFyc2VkW2ldLml0ZW1zO1xuXHRcdFx0XHRsaXN0cy5wdXNoKGxpc3QpO1xuXHRcdFx0XHRpbXBvcnRMaXN0KGxpc3QuaWQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGxvY2FsU2F2ZSgpIHtcblx0XHR2YXIganNvbiA9IEpTT04uc3RyaW5naWZ5KGxpc3RzKTtcblx0XHRpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0Jhc2tldHMnKSAhPT0ganNvbikge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oJ0Jhc2tldHMnLCBqc29uKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdDYW5ub3Qgc3RvcmUgZGF0YSB0byBsb2NhbCBzdG9yYWdlOiAnK2UpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRmdW5jdGlvbiBzeW5jQWxsKCkge1xuXHRcdGlmIChsb2NhbFNhdmUoKSkge1xuXHRcdFx0c3luY0N1cnJlbnRMaXN0KCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gc3luY0N1cnJlbnRMaXN0KCkge1xuXHRcdGlmIChnZXRDdXJyZW50TGlzdCgpKSB7XG5cdFx0XHR2YXIgaXRlbXMgPSBnZXREYXRhT25seUxpc3QoZ2V0Q3VycmVudExpc3QoKS5pZCk7XG5cdFx0XHRmaXJlUmVmLmNoaWxkKGdldEN1cnJlbnRMaXN0KCkuaWQpLmNoaWxkKCduYW1lJykuc2V0KGdldEN1cnJlbnRMaXN0KCkubmFtZSk7XG5cdFx0XHRmb3IgKHZhciBpPTA7IGk8aXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0ZmlyZVJlZi5jaGlsZChnZXRDdXJyZW50TGlzdCgpLmlkKS5jaGlsZCgnaXRlbXMnKS5jaGlsZChpdGVtc1tpXS5pZCkudXBkYXRlKGl0ZW1zW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdpZEdlbmVyYXRvcicsIGlkR2VuZXJhdG9yKTtcblxuZnVuY3Rpb24gaWRHZW5lcmF0b3IoKSB7XG5cblx0cmV0dXJuIHtcblx0XHRnZXQ6IGdldFVuaXFJZCxcblx0fTtcblxuXHRmdW5jdGlvbiBnZXRVbmlxSWQobGVuZ3RoKSB7XG5cdFx0cmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqTWF0aC5wb3coMzYsbGVuZ3RoKSkudG9TdHJpbmcoMzYpKS5zbGljZSgtbGVuZ3RoKTtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ3NoYXJlU2VydmljZScsIHNoYXJlU2VydmljZSk7XG5cbmZ1bmN0aW9uIHNoYXJlU2VydmljZSgpIHtcblxuXHRyZXR1cm4ge1xuXHRcdGdldExpbms6IGdldExpbmssXG5cdFx0d3JpdGVFbWFpbDogd3JpdGVFbWFpbCxcblx0fTtcblxuXHRmdW5jdGlvbiBnZXRMaW5rKGxpc3QpIHtcblx0XHRyZXR1cm4gbG9jYXRpb24ub3JpZ2luK2xvY2F0aW9uLnBhdGhuYW1lK1wiI2xpc3Q9XCIrbGlzdC5pZDtcblx0fVxuXG5cdGZ1bmN0aW9uIHdyaXRlRW1haWwobGlzdCkge1xuXHRcdHZhciByZXN1bHRzID0gW107XG5cdFx0cmVzdWx0cy5wdXNoKFwiQWRkIHRoaXMgbGlzdCB0byB5b3VyIEJhc2tldCBhdCBcIitnZXRMaW5rKGxpc3QpKTtcblx0XHRyZXN1bHRzLnB1c2goXCI9PT09PT09PT09PT09PT09PT09PVwiKTtcblx0XHRyZXN1bHRzLnB1c2gobGlzdC5uYW1lKTtcblx0XHRyZXN1bHRzLnB1c2goXCI9PT09PT09PT09PT09PT09PT09PVwiKTtcblx0XHRyZXN1bHRzLnB1c2goXCJcIik7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPGxpc3QuaXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBpdGVtID0gbGlzdC5pdGVtc1tpXTtcblx0XHRcdHJlc3VsdHMucHVzaChpdGVtLnRpdGxlKTtcblx0XHRcdHJlc3VsdHMucHVzaChcIlwiKTtcblx0XHRcdGlmIChpdGVtLm5vdGUpIHJlc3VsdHMucHVzaCgnTm90ZXM6ICcraXRlbS5ub3RlKTtcblx0XHRcdGlmIChpdGVtLmFzc2lnbikgcmVzdWx0cy5wdXNoKCdBc3NpZ25lZCB0byAnK2l0ZW0uYXNzaWduKTtcblx0XHRcdHJlc3VsdHMucHVzaChcIi0tLS0tLS0tLS0tLS0tLS0tLS0tXCIpO1xuXHRcdFx0cmVzdWx0cy5wdXNoKFwiXCIpO1xuXHRcdH1cblx0XHR2YXIgYm9keSA9IHJlc3VsdHMuam9pbignJTBBJyk7IC8vIG5ldyBsaW5lXG5cdFx0cmV0dXJuICdtYWlsdG86P2JvZHk9Jytib2R5O1xuXHR9XG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9