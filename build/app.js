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
		var link = shareService.getLink(list);
		var email = shareService.writeEmail(list);
		$mdDialog.show({
			templateUrl: './templates/shareDialog.html',
			locals: {
				url: link,
				email: email
			},
			clickOutsideToClose: true,
			targetEvent: e,
			controller: ["$scope", "url", "email", function($scope, url, email) {
				$scope.url = url;
				$scope.email = email;
			}]
		});
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
		}, delay);
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
		var body = results.join('\n'); // new line
		return 'mailto:?body='+encodeURIComponent(body);
	}
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9MaXN0c0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2JrSXRlbS5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0SW5mby5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0Vmlldy5qcyIsInNlcnZpY2VzL0l0ZW1PYmplY3QuanMiLCJzZXJ2aWNlcy9MaXN0T2JqZWN0LmpzIiwic2VydmljZXMvYWxsTGlzdHNTZXJ2aWNlLmpzIiwic2VydmljZXMvaWRHZW5lcmF0b3IuanMiLCJzZXJ2aWNlcy9zaGFyZVNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxPQUFPLFlBQVk7Q0FDdEIsY0FBYzs7O0FBR2YsSUFBSSxNQUFNLFFBQVEsT0FBTyxPQUFPLENBQUM7S0FDNUIsU0FBUyxXQUFXLENBQUMsWUFBWTtBQUN0QztBQ05BO0VBQ0UsT0FBTztFQUNQLFdBQVcsb0JBQW9COztBQUVqQyxTQUFTLGlCQUFpQixZQUFZLFVBQVUsaUJBQWlCLFVBQVUsU0FBUyxRQUFRLFdBQVcsY0FBYztDQUNwSCxJQUFJLEtBQUs7Q0FDVCxHQUFHLGtCQUFrQjtDQUNyQixHQUFHLGlCQUFpQjtDQUNwQixHQUFHLGlCQUFpQjtDQUNwQixHQUFHLFlBQVk7Q0FDZixHQUFHLFVBQVU7OztDQUdiLGdCQUFnQjtDQUNoQixZQUFZLGdCQUFnQixTQUFTOztDQUVyQyxPQUFPLElBQUksZ0JBQWdCLFdBQVc7RUFDckMsT0FBTzs7O0NBR1IsSUFBSSxTQUFTLEtBQUssVUFBVSxHQUFHLFFBQVEsYUFBYSxHQUFHO0VBQ3RELGdCQUFnQixXQUFXLFNBQVMsS0FBSyxVQUFVOztDQUVwRCxPQUFPLG1CQUFtQixnQkFBZ0I7O0NBRTFDLFNBQVMsVUFBVSxNQUFNLEdBQUc7RUFDM0IsSUFBSSxPQUFPLGFBQWEsUUFBUTtFQUNo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R0FDYixJQUFJLEtBQUssTUFBTSxRQUFRLEtBQUssVUFBVSxLQUFLO0dBQzNDLElBQUksS0FBSyxRQUFRLFFBQVEsS0FBSyxlQUFlLEtBQUs7R0FDbEQsUUFBUSxLQUFLO0dBQ2IsUUFBUSxLQUFLOztFQUVkLElBQUksT0FBTyxRQUFRLEtBQUs7RUFDeEIsT0FBTyxnQkFBZ0IsbUJBQW1COztDQUUzQyIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpZiAod2luZG93LkZpbGVSZWFkZXIpIHtcblx0ZmlsZVN1cHBvcnQgPSB0cnVlO1xufVxuXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFsnbmdNYXRlcmlhbCddKVxuXHRcdFx0XHQuY29uc3RhbnQoJ3N1cHBvcnQnLCB7ZmlsZVJlYWRlcjogZmlsZVN1cHBvcnR9KTtcbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0Jhc2tldENvbnRyb2xsZXInLCBCYXNrZXRDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gQmFza2V0Q29udHJvbGxlcigkbWRTaWRlbmF2LCAkbWRNZWRpYSwgYWxsTGlzdHNTZXJ2aWNlLCAkbWRUb2FzdCwgc3VwcG9ydCwgJHNjb3BlLCAkbWREaWFsb2csIHNoYXJlU2VydmljZSkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXHR2bS50b2dnbGVMaXN0c1ZpZXcgPSB0b2dnbGVMaXN0c1ZpZXc7XG5cdHZtLmNsb3NlTGlzdHNWaWV3ID0gY2xvc2VMaXN0c1ZpZXc7XG5cdHZtLmRlbGV0ZUxpc3RCeUlkID0gZGVsZXRlTGlzdEJ5SWQ7XG5cdHZtLnNoYXJlTGlzdCA9IHNoYXJlTGlzdDtcblx0dm0uc3VwcG9ydCA9IHN1cHBvcnQ7XG5cblx0Ly8gbG9hZC9zYXZlIGRhdGFcblx0YWxsTGlzdHNTZXJ2aWNlLnN5bmNBbGwoKTtcblx0c2V0SW50ZXJ2YWwoYWxsTGlzdHNTZXJ2aWNlLnN5bmNBbGwsIDUwMDApO1xuXG5cdCRzY29wZS4kb24oJ2ZpcmViYXNlU3luYycsIGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS4kYXBwbHkoKTtcblx0fSk7XG5cblx0aWYgKGxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDEpLmluZGV4T2YoJ2xpc3Q9JykgPT09IDApIHtcblx0XHRhbGxMaXN0c1NlcnZpY2UuaW1wb3J0TGlzdChsb2NhdGlvbi5oYXNoLnN1YnN0cmluZyg2KSk7XG5cdH1cblx0d2luZG93LmltcG9ydEJhc2tldExpc3QgPSBhbGxMaXN0c1NlcnZpY2UuaW1wb3J0TGlzdDtcblxuXHRmdW5jdGlvbiBzaGFyZUxpc3QobGlzdCwgZSkge1xuXHRcdHZhciBsaW5rID0gc2hhcmVTZXJ2aWNlLmdldExpbmsobGlzdCk7XG5cdFx0dmFyIGVtYWlsID0gc2hhcmVTZXJ2aWNlLndyaXRlRW1haWwobGlzdCk7XG5cdFx0JG1kRGlhbG9nLnNob3coe1xuXHRcdFx0dGVtcGxhdGVVcmw6ICcuL3RlbXBsYXRlcy9zaGFyZURpYWxvZy5odG1sJyxcblx0XHRcdGxvY2Fsczoge1xuXHRcdFx0XHR1cmw6IGxpbmssXG5cdFx0XHRcdGVtYWlsOiBlbWFpbFxuXHRcdFx0fSxcblx0XHRcdGNsaWNrT3V0c2lkZVRvQ2xvc2U6IHRydWUsXG5cdFx0XHR0YXJnZXRFdmVudDogZSxcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgdXJsLCBlbWFpbCkge1xuXHRcdFx0XHQkc2NvcGUudXJsID0gdXJsO1xuXHRcdFx0XHQkc2NvcGUuZW1haWwgPSBlbWFpbDtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdC8vIHNpZGVuYXYgYmVoYXZpb3VyXG5cdHZtLiRtZE1lZGlhID0gJG1kTWVkaWE7XG5cdGlmICghdm0uJG1kTWVkaWEoJ2xnJykpIHtcblx0XHR2bS5saXN0c1ZpZXdPcGVuID0gdHJ1ZTtcblx0fVxuXHRmdW5jdGlvbiB0b2dnbGVMaXN0c1ZpZXcoKSB7XG5cdFx0JG1kU2lkZW5hdignbGVmdCcpLnRvZ2dsZSgpO1xuXHR9XG5cdGZ1bmN0aW9uIGNsb3NlTGlzdHNWaWV3KCkge1xuXHRcdCRtZFNpZGVuYXYoJ2xlZnQnKS5jbG9zZSgpO1xuXHR9XG5cblx0Ly8gTGlzdHMgZGVsZXRlIG9wZXJhdGlvbnNcblx0ZnVuY3Rpb24gZGVsZXRlTGlzdEJ5SWQoaWQpIHtcblx0XHQvLyBzaG93IHVuZG8gdG9hc3Rcblx0XHR2YXIgZGVsZXRlVG9hc3QgPSAkbWRUb2FzdC5zaW1wbGUoKS5jb250ZW50KCdMaXN0IERlbGV0ZWQnKS5hY3Rpb24oJ1VuZG8nKS5oaWdobGlnaHRBY3Rpb24odHJ1ZSk7XG5cdFx0JG1kVG9hc3Quc2hvdyhkZWxldGVUb2FzdCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0aWYgKHJlc3BvbnNlID09PSAnb2snKSB7XG5cdFx0XHRcdHVuZG9EZWxldGUoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHQvLyBwZXJmb3JtIGRlbGV0ZVxuXHRcdGFsbExpc3RzU2VydmljZS5kZWxldGVMaXN0KGlkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0JG1kVG9hc3QuaGlkZSgpO1xuXHRcdH0pO1xuXHRcdC8vIGhpZGUgY3VycmVudGx5IGVkaXRpbmcgbGlzdFxuXHRcdCRtZFNpZGVuYXYoJ2xlZnQnKS5vcGVuKCk7XG5cdH1cblxuXHRmdW5jdGlvbiB1bmRvRGVsZXRlKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5jYW5jZWxEZWxldGUoKTtcblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignSXRlbXNDb250cm9sbGVyJywgSXRlbXNDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gSXRlbXNDb250cm9sbGVyKGFsbExpc3RzU2VydmljZSwgJG1kVG9hc3QsICRtZE1lZGlhKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cblx0dm0uYWRkSXRlbSA9IGFkZEl0ZW07XG5cdHZtLmdldEN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXHR2bS5kZWxldGVJdGVtID0gZGVsZXRlSXRlbTtcblx0dm0uc2VhcmNoTmFtZSA9IHNlYXJjaE5hbWU7XG5cdHZtLmdldFBob3RvID0gZ2V0UGhvdG87XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHRpZiAoIWFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpKSB7XG5cdFx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0XHR9XG5cdFx0dm0uZ2V0Q3VycmVudExpc3QoKS5hZGRJdGVtKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWxldGVJdGVtKGlkKSB7XG5cdFx0Ly8gc2hvdyB1bmRvIHRvYXN0XG5cdFx0dmFyIGRlbGV0ZVRvYXN0ID0gJG1kVG9hc3Quc2ltcGxlKCkuY29udGVudCgnSXRlbSBEZWxldGVkJykuYWN0aW9uKCdVbmRvJykuaGlnaGxpZ2h0QWN0aW9uKHRydWUpO1xuXHRcdCRtZFRvYXN0LnNob3coZGVsZXRlVG9hc3QpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZSA9PT0gJ29rJykge1xuXHRcdFx0XHR1bmRvRGVsZXRlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcGVyZm9ybSBkZWxldGVcblx0XHRhbGxMaXN0c1NlcnZpY2UuZGVsZXRlSXRlbShpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRtZFRvYXN0LmhpZGUoKTtcblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVuZG9EZWxldGUoKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmNhbmNlbERlbGV0ZSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2VhcmNoTmFtZShxdWVyeSkge1xuXHRcdHZhciBhbGxJdGVtcyA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpLml0ZW1zO1xuXHRcdHZhciBuYW1lcyA9IFtxdWVyeV07XG5cdFx0Ly8gZ2V0IGxpc3Qgb2YgYWxsIHVuaXF1ZSBuYW1lc1xuXHRcdGZvciAodmFyIGk9MDsgaTxhbGxJdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIG5hbWUgPSBhbGxJdGVtc1tpXS5hc3NpZ247XG5cdFx0XHRpZiAobmFtZSAmJiBuYW1lcy5pbmRleE9mKG5hbWUpIDwgMCkgeyAvLyBpZiBuYW1lIGlzbid0IGFscmVhZHkgaW4gbGlzdFxuXHRcdFx0XHRuYW1lcy5wdXNoKG5hbWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBmaW5kIG1hdGNoZWQgbmFtZXNcblx0XHR2YXIgbWF0Y2hlcyA9IG5hbWVzLmZpbHRlcihmdW5jdGlvbihuYW1lKSB7XG5cdFx0XHRyZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkudG9Mb3dlckNhc2UoKSkgPT09IDA7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIG1hdGNoZXM7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRQaG90byhpZCwgcHJvbWlzZSkge1xuXHRcdHZhciBsaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0KCk7XG5cdFx0dmFyIGluZGV4ID0gbGlzdC5nZXRJdGVtSW5kZXhCeUlkKGlkKTtcblx0XHR2YXIgbG9hZGluZ0ljb24gPSBcImRhdGE6aW1hZ2Uvc3ZnK3htbCwlM0NzdmclMjB4bWxucyUzRCUyMmh0dHAlM0EvL3d3dy53My5vcmcvMjAwMC9zdmclMjIlMjB2aWV3Qm94JTNEJTIyMCUyMDAlMjAzMiUyMDMyJTIyJTIwd2lkdGglM0QlMjIzMiUyMiUyMGhlaWdodCUzRCUyMjMyJTIyJTIwZmlsbCUzRCUyMmJsYWNrJTIyJTNFJTBBJTIwJTIwJTNDY2lyY2xlJTIwdHJhbnNmb3JtJTNEJTIydHJhbnNsYXRlJTI4OCUyMDAlMjklMjIlMjBjeCUzRCUyMjAlMjIlMjBjeSUzRCUyMjE2JTIyJTIwciUzRCUyMjAlMjIlM0UlMjAlMEElMjAlMjAlMjAlMjAlM0NhbmltYXRlJTIwYXR0cmlidXRlTmFtZSUzRCUyMnIlMjIlMjB2YWx1ZXMlM0QlMjIwJTNCJTIwNCUzQiUyMDAlM0IlMjAwJTIyJTIwZHVyJTNEJTIyMS4ycyUyMiUyMHJlcGVhdENvdW50JTNEJTIyaW5kZWZpbml0ZSUyMiUyMGJlZ2luJTNEJTIyMCUyMiUwQSUyMCUyMCUyMCUyMCUyMCUyMGtleXRpbWVzJTNEJTIyMCUzQjAuMiUzQjAuNyUzQjElMjIlMjBrZXlTcGxpbmVzJTNEJTIyMC4yJTIwMC4yJTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTIyJTIwY2FsY01vZGUlM0QlMjJzcGxpbmUlMjIlMjAvJTNFJTBBJTIwJTIwJTNDL2NpcmNsZSUzRSUwQSUyMCUyMCUzQ2NpcmNsZSUyMHRyYW5zZm9ybSUzRCUyMnRyYW5zbGF0ZSUyODE2JTIwMCUyOSUyMiUyMGN4JTNEJTIyMCUyMiUyMGN5JTNEJTIyMTYlMjIlMjByJTNEJTIyMCUyMiUzRSUyMCUwQSUyMCUyMCUyMCUyMCUzQ2FuaW1hdGUlMjBhdHRyaWJ1dGVOYW1lJTNEJTIyciUyMiUyMHZhbHVlcyUzRCUyMjAlM0IlMjA0JTNCJTIwMCUzQiUyMDAlMjIlMjBkdXIlM0QlMjIxLjJzJTIyJTIwcmVwZWF0Q291bnQlM0QlMjJpbmRlZmluaXRlJTIyJTIwYmVnaW4lM0QlMjIwLjMlMjIlMEElMjAlMjAlMjAlMjAlMjAlMjBrZXl0aW1lcyUzRCUyMjAlM0IwLjIlM0IwLjclM0IxJTIyJTIwa2V5U3BsaW5lcyUzRCUyMjAuMiUyMDAuMiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUyMiUyMGNhbGNNb2RlJTNEJTIyc3BsaW5lJTIyJTIwLyUzRSUwQSUyMCUyMCUzQy9jaXJjbGUlM0UlMEElMjAlMjAlM0NjaXJjbGUlMjB0cmFuc2Zvcm0lM0QlMjJ0cmFuc2xhdGUlMjgyNCUyMDAlMjklMjIlMjBjeCUzRCUyMjAlMjIlMjBjeSUzRCUyMjE2JTIyJTIwciUzRCUyMjAlMjIlM0UlMjAlMEElMjAlMjAlMjAlMjAlM0NhbmltYXRlJTIwYXR0cmlidXRlTmFtZSUzRCUyMnIlMjIlMjB2YWx1ZXMlM0QlMjIwJTNCJTIwNCUzQiUyMDAlM0IlMjAwJTIyJTIwZHVyJTNEJTIyMS4ycyUyMiUyMHJlcGVhdENvdW50JTNEJTIyaW5kZWZpbml0ZSUyMiUyMGJlZ2luJTNEJTIyMC42JTIyJTBBJTIwJTIwJTIwJTIwJTIwJTIwa2V5dGltZXMlM0QlMjIwJTNCMC4yJTNCMC43JTNCMSUyMiUyMGtleVNwbGluZXMlM0QlMjIwLjIlMjAwLjIlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglMjIlMjBjYWxjTW9kZSUzRCUyMnNwbGluZSUyMiUyMC8lM0UlMEElMjAlMjAlM0MvY2lyY2xlJTNFJTBBJTNDL3N2ZyUzRVwiO1xuXHRcdC8vIHNldCBhcyBsb2FkaW5nIGljb24gb24gbW9iaWxlXG5cdFx0cHJvbWlzZS50aGVuKGZ1bmN0aW9uKGZpbGUpe1xuXHRcdFx0bGlzdC5pdGVtc1tpbmRleF0ucGhvdG8gPSBmaWxlO1xuXHRcdH0sIG51bGxcblx0XHQsIGZ1bmN0aW9uKHVwZGF0ZSkge1xuXHRcdFx0aWYgKHVwZGF0ZSA9PT0gJ2dldHRpbmcnKSB7XG5cdFx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLnBob3RvID0gbG9hZGluZ0ljb247XG5cdFx0XHR9IGVsc2UgaWYgKHVwZGF0ZSA9PT0gJ25vSW1hZ2UnKSB7XG5cdFx0XHRcdGlmIChsaXN0Lml0ZW1zW2luZGV4XS5waG90byA9PSBsb2FkaW5nSWNvbikge1xuXHRcdFx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLnBob3RvID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0xpc3RzQ29udHJvbGxlcicsIExpc3RzQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIExpc3RzQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblxuXHR2YXIgdm0gPSB0aGlzO1xuXHRcblx0dm0ubGlzdHMgPSBhbGxMaXN0c1NlcnZpY2UubGlzdHM7XG5cblx0dm0uYWRkTGlzdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChhbGxMaXN0c1NlcnZpY2UuYWRkKCkpO1xuXHR9O1xuXG5cdHZtLmN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0l0ZW0nLCBia0l0ZW0pO1xuXG5mdW5jdGlvbiBia0l0ZW0oJHEpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdHRlbXBsYXRlVXJsOiAnLi90ZW1wbGF0ZXMvYmtJdGVtLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdJdGVtc0NvbnRyb2xsZXInLFxuXHRcdGNvbnRyb2xsZXJBczogJ0l0ZW1zJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHQvLyBFbmQgY3VzdG9tIGVkaXQgbW9kZSBvbiBjbGlja1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cblx0XHR2YXIgbGlzdFZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbYmstbGlzdC12aWV3XScpO1xuXHRcdHZhciBhc3NpZ25JbnB1dDtcblxuXHRcdC8vIEVudGVyIGFzc2lnbiBtb2RlXG5cdFx0ZnVuY3Rpb24gZW50ZXJBc3NpZ25Nb2RlKCkge1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcyhcImVkaXRhYmxlIGVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdFx0YXNzaWduSW5wdXQuc2VsZWN0KCk7IC8vIGlPUyBmaXhcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGFzc2lnbklucHV0LmZvY3VzKCk7IH0sIDEwMCk7IC8vIGRlbGF5IHRvIHdhaXQgZm9yIGNsYXNzZXMgdG8gYXBwbHlcblx0XHRcdGxpc3RWaWV3LmNsYXNzTGlzdC5hZGQoXCJoYXNFZGl0YWJsZUl0ZW1cIik7XG5cdFx0fVxuXG5cdFx0Ly8gUGhvdG8gc2VsZWN0XG5cdFx0dmFyIHBob3RvSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LnBob3RvJyk7XG5cdFx0dmFyIGZpbGVEZWZlcjtcblx0XHR2YXIgd2FpdGluZ0lucHV0ID0gMDtcblx0XHRmdW5jdGlvbiBwaG90b1Byb21wdCgpIHtcblx0XHRcdGZpbGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0XHRzY29wZS5JdGVtcy5nZXRQaG90byhhdHRycy5pdGVtSWQsIGZpbGVEZWZlci5wcm9taXNlKTtcblx0XHRcdHBob3RvSW5wdXQuY2xpY2soKTtcblx0XHRcdHBob3RvSW5wdXQudmFsdWUgPSBudWxsO1xuXHRcdH1cblx0XHRmdW5jdGlvbiBwaG90b1Byb21wdENsb3NlKCkge1xuXHRcdFx0aWYgKHdhaXRpbmdJbnB1dCA+IDApIHtcblx0XHRcdFx0d2FpdGluZ0lucHV0ID0gMDtcblx0XHRcdFx0aWYgKGZpbGVEZWZlcikgZmlsZURlZmVyLm5vdGlmeSgnbm9JbWFnZScpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0d2FpdGluZ0lucHV0Kys7XG5cdFx0XHRcdGlmIChmaWxlRGVmZXIpIGZpbGVEZWZlci5ub3RpZnkoJ2dldHRpbmcnKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cGhvdG9JbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHR2YXIgZmlsZSA9IGUudGFyZ2V0LmZpbGVzWzBdO1xuXHRcdFx0d2FpdGluZ0lucHV0ID0gMDtcblx0XHRcdGlmIChmaWxlKSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXHRcdFx0XHRyZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0ZmlsZURlZmVyLnJlc29sdmUocmVhZGVyLnJlc3VsdCk7XG5cdFx0XHRcdFx0ZmlsZURlZmVyID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignaW1nLnBob3RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZWxlbWVudC50b2dnbGVDbGFzcygncGhvdG9WaWV3Jyk7XG5cdFx0fSk7XG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWVkaWEnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKCdwaG90b1ZpZXcnKTtcblx0XHR9KTtcblxuXHRcdC8vIFRvZ2dsZSBpdGVtIGRvbmVuZXNzXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24uZG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50LnRvZ2dsZUNsYXNzKFwiZG9uZVwiKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlXCIpO1xuXHRcdFx0bGlzdFZpZXcuY2xhc3NMaXN0LnJlbW92ZShcImhhc0VkaXRhYmxlSXRlbVwiKTtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cdFx0XG5cdFx0Ly8gUmVhdHRhY2ggbGlzdGVuZXIgdG8gYnV0dG9ucyBvbiBzY3JlZW4gc2l6ZSBjaGFuZ2Vcblx0XHR2YXIgYXNzaWduQnV0dG9uID0gZ2V0QXNzaWduQnV0dG9uKCk7XG5cdFx0dmFyIHBob3RvQnV0dG9uID0gZ2V0UGhvdG9CdXR0b24oKTtcblx0XHRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBzY29wZS5NYWluLiRtZE1lZGlhKCdtZCcpOyB9LCBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChhc3NpZ25CdXR0b24pIHtcblx0XHRcdFx0YXNzaWduQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJBc3NpZ25Nb2RlKTtcblx0XHRcdH1cblx0XHRcdGFzc2lnbkJ1dHRvbiA9IGdldEFzc2lnbkJ1dHRvbigpO1xuXHRcdFx0aWYgKGFzc2lnbkJ1dHRvbikge1xuXHRcdFx0XHRhc3NpZ25CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlbnRlckFzc2lnbk1vZGUpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHBob3RvQnV0dG9uKSB7XG5cdFx0XHRcdHBob3RvQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcGhvdG9Qcm9tcHQpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCBwaG90b1Byb21wdENsb3NlKTtcblx0XHRcdH1cblx0XHRcdHBob3RvQnV0dG9uID0gZ2V0UGhvdG9CdXR0b24oKTtcblx0XHRcdGlmIChwaG90b0J1dHRvbikge1xuXHRcdFx0XHRwaG90b0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHBob3RvUHJvbXB0KTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgcGhvdG9Qcm9tcHRDbG9zZSk7XG5cdFx0XHR9XG5cdFx0XHQvLyBQcmV2ZW50IGVuZGluZyBlZGl0IG1vZGUgd2hlbiBjbGlja2luZyBidXR0b25cblx0XHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSk7XG5cdFx0XHQvLyBpT1MgZml4IHRvIGRlc2VsZWN0IGJ1dHRvblxuXHRcdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbigndG91Y2hzdGFydCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBEZWxheSBxdWVyeWluZyBmb3IgaW5wdXQgdW50aWwgZWxlbWVudCBjcmVhdGVkXG5cdFx0XHRhc3NpZ25JbnB1dCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignbWQtYXV0b2NvbXBsZXRlLmFzc2lnbiBpbnB1dCcpO1xuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gc2VsZWN0aW5nIGlucHV0XG5cdFx0XHRlbGVtZW50LmZpbmQoJ21kLWlucHV0LWNvbnRhaW5lcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdH0sIDEwMCk7XG5cblx0XHQvLyBMZWF2ZSBjdXN0b20gZWRpdCBtb2RlXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3QoKSB7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKFwiZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ2V0QXNzaWduQnV0dG9uKCkge1xuXHRcdFx0cmV0dXJuIGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmFzc2lnbicpO1xuXHRcdH1cblx0XHRmdW5jdGlvbiBnZXRQaG90b0J1dHRvbigpIHtcblx0XHRcdHJldHVybiBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5waG90bycpO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RJbmZvJywgYmtMaXN0SW5mbyk7XG5cbmZ1bmN0aW9uIGJrTGlzdEluZm8oYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrTGlzdEluZm8uaHRtbCdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHsgYWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KHNjb3BlLmxpc3QpIH0pO1xuXHRcdH0pO1xuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RWaWV3JywgYmtMaXN0Vmlldyk7XG5cbmZ1bmN0aW9uIGJrTGlzdFZpZXcoKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cblx0XHR2YXIgc3ViaGVhZGVyID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJyk7XG5cdFx0dmFyIHRpdGxlSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgaW5wdXQnKTtcblxuXHRcdC8vIENsaWNrIG91dHNpZGUgb2YgaXRlbXMgdG8gZXhpdCBlZGl0IG1vZGVcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRpZiAoZS50YXJnZXQpIHtcblx0XHRcdFx0dmFyIGJrSXRlbSA9IGlzQmtJdGVtQ2hpbGQoZS50YXJnZXQpO1xuXHRcdFx0XHRpZiAoYmtJdGVtKSB7XG5cdFx0XHRcdFx0bWFrZUl0ZW1FZGl0YWJsZShia0l0ZW0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBQcmV2ZW50IGxvc2luZyBmb2N1cyBvbiBidXR0b24gY2xpY2tzXG5cdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gTWFrZSB0aXRsZSBlZGl0YWJsZSBvbiBjbGlja1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlciAubmFtZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRtYWtlVGl0bGVFZGl0YWJsZSgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gRXhpdCB0aXRsZSBlZGl0IG1vZGUgb24gdGl0bGUgaW5wdXQgbG9zaW5nIGZvY3VzXG5cdFx0dGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXInKS5jbGFzc0xpc3QucmVtb3ZlKCdlZGl0YWJsZScpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gU3dpdGNoIGZvY3VzIHRvIG5ldyBpdGVtXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24ubmV3SXRlbScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIG5ld0l0ZW0gPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2JrLWl0ZW0nKTtcblx0XHRcdGlmIChuZXdJdGVtKSB7XG5cdFx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUobmV3SXRlbSk7XG5cdFx0XHRcdHZhciB0aXRsZSA9IG5ld0l0ZW0ucXVlcnlTZWxlY3RvcignLnRpdGxlIGlucHV0Jyk7XG5cdFx0XHRcdC8vIGZvY3VzIHRpdGxlIGZpZWxkIGJ5IGRlZmF1bHQ7IGRlbGF5IHRvIHdhaXQgZm9yIHN0eWxlIHRvIHRha2UgZWZmZWN0XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRpdGxlLmZvY3VzKCk7IH0sIDEwMCk7XG5cdFx0XHRcdHRpdGxlLnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRcdHdpbmRvdy5zY3JvbGwoMSwxKTsgLy8gaU9TIGZpeFxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gbWFrZVRpdGxlRWRpdGFibGUoKSB7XG5cdFx0XHRzdWJoZWFkZXIuY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdHRpdGxlSW5wdXQuZm9jdXMoKTtcblx0XHR9XG5cdFx0c2NvcGUubWFrZVRpdGxlRWRpdGFibGUgPSBtYWtlVGl0bGVFZGl0YWJsZTtcblxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuXHRcdFx0ZWxlbWVudC5maW5kKCdiay1pdGVtJykucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG1ha2VJdGVtRWRpdGFibGUoaXRlbSkge1xuXHRcdFx0aXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcygnaGFzRWRpdGFibGVJdGVtJyk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaXNCa0l0ZW1DaGlsZChub2RlKSB7XG5cdFx0XHR2YXIgaXNDYXJkQ29udGVudCA9IGZhbHNlO1xuXHRcdFx0d2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gZWxlbWVudFswXSkge1xuXHRcdFx0XHRpZiAobm9kZS5ub2RlTmFtZSA9PT0gJ01ELUNBUkQtQ09OVEVOVCcpIHtcblx0XHRcdFx0XHRpc0NhcmRDb250ZW50ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoaXNDYXJkQ29udGVudCAmJiBub2RlLm5vZGVOYW1lID09PSAnQkstSVRFTScpIHtcblx0XHRcdFx0XHRyZXR1cm4gbm9kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnSXRlbU9iamVjdCcsIEl0ZW1PYmplY3QpO1xuXG5mdW5jdGlvbiBJdGVtT2JqZWN0KCkge1xuXG5cdHZhciBpdGVtT2JqZWN0ID0gZnVuY3Rpb24oaWQpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy50aXRsZSA9ICcnO1xuXHRcdHRoaXMubm90ZSA9ICcnO1xuXHRcdHRoaXMuYXNzaWduID0gJyc7XG5cdFx0dGhpcy5kb25lID0gZmFsc2U7XG5cdFx0dGhpcy5sYXN0RWRpdGVkID0gRGF0ZS5ub3coKTtcblx0fVxuXG5cdHJldHVybiBpdGVtT2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnTGlzdE9iamVjdCcsIExpc3RPYmplY3QpO1xuXG5mdW5jdGlvbiBMaXN0T2JqZWN0KEl0ZW1PYmplY3QsIGlkR2VuZXJhdG9yKSB7XG5cblx0dmFyIGxpc3RPYmplY3QgPSBmdW5jdGlvbihpZCwgbmFtZSkge1xuXHRcdHRoaXMuaWQgPSBpZDtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuaXRlbXMgPSBbXTtcblx0XHR0aGlzLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHRcdHRoaXMuZ2V0SXRlbUluZGV4QnlJZCA9IGdldEl0ZW1JbmRleEJ5SWQ7XG5cdFx0dGhpcy5nZXREZXNjcmlwdGlvbiA9IGdldERlc2NyaXB0aW9uO1xuXHR9XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHR0aGlzLml0ZW1zLnVuc2hpZnQobmV3IEl0ZW1PYmplY3QoaWRHZW5lcmF0b3IuZ2V0KDQpKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRJdGVtSW5kZXhCeUlkKGlkKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuaXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICh0aGlzLml0ZW1zW2ldLmlkID09PSBpZCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGVzY3JpcHRpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKCFpdGVtLmRvbmUpIHJldHVybiBpdGVtLnRpdGxlIH0pXG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9KS8vIGdldCBub24tZW1wdHkgaXRlbXNcblx0XHRcdFx0XHRcdC5qb2luKCcsICcpO1xuXHR9XG5cblx0cmV0dXJuIGxpc3RPYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdhbGxMaXN0c1NlcnZpY2UnLCBhbGxMaXN0c1NlcnZpY2UpO1xuXG5mdW5jdGlvbiBhbGxMaXN0c1NlcnZpY2UoTGlzdE9iamVjdCwgJHEsIGlkR2VuZXJhdG9yLCAkcm9vdFNjb3BlKSB7XG5cblx0dmFyIGxpc3RzID0gW107XG5cdHZhciBjdXJyZW50TGlzdElkID0gdW5kZWZpbmVkO1xuXHR2YXIgZGVsZXRlVGltZXI7XG5cdHZhciBkZWxldGVEZWZlcjtcblx0dmFyIGRlbGV0aW5nTGlzdElkO1xuXHR2YXIgZGVsZXRpbmdJdGVtSWQ7XG5cdHZhciBmaXJlUmVmID0gbmV3IEZpcmViYXNlKFwiaHR0cHM6Ly90b3JyaWQtZmlyZS02MjY2LmZpcmViYXNlaW8uY29tL1wiKTtcblx0bG9jYWxSZXRyaWV2ZSgpO1xuXG5cdHJldHVybiB7XG5cdFx0YWRkOiBhZGQsXG5cdFx0bGlzdHM6IGxpc3RzLFxuXHRcdHNldEN1cnJlbnRMaXN0OiBzZXRDdXJyZW50TGlzdCxcblx0XHRnZXRDdXJyZW50TGlzdDogZ2V0Q3VycmVudExpc3QsXG5cdFx0ZGVsZXRlTGlzdDogZGVsZXRlTGlzdCxcblx0XHRkZWxldGVJdGVtOiBkZWxldGVJdGVtLFxuXHRcdGNhbmNlbERlbGV0ZTogY2FuY2VsRGVsZXRlLFxuXHRcdHN5bmNBbGw6IHN5bmNBbGwsXG5cdFx0aW1wb3J0TGlzdDogaW1wb3J0TGlzdCxcblx0fTtcblxuXHRmdW5jdGlvbiBhZGQoKSB7XG5cdFx0bGlzdHMudW5zaGlmdChcblx0XHRcdG5ldyBMaXN0T2JqZWN0KGlkR2VuZXJhdG9yLmdldCg4KSwgXCJOZXcgTGlzdCBcIisobGlzdHMubGVuZ3RoKzEpKVxuXHRcdCk7XG5cdFx0cmV0dXJuIGxpc3RzWzBdO1xuXHR9XG5cblx0ZnVuY3Rpb24gZmluZExpc3RJbmRleEJ5SWQoaWQpIHtcblx0XHRmb3IgKHZhciBpPTA7IGk8bGlzdHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChsaXN0c1tpXS5pZCA9PT0gaWQpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAtMTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZUl0ZW1EYXRhKGl0ZW0sIHZhbHVlcykge1xuXHRcdGl0ZW0uaWQgPSB2YWx1ZXMuaWQ7XG5cdFx0aXRlbS50aXRsZSA9IHZhbHVlcy50aXRsZTtcblx0XHRpdGVtLm5vdGUgPSB2YWx1ZXMubm90ZTtcblx0XHRpdGVtLmFzc2lnbiA9IHZhbHVlcy5hc3NpZ247XG5cdFx0aXRlbS5hdWRpbyA9IHZhbHVlcy5hdWRpbztcblx0XHRpdGVtLnBob3RvID0gdmFsdWVzLnBob3RvO1xuXHRcdGlmIChpdGVtLnBob3RvID09IFwiZGF0YTppbWFnZS9zdmcreG1sLCUzQ3N2ZyUyMHhtbG5zJTNEJTIyaHR0cCUzQS8vd3d3LnczLm9yZy8yMDAwL3N2ZyUyMiUyMHZpZXdCb3glM0QlMjIwJTIwMCUyMDMyJTIwMzIlMjIlMjB3aWR0aCUzRCUyMjMyJTIyJTIwaGVpZ2h0JTNEJTIyMzIlMjIlMjBmaWxsJTNEJTIyYmxhY2slMjIlM0UlMEElMjAlMjAlM0NjaXJjbGUlMjB0cmFuc2Zvcm0lM0QlMjJ0cmFuc2xhdGUlMjg4JTIwMCUyOSUyMiUyMGN4JTNEJTIyMCUyMiUyMGN5JTNEJTIyMTYlMjIlMjByJTNEJTIyMCUyMiUzRSUyMCUwQSUyMCUyMCUyMCUyMCUzQ2FuaW1hdGUlMjBhdHRyaWJ1dGVOYW1lJTNEJTIyciUyMiUyMHZhbHVlcyUzRCUyMjAlM0IlMjA0JTNCJTIwMCUzQiUyMDAlMjIlMjBkdXIlM0QlMjIxLjJzJTIyJTIwcmVwZWF0Q291bnQlM0QlMjJpbmRlZmluaXRlJTIyJTIwYmVnaW4lM0QlMjIwJTIyJTBBJTIwJTIwJTIwJTIwJTIwJTIwa2V5dGltZXMlM0QlMjIwJTNCMC4yJTNCMC43JTNCMSUyMiUyMGtleVNwbGluZXMlM0QlMjIwLjIlMjAwLjIlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglMjIlMjBjYWxjTW9kZSUzRCUyMnNwbGluZSUyMiUyMC8lM0UlMEElMjAlMjAlM0MvY2lyY2xlJTNFJTBBJTIwJTIwJTNDY2lyY2xlJTIwdHJhbnNmb3JtJTNEJTIydHJhbnNsYXRlJTI4MTYlMjAwJTI5JTIyJTIwY3glM0QlMjIwJTIyJTIwY3klM0QlMjIxNiUyMiUyMHIlM0QlMjIwJTIyJTNFJTIwJTBBJTIwJTIwJTIwJTIwJTNDYW5pbWF0ZSUyMGF0dHJpYnV0ZU5hbWUlM0QlMjJyJTIyJTIwdmFsdWVzJTNEJTIyMCUzQiUyMDQlM0IlMjAwJTNCJTIwMCUyMiUyMGR1ciUzRCUyMjEuMnMlMjIlMjByZXBlYXRDb3VudCUzRCUyMmluZGVmaW5pdGUlMjIlMjBiZWdpbiUzRCUyMjAuMyUyMiUwQSUyMCUyMCUyMCUyMCUyMCUyMGtleXRpbWVzJTNEJTIyMCUzQjAuMiUzQjAuNyUzQjElMjIlMjBrZXlTcGxpbmVzJTNEJTIyMC4yJTIwMC4yJTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTIyJTIwY2FsY01vZGUlM0QlMjJzcGxpbmUlMjIlMjAvJTNFJTBBJTIwJTIwJTNDL2NpcmNsZSUzRSUwQSUyMCUyMCUzQ2NpcmNsZSUyMHRyYW5zZm9ybSUzRCUyMnRyYW5zbGF0ZSUyODI0JTIwMCUyOSUyMiUyMGN4JTNEJTIyMCUyMiUyMGN5JTNEJTIyMTYlMjIlMjByJTNEJTIyMCUyMiUzRSUyMCUwQSUyMCUyMCUyMCUyMCUzQ2FuaW1hdGUlMjBhdHRyaWJ1dGVOYW1lJTNEJTIyciUyMiUyMHZhbHVlcyUzRCUyMjAlM0IlMjA0JTNCJTIwMCUzQiUyMDAlMjIlMjBkdXIlM0QlMjIxLjJzJTIyJTIwcmVwZWF0Q291bnQlM0QlMjJpbmRlZmluaXRlJTIyJTIwYmVnaW4lM0QlMjIwLjYlMjIlMEElMjAlMjAlMjAlMjAlMjAlMjBrZXl0aW1lcyUzRCUyMjAlM0IwLjIlM0IwLjclM0IxJTIyJTIwa2V5U3BsaW5lcyUzRCUyMjAuMiUyMDAuMiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUyMiUyMGNhbGNNb2RlJTNEJTIyc3BsaW5lJTIyJTIwLyUzRSUwQSUyMCUyMCUzQy9jaXJjbGUlM0UlMEElM0Mvc3ZnJTNFXCIpIHtcblx0XHRcdGl0ZW0ucGhvdG8gPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGl0ZW0uZG9uZSA9IHZhbHVlcy5kb25lO1xuXHRcdGl0ZW0ubGFzdEVkaXRlZCA9IHZhbHVlcy5sYXN0RWRpdGVkO1xuXHRcdGl0ZW0uZGVsZXRpbmcgPSB2YWx1ZXMuZGVsZXRpbmc7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXREYXRhT25seUl0ZW0ob3JpZ2luYWwpIHtcblx0XHR2YXIgaXRlbSA9IHt9O1xuXHRcdHVwZGF0ZUl0ZW1EYXRhKGl0ZW0sIG9yaWdpbmFsKTtcblx0XHRmb3IgKHZhciBrZXkgaW4gaXRlbSkge1xuXHRcdFx0aWYgKGl0ZW1ba2V5XSA9PT0gbnVsbCB8fCBpdGVtW2tleV0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRkZWxldGUgaXRlbVtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gaXRlbTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldERhdGFPbmx5TGlzdChpZCkge1xuXHRcdHZhciBsaXN0ID0gbGlzdHNbZmluZExpc3RJbmRleEJ5SWQoaWQpXTtcblx0XHR2YXIgdGV4dE9ubHlMaXN0ID0gW107XG5cdFx0Zm9yICh2YXIgaT0wOyBpPGxpc3QuaXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRleHRPbmx5TGlzdC5wdXNoKGdldERhdGFPbmx5SXRlbShsaXN0Lml0ZW1zW2ldKSk7XG5cdFx0fVxuXHRcdHJldHVybiB0ZXh0T25seUxpc3Q7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWxldGVMaXN0KGlkLCBpbW1lZGlhdGUpIHtcblx0XHQvLyBTZXQgbGlzdCBzdGF0dXMgZm9yIGRlbGV0aW9uXG5cdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoaWQpO1xuXHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRsaXN0c1tpbmRleF0uZGVsZXRpbmcgPSB0cnVlO1xuXHRcdFx0Y3VycmVudExpc3RJZCA9ICcnO1xuXHRcdH1cblx0XHQvLyBkZWxldGUgZGVsYXlcblx0XHR2YXIgZGVsYXkgPSA1MDAwO1xuXHRcdGlmICghaW1tZWRpYXRlKSBkZWxheSA9IDA7XG5cdFx0ZGVsZXRpbmdMaXN0SWQgPSBpZDtcblx0XHRkZWxldGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0ZGVsZXRlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gZ2V0IGluZGV4IGFnYWluLCBhcyBpdCBtYXkgaGF2ZSBjaGFuZ2VkXG5cdFx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChpZCk7XG5cdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRsaXN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRkZWxldGVEZWZlci5yZXNvbHZlKCdkZWxldGVkJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkZWxldGVEZWZlci5yZWplY3QoJ2xpc3ROb3RGb3VuZCcpO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdMaXN0SWQgPSB1bmRlZmluZWQ7XG5cdFx0fSwgZGVsYXkpO1xuXHRcdHJldHVybiBkZWxldGVEZWZlci5wcm9taXNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlSXRlbShpZCwgaW1tZWRpYXRlKSB7XG5cdFx0Ly8gU2V0IGxpc3Qgc3RhdHVzIGZvciBkZWxldGlvblxuXHRcdHZhciBpbmRleCA9IGdldEN1cnJlbnRMaXN0KCkuZ2V0SXRlbUluZGV4QnlJZChpZCk7XG5cdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdGdldEN1cnJlbnRMaXN0KCkuaXRlbXNbaW5kZXhdLmRlbGV0aW5nID0gdHJ1ZTtcblx0XHR9XG5cdFx0Ly8gZGVsZXRlIGRlbGF5XG5cdFx0ZGVsZXRpbmdJdGVtSWQgPSBpZDtcblx0XHRkZWxldGluZ0xpc3RJZCA9IGdldEN1cnJlbnRMaXN0KCkuaWQ7IC8vIHN0b3JlIGxpc3QgaWQgaW4gY2FzZSBjdXJyZW50IGxpc3QgaXMgY2hhbmdlZFxuXHRcdGRlbGV0ZURlZmVyID0gJHEuZGVmZXIoKTtcblx0XHR2YXIgZGVsYXkgPSA1MDAwO1xuXHRcdGlmICghaW1tZWRpYXRlKSBkZWxheSA9IDA7XG5cdFx0ZGVsZXRlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gZ2V0IGluZGV4IGFnYWluLCBhcyBpdCBtYXkgaGF2ZSBjaGFuZ2VkXG5cdFx0XHR2YXIgbGlzdEluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoZGVsZXRpbmdMaXN0SWQpO1xuXHRcdFx0aWYgKGxpc3RJbmRleCA+PSAwKSB7XG5cdFx0XHRcdHZhciBpbmRleCA9IGxpc3RzW2xpc3RJbmRleF0uZ2V0SXRlbUluZGV4QnlJZChpZCk7XG5cdFx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdFx0bGlzdHNbbGlzdEluZGV4XS5pdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRcdGRlbGV0ZURlZmVyLnJlc29sdmUoJ2RlbGV0ZWQnKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkZWxldGVEZWZlci5yZWplY3QoJ2xpc3ROb3RGb3VuZCcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRkZWxldGluZ0l0ZW1JZCA9IHVuZGVmaW5lZDtcblx0XHR9LCBkZWxheSk7XG5cdFx0cmV0dXJuIGRlbGV0ZURlZmVyLnByb21pc2U7XG5cdH1cblxuXHRmdW5jdGlvbiBjYW5jZWxEZWxldGUoKSB7XG5cdFx0Y2xlYXJUaW1lb3V0KGRlbGV0ZVRpbWVyKTtcblx0XHRpZiAoZGVsZXRpbmdJdGVtSWQpIHtcblx0XHRcdHZhciBsaXN0ID0gbGlzdHNbZmluZExpc3RJbmRleEJ5SWQoZGVsZXRpbmdMaXN0SWQpXTtcblx0XHRcdHZhciBpbmRleCA9IGxpc3QuZ2V0SXRlbUluZGV4QnlJZChkZWxldGluZ0lkKTtcblx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLmRlbGV0aW5nID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGluZ0l0ZW1JZCA9IHVuZGVmaW5lZDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoZGVsZXRpbmdJZCk7XG5cdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRsaXN0c1tpbmRleF0uZGVsZXRpbmcgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nTGlzdElkID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRkZWxldGVEZWZlci5yZWplY3QoJ2RlbGV0ZUNhbmNlbGxlZCcpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2V0Q3VycmVudExpc3QobGlzdCkge1xuXHRcdGlmICh0eXBlb2YgbGlzdCA9PT0gJ251bWJlcicpIHtcblx0XHRcdGN1cnJlbnRMaXN0SWQgPSBmaW5kTGlzdEluZGV4QnlJZChsaXN0KTtcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBsaXN0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Y3VycmVudExpc3RJZCA9IGxpc3QuaWQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUud2FybigndW5rbm93biBpbnB1dCBmb3IgbGlzdDogJysgdHlwZW9mIGxpc3QpO1xuXHRcdFx0Y29uc29sZS53YXJuKGxpc3QpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGdldEN1cnJlbnRMaXN0KCkge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gbGlzdHNbZmluZExpc3RJbmRleEJ5SWQoY3VycmVudExpc3RJZCldO1xuXHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0Y29uc29sZS53YXJuKCdMaXN0IG5vdCBmb3VuZC4gSUQ6ICcrY3VycmVudExpc3RJZCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdHMpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGltcG9ydExpc3QoaWQpIHtcblx0XHR2YXIgbGlzdFJlZiA9IGZpcmVSZWYuY2hpbGQoaWQpO1xuXHRcdHZhciBsaXN0O1xuXHRcdHZhciBsb2NhbEluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoaWQpO1xuXHRcdGlmIChsb2NhbEluZGV4IDwgMCkge1xuXHRcdFx0bGlzdHMudW5zaGlmdChuZXcgTGlzdE9iamVjdChpZCwgJ1N5bmNocm9uaXNpbmcuLi4nKSlcblx0XHRcdGxpc3QgPSBsaXN0c1swXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bGlzdCA9IGxpc3RzW2xvY2FsSW5kZXhdO1xuXHRcdH1cblx0XHRsaXN0UmVmLm9uY2UoJ3ZhbHVlJywgZnVuY3Rpb24oc25hcHNob3QpIHtcblx0XHRcdGlmIChzbmFwc2hvdC52YWwoKSkgeyAvLyBpZiBsaXN0IGV4aXN0c1xuXHRcdFx0XHRsaXN0Lm5hbWUgPSBzbmFwc2hvdC52YWwoKS5uYW1lO1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2goc25hcHNob3QudmFsKCkuaXRlbXMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0XHR1cGRhdGVJdGVtKHZhbHVlKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0bGlzdFJlZi5jaGlsZCgnbmFtZScpLm9uKCd2YWx1ZScsIGZ1bmN0aW9uKHNuYXBzaG90KSB7XG5cdFx0XHRcdFx0bGlzdC5uYW1lID0gc25hcHNob3QudmFsKCk7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdmaXJlYmFzZVN5bmMnKTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdGxpc3RSZWYuY2hpbGQoJ2l0ZW1zJykub24oJ2NoaWxkX2NoYW5nZWQnLCBmdW5jdGlvbihzbmFwc2hvdCkge1xuXHRcdFx0XHRcdHVwZGF0ZUl0ZW0oc25hcHNob3QudmFsKCkpXG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdmaXJlYmFzZVN5bmMnKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsaXN0Lm5hbWUgPSAnTmV3IExpc3QgJytsaXN0cy5sZW5ndGg7XG5cdFx0XHR9XG5cdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2ZpcmViYXNlU3luYycpO1xuXHRcdH0pO1xuXHRcdGZ1bmN0aW9uIHVwZGF0ZUl0ZW0oaXRlbSkge1xuXHRcdFx0dmFyIGxvY2FsSXRlbUluZGV4ID0gbGlzdC5nZXRJdGVtSW5kZXhCeUlkKGl0ZW0uaWQpO1xuXHRcdFx0aWYgKGxvY2FsSXRlbUluZGV4IDwgMCkge1xuXHRcdFx0XHRsaXN0Lml0ZW1zLnB1c2goZ2V0RGF0YU9ubHlJdGVtKGl0ZW0pKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmIChsaXN0Lml0ZW1zW2xvY2FsSXRlbUluZGV4XSAhPSBpdGVtKSB7XG5cdFx0XHRcdFx0dXBkYXRlSXRlbURhdGEobGlzdC5pdGVtc1tsb2NhbEl0ZW1JbmRleF0sIGl0ZW0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbG9jYWxSZXRyaWV2ZSgpIHtcblx0XHR2YXIgcmV0cmlldmVkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0Jhc2tldHMnKTtcblx0XHRpZiAocmV0cmlldmVkKSB7XG5cdFx0XHR2YXIgcGFyc2VkID0gSlNPTi5wYXJzZShyZXRyaWV2ZWQpO1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHBhcnNlZC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoIXBhcnNlZFtpXS5kZWxldGluZykge1xuXHRcdFx0XHRcdHZhciBsaXN0ID0gbmV3IExpc3RPYmplY3QocGFyc2VkW2ldLmlkLCBwYXJzZWRbaV0ubmFtZSk7XG5cdFx0XHRcdFx0bGlzdC5pdGVtcyA9IHBhcnNlZFtpXS5pdGVtcztcblx0XHRcdFx0XHRsaXN0cy5wdXNoKGxpc3QpO1xuXHRcdFx0XHRcdGltcG9ydExpc3QobGlzdC5pZCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBsb2NhbFNhdmUoKSB7XG5cdFx0dmFyIGpzb24gPSBKU09OLnN0cmluZ2lmeShsaXN0cyk7XG5cdFx0aWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdCYXNrZXRzJykgIT09IGpzb24pIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdCYXNrZXRzJywganNvbik7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybignQ2Fubm90IHN0b3JlIGRhdGEgdG8gbG9jYWwgc3RvcmFnZTogJytlKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gc3luY0FsbCgpIHtcblx0XHRpZiAobG9jYWxTYXZlKCkpIHtcblx0XHRcdHN5bmNDdXJyZW50TGlzdCgpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHN5bmNDdXJyZW50TGlzdCgpIHtcblx0XHRpZiAoZ2V0Q3VycmVudExpc3QoKSkge1xuXHRcdFx0dmFyIGl0ZW1zID0gZ2V0RGF0YU9ubHlMaXN0KGdldEN1cnJlbnRMaXN0KCkuaWQpO1xuXHRcdFx0ZmlyZVJlZi5jaGlsZChnZXRDdXJyZW50TGlzdCgpLmlkKS5jaGlsZCgnbmFtZScpLnNldChnZXRDdXJyZW50TGlzdCgpLm5hbWUpO1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGZpcmVSZWYuY2hpbGQoZ2V0Q3VycmVudExpc3QoKS5pZCkuY2hpbGQoJ2l0ZW1zJykuY2hpbGQoaXRlbXNbaV0uaWQpLnVwZGF0ZShpdGVtc1tpXSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnaWRHZW5lcmF0b3InLCBpZEdlbmVyYXRvcik7XG5cbmZ1bmN0aW9uIGlkR2VuZXJhdG9yKCkge1xuXG5cdHJldHVybiB7XG5cdFx0Z2V0OiBnZXRVbmlxSWQsXG5cdH07XG5cblx0ZnVuY3Rpb24gZ2V0VW5pcUlkKGxlbmd0aCkge1xuXHRcdHJldHVybiAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKk1hdGgucG93KDM2LGxlbmd0aCkpLnRvU3RyaW5nKDM2KSkuc2xpY2UoLWxlbmd0aCk7XG5cdH1cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdzaGFyZVNlcnZpY2UnLCBzaGFyZVNlcnZpY2UpO1xuXG5mdW5jdGlvbiBzaGFyZVNlcnZpY2UoKSB7XG5cblx0cmV0dXJuIHtcblx0XHRnZXRMaW5rOiBnZXRMaW5rLFxuXHRcdHdyaXRlRW1haWw6IHdyaXRlRW1haWwsXG5cdH07XG5cblx0ZnVuY3Rpb24gZ2V0TGluayhsaXN0KSB7XG5cdFx0cmV0dXJuIGxvY2F0aW9uLm9yaWdpbitsb2NhdGlvbi5wYXRobmFtZStcIiNsaXN0PVwiK2xpc3QuaWQ7XG5cdH1cblxuXHRmdW5jdGlvbiB3cml0ZUVtYWlsKGxpc3QpIHtcblx0XHR2YXIgcmVzdWx0cyA9IFtdO1xuXHRcdHJlc3VsdHMucHVzaChcIkFkZCB0aGlzIGxpc3QgdG8geW91ciBCYXNrZXQgYXQgXCIrZ2V0TGluayhsaXN0KSk7XG5cdFx0cmVzdWx0cy5wdXNoKFwiPT09PT09PT09PT09PT09PT09PT1cIik7XG5cdFx0cmVzdWx0cy5wdXNoKGxpc3QubmFtZSk7XG5cdFx0cmVzdWx0cy5wdXNoKFwiPT09PT09PT09PT09PT09PT09PT1cIik7XG5cdFx0cmVzdWx0cy5wdXNoKFwiXCIpO1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0Lml0ZW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgaXRlbSA9IGxpc3QuaXRlbXNbaV07XG5cdFx0XHRyZXN1bHRzLnB1c2goaXRlbS50aXRsZSk7XG5cdFx0XHRyZXN1bHRzLnB1c2goXCJcIik7XG5cdFx0XHRpZiAoaXRlbS5ub3RlKSByZXN1bHRzLnB1c2goJ05vdGVzOiAnK2l0ZW0ubm90ZSk7XG5cdFx0XHRpZiAoaXRlbS5hc3NpZ24pIHJlc3VsdHMucHVzaCgnQXNzaWduZWQgdG8gJytpdGVtLmFzc2lnbik7XG5cdFx0XHRyZXN1bHRzLnB1c2goXCItLS0tLS0tLS0tLS0tLS0tLS0tLVwiKTtcblx0XHRcdHJlc3VsdHMucHVzaChcIlwiKTtcblx0XHR9XG5cdFx0dmFyIGJvZHkgPSByZXN1bHRzLmpvaW4oJ1xcbicpOyAvLyBuZXcgbGluZVxuXHRcdHJldHVybiAnbWFpbHRvOj9ib2R5PScrZW5jb2RlVVJJQ29tcG9uZW50KGJvZHkpO1xuXHR9XG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9