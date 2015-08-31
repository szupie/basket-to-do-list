if (window.FileReader) {
	fileSupport = true;
}

var app = angular.module('app', ['ngMaterial'])
				.constant('support', {fileReader: fileSupport});

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
		var body = results.join('%0A'); // new line
		return 'mailto:?body='+body;
	}
}
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
					.ok('Send list as email')
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImRpcmVjdGl2ZXMvYmtJdGVtLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RJbmZvLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RWaWV3LmpzIiwic2VydmljZXMvSXRlbU9iamVjdC5qcyIsInNlcnZpY2VzL0xpc3RPYmplY3QuanMiLCJzZXJ2aWNlcy9hbGxMaXN0c1NlcnZpY2UuanMiLCJzZXJ2aWNlcy9pZEdlbmVyYXRvci5qcyIsInNlcnZpY2VzL3NoYXJlU2VydmljZS5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9MaXN0c0NvbnRyb2xsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxPQUFPLFlBQVk7Q0FDdEIsY0FBYzs7O0FBR2YsSUFBSSxNQUFNLFFBQVEsT0FBTyxPQUFPLENBQUM7S0FDNUIsU0FBUyxXQUFXLENBQUMsWUFBWTtBQUN0QztBQ05BO0VBQ0UsT0FBTztFQUNQLFVBQVUsVUFBVTs7QUFFdEIsU0FBUyxPQUFPLElBQUk7Q0FDbkIsSUFBSSxZQUFZO0VBQ2YsVUFBVTtFQUNWLE1BQU07RUFDTixhQUFhO0VBQ2IsWUFBWTtFQUNaLGNBQWM7OztDQUdmLE9BQU87O0NBRVAsU0FBUyxLQUFLLE9BQU8sU0FBUyxPQUFPOztFQUVwQyxRQUFRLEdBQUcsU0FBUyxVQUFVLEdBQUc7R0FDaEM7OztFQUdELElBQUksV0FBVyxTQUFTLGNBQWM7RUFDdEMsSUFBSTs7O0VBR0osU0FBUyxrQkFBa0I7R0FDMUIsUUFBUSxTQUFTO0dBQ2pCLFlBQVk7R0FDWixXQUFXLFdBQVcsRUFBRSxZQUFZLFlBQVk7R0FDaEQsU0FBUyxVQUFVLElBQUk7Ozs7RUFJeEIsSUFBSSxhQUFhLFFBQVEsR0FBRyxjQUFjO0VBQzFDLElBQUk7RUFDSixJQUFJLGVBQWU7RUFDbkIsU0FBUyxjQUFjO0dBQ3RCLFlBQVksR0FBRztHQUNmLE1B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RyxVQUFVLFdBQVc7RUFDdkIsZ0JBQWdCLGVBQWUsZ0JBQWdCOzs7Q0FHaEQsR0FBRyxjQUFjLGdCQUFnQjs7OzhDQUVqQyIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpZiAod2luZG93LkZpbGVSZWFkZXIpIHtcblx0ZmlsZVN1cHBvcnQgPSB0cnVlO1xufVxuXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFsnbmdNYXRlcmlhbCddKVxuXHRcdFx0XHQuY29uc3RhbnQoJ3N1cHBvcnQnLCB7ZmlsZVJlYWRlcjogZmlsZVN1cHBvcnR9KTtcbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtJdGVtJywgYmtJdGVtKTtcblxuZnVuY3Rpb24gYmtJdGVtKCRxKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrSXRlbS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0Ly8gRW5kIGN1c3RvbSBlZGl0IG1vZGUgb24gY2xpY2tcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRkZXNlbGVjdCgpO1xuXHRcdH0pO1xuXG5cdFx0dmFyIGxpc3RWaWV3ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2JrLWxpc3Qtdmlld10nKTtcblx0XHR2YXIgYXNzaWduSW5wdXQ7XG5cblx0XHQvLyBFbnRlciBhc3NpZ24gbW9kZVxuXHRcdGZ1bmN0aW9uIGVudGVyQXNzaWduTW9kZSgpIHtcblx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGFzc2lnbklucHV0LnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBhc3NpZ25JbnB1dC5mb2N1cygpOyB9LCAxMDApOyAvLyBkZWxheSB0byB3YWl0IGZvciBjbGFzc2VzIHRvIGFwcGx5XG5cdFx0XHRsaXN0Vmlldy5jbGFzc0xpc3QuYWRkKFwiaGFzRWRpdGFibGVJdGVtXCIpO1xuXHRcdH1cblxuXHRcdC8vIFBob3RvIHNlbGVjdFxuXHRcdHZhciBwaG90b0lucHV0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdpbnB1dC5waG90bycpO1xuXHRcdHZhciBmaWxlRGVmZXI7XG5cdFx0dmFyIHdhaXRpbmdJbnB1dCA9IDA7XG5cdFx0ZnVuY3Rpb24gcGhvdG9Qcm9tcHQoKSB7XG5cdFx0XHRmaWxlRGVmZXIgPSAkcS5kZWZlcigpO1xuXHRcdFx0c2NvcGUuSXRlbXMuZ2V0UGhvdG8oYXR0cnMuaXRlbUlkLCBmaWxlRGVmZXIucHJvbWlzZSk7XG5cdFx0XHRwaG90b0lucHV0LmNsaWNrKCk7XG5cdFx0XHRwaG90b0lucHV0LnZhbHVlID0gbnVsbDtcblx0XHR9XG5cdFx0ZnVuY3Rpb24gcGhvdG9Qcm9tcHRDbG9zZSgpIHtcblx0XHRcdGlmICh3YWl0aW5nSW5wdXQgPiAwKSB7XG5cdFx0XHRcdHdhaXRpbmdJbnB1dCA9IDA7XG5cdFx0XHRcdGlmIChmaWxlRGVmZXIpIGZpbGVEZWZlci5ub3RpZnkoJ25vSW1hZ2UnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHdhaXRpbmdJbnB1dCsrO1xuXHRcdFx0XHRpZiAoZmlsZURlZmVyKSBmaWxlRGVmZXIubm90aWZ5KCdnZXR0aW5nJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHBob3RvSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIGZpbGUgPSBlLnRhcmdldC5maWxlc1swXTtcblx0XHRcdHdhaXRpbmdJbnB1dCA9IDA7XG5cdFx0XHRpZiAoZmlsZSkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblx0XHRcdFx0cmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGZpbGVEZWZlci5yZXNvbHZlKHJlYWRlci5yZXN1bHQpO1xuXHRcdFx0XHRcdGZpbGVEZWZlciA9IHVuZGVmaW5lZDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2ltZy5waG90bycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdGVsZW1lbnQudG9nZ2xlQ2xhc3MoJ3Bob3RvVmlldycpO1xuXHRcdH0pO1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1lZGlhJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVDbGFzcygncGhvdG9WaWV3Jyk7XG5cdFx0fSk7XG5cblx0XHQvLyBUb2dnbGUgaXRlbSBkb25lbmVzc1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmRvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudC50b2dnbGVDbGFzcyhcImRvbmVcIikucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZVwiKTtcblx0XHRcdGxpc3RWaWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJoYXNFZGl0YWJsZUl0ZW1cIik7XG5cdFx0XHRkZXNlbGVjdCgpO1xuXHRcdH0pO1xuXHRcdFxuXHRcdC8vIFJlYXR0YWNoIGxpc3RlbmVyIHRvIGJ1dHRvbnMgb24gc2NyZWVuIHNpemUgY2hhbmdlXG5cdFx0dmFyIGFzc2lnbkJ1dHRvbiA9IGdldEFzc2lnbkJ1dHRvbigpO1xuXHRcdHZhciBwaG90b0J1dHRvbiA9IGdldFBob3RvQnV0dG9uKCk7XG5cdFx0c2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gc2NvcGUuTWFpbi4kbWRNZWRpYSgnbWQnKTsgfSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoYXNzaWduQnV0dG9uKSB7XG5cdFx0XHRcdGFzc2lnbkJ1dHRvbi5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIGVudGVyQXNzaWduTW9kZSk7XG5cdFx0XHR9XG5cdFx0XHRhc3NpZ25CdXR0b24gPSBnZXRBc3NpZ25CdXR0b24oKTtcblx0XHRcdGlmIChhc3NpZ25CdXR0b24pIHtcblx0XHRcdFx0YXNzaWduQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJBc3NpZ25Nb2RlKTtcblx0XHRcdH1cblx0XHRcdGlmIChwaG90b0J1dHRvbikge1xuXHRcdFx0XHRwaG90b0J1dHRvbi5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHBob3RvUHJvbXB0KTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgcGhvdG9Qcm9tcHRDbG9zZSk7XG5cdFx0XHR9XG5cdFx0XHRwaG90b0J1dHRvbiA9IGdldFBob3RvQnV0dG9uKCk7XG5cdFx0XHRpZiAocGhvdG9CdXR0b24pIHtcblx0XHRcdFx0cGhvdG9CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBwaG90b1Byb21wdCk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ2aXNpYmlsaXR5Y2hhbmdlXCIsIHBob3RvUHJvbXB0Q2xvc2UpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gY2xpY2tpbmcgYnV0dG9uXG5cdFx0XHRlbGVtZW50LmZpbmQoJ2J1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdFx0Ly8gaU9TIGZpeCB0byBkZXNlbGVjdCBidXR0b25cblx0XHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gRGVsYXkgcXVlcnlpbmcgZm9yIGlucHV0IHVudGlsIGVsZW1lbnQgY3JlYXRlZFxuXHRcdFx0YXNzaWduSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ21kLWF1dG9jb21wbGV0ZS5hc3NpZ24gaW5wdXQnKTtcblx0XHRcdC8vIFByZXZlbnQgZW5kaW5nIGVkaXQgbW9kZSB3aGVuIHNlbGVjdGluZyBpbnB1dFxuXHRcdFx0ZWxlbWVudC5maW5kKCdtZC1pbnB1dC1jb250YWluZXInKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHR9KTtcblx0XHR9LCAxMDApO1xuXG5cdFx0Ly8gTGVhdmUgY3VzdG9tIGVkaXQgbW9kZVxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0KCkge1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVDbGFzcyhcImVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGdldEFzc2lnbkJ1dHRvbigpIHtcblx0XHRcdHJldHVybiBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5hc3NpZ24nKTtcblx0XHR9XG5cdFx0ZnVuY3Rpb24gZ2V0UGhvdG9CdXR0b24oKSB7XG5cdFx0XHRyZXR1cm4gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24ucGhvdG8nKTtcblx0XHR9XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0SW5mbycsIGJrTGlzdEluZm8pO1xuXG5mdW5jdGlvbiBia0xpc3RJbmZvKGFsbExpc3RzU2VydmljZSkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0dGVtcGxhdGVVcmw6ICcuL3RlbXBsYXRlcy9ia0xpc3RJbmZvLmh0bWwnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7IGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChzY29wZS5saXN0KSB9KTtcblx0XHR9KTtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0VmlldycsIGJrTGlzdFZpZXcpO1xuXG5mdW5jdGlvbiBia0xpc3RWaWV3KCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0Y29udHJvbGxlcjogJ0l0ZW1zQ29udHJvbGxlcicsXG5cdFx0Y29udHJvbGxlckFzOiAnSXRlbXMnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXG5cdFx0dmFyIHN1YmhlYWRlciA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlcicpO1xuXHRcdHZhciB0aXRsZUlucHV0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyIGlucHV0Jyk7XG5cblx0XHQvLyBDbGljayBvdXRzaWRlIG9mIGl0ZW1zIHRvIGV4aXQgZWRpdCBtb2RlXG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0aWYgKGUudGFyZ2V0KSB7XG5cdFx0XHRcdHZhciBia0l0ZW0gPSBpc0JrSXRlbUNoaWxkKGUudGFyZ2V0KTtcblx0XHRcdFx0aWYgKGJrSXRlbSkge1xuXHRcdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUoYmtJdGVtKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gUHJldmVudCBsb3NpbmcgZm9jdXMgb24gYnV0dG9uIGNsaWNrc1xuXHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblxuXHRcdC8vIE1ha2UgdGl0bGUgZWRpdGFibGUgb24gY2xpY2tcblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgLm5hbWUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0bWFrZVRpdGxlRWRpdGFibGUoKTtcblx0XHR9KTtcblxuXHRcdC8vIEV4aXQgdGl0bGUgZWRpdCBtb2RlIG9uIHRpdGxlIGlucHV0IGxvc2luZyBmb2N1c1xuXHRcdHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJykuY2xhc3NMaXN0LnJlbW92ZSgnZWRpdGFibGUnKTtcblx0XHR9KTtcblxuXHRcdC8vIFN3aXRjaCBmb2N1cyB0byBuZXcgaXRlbVxuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLm5ld0l0ZW0nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdHZhciBuZXdJdGVtID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdiay1pdGVtJyk7XG5cdFx0XHRpZiAobmV3SXRlbSkge1xuXHRcdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0XHRtYWtlSXRlbUVkaXRhYmxlKG5ld0l0ZW0pO1xuXHRcdFx0XHR2YXIgdGl0bGUgPSBuZXdJdGVtLnF1ZXJ5U2VsZWN0b3IoJy50aXRsZSBpbnB1dCcpO1xuXHRcdFx0XHQvLyBmb2N1cyB0aXRsZSBmaWVsZCBieSBkZWZhdWx0OyBkZWxheSB0byB3YWl0IGZvciBzdHlsZSB0byB0YWtlIGVmZmVjdFxuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB0aXRsZS5mb2N1cygpOyB9LCAxMDApO1xuXHRcdFx0XHR0aXRsZS5zZWxlY3QoKTsgLy8gaU9TIGZpeFxuXHRcdFx0XHR3aW5kb3cuc2Nyb2xsKDEsMSk7IC8vIGlPUyBmaXhcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGZ1bmN0aW9uIG1ha2VUaXRsZUVkaXRhYmxlKCkge1xuXHRcdFx0c3ViaGVhZGVyLmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlJyk7XG5cdFx0XHR0aXRsZUlucHV0LmZvY3VzKCk7XG5cdFx0fVxuXHRcdHNjb3BlLm1ha2VUaXRsZUVkaXRhYmxlID0gbWFrZVRpdGxlRWRpdGFibGU7XG5cblx0XHRmdW5jdGlvbiBkZXNlbGVjdEFsbCgpIHtcblx0XHRcdGVsZW1lbnQuZmluZCgnYmstaXRlbScpLnJlbW92ZUNsYXNzKFwiZWRpdGFibGUgZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKCdoYXNFZGl0YWJsZUl0ZW0nKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBtYWtlSXRlbUVkaXRhYmxlKGl0ZW0pIHtcblx0XHRcdGl0ZW0uY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGlzQmtJdGVtQ2hpbGQobm9kZSkge1xuXHRcdFx0dmFyIGlzQ2FyZENvbnRlbnQgPSBmYWxzZTtcblx0XHRcdHdoaWxlIChub2RlICYmIG5vZGUgIT09IGVsZW1lbnRbMF0pIHtcblx0XHRcdFx0aWYgKG5vZGUubm9kZU5hbWUgPT09ICdNRC1DQVJELUNPTlRFTlQnKSB7XG5cdFx0XHRcdFx0aXNDYXJkQ29udGVudCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGlzQ2FyZENvbnRlbnQgJiYgbm9kZS5ub2RlTmFtZSA9PT0gJ0JLLUlURU0nKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5vZGU7XG5cdFx0XHRcdH1cblx0XHRcdFx0bm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0l0ZW1PYmplY3QnLCBJdGVtT2JqZWN0KTtcblxuZnVuY3Rpb24gSXRlbU9iamVjdCgpIHtcblxuXHR2YXIgaXRlbU9iamVjdCA9IGZ1bmN0aW9uKGlkKSB7XG5cdFx0dGhpcy5pZCA9IGlkO1xuXHRcdHRoaXMudGl0bGUgPSAnJztcblx0XHR0aGlzLm5vdGUgPSAnJztcblx0XHR0aGlzLmFzc2lnbiA9ICcnO1xuXHRcdHRoaXMuZG9uZSA9IGZhbHNlO1xuXHRcdHRoaXMubGFzdEVkaXRlZCA9IERhdGUubm93KCk7XG5cdH1cblxuXHRyZXR1cm4gaXRlbU9iamVjdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0xpc3RPYmplY3QnLCBMaXN0T2JqZWN0KTtcblxuZnVuY3Rpb24gTGlzdE9iamVjdChJdGVtT2JqZWN0LCBpZEdlbmVyYXRvcikge1xuXG5cdHZhciBsaXN0T2JqZWN0ID0gZnVuY3Rpb24oaWQsIG5hbWUpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLml0ZW1zID0gW107XG5cdFx0dGhpcy5hZGRJdGVtID0gYWRkSXRlbTtcblx0XHR0aGlzLmdldEl0ZW1JbmRleEJ5SWQgPSBnZXRJdGVtSW5kZXhCeUlkO1xuXHRcdHRoaXMuZ2V0RGVzY3JpcHRpb24gPSBnZXREZXNjcmlwdGlvbjtcblx0fVxuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0dGhpcy5pdGVtcy51bnNoaWZ0KG5ldyBJdGVtT2JqZWN0KGlkR2VuZXJhdG9yLmdldCg0KSkpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0SXRlbUluZGV4QnlJZChpZCkge1xuXHRcdGZvciAodmFyIGk9MDsgaTx0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAodGhpcy5pdGVtc1tpXS5pZCA9PT0gaWQpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAtMTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldERlc2NyaXB0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLml0ZW1zLm1hcChmdW5jdGlvbihpdGVtKSB7IGlmICghaXRlbS5kb25lKSByZXR1cm4gaXRlbS50aXRsZSB9KVxuXHRcdFx0XHRcdFx0LmZpbHRlcihmdW5jdGlvbih2YWwpIHsgcmV0dXJuIHZhbDsgfSkvLyBnZXQgbm9uLWVtcHR5IGl0ZW1zXG5cdFx0XHRcdFx0XHQuam9pbignLCAnKTtcblx0fVxuXG5cdHJldHVybiBsaXN0T2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnYWxsTGlzdHNTZXJ2aWNlJywgYWxsTGlzdHNTZXJ2aWNlKTtcblxuZnVuY3Rpb24gYWxsTGlzdHNTZXJ2aWNlKExpc3RPYmplY3QsICRxLCBpZEdlbmVyYXRvciwgJHJvb3RTY29wZSkge1xuXG5cdHZhciBsaXN0cyA9IFtdO1xuXHR2YXIgY3VycmVudExpc3RJZCA9IHVuZGVmaW5lZDtcblx0dmFyIGRlbGV0ZVRpbWVyO1xuXHR2YXIgZGVsZXRlRGVmZXI7XG5cdHZhciBkZWxldGluZ0xpc3RJZDtcblx0dmFyIGRlbGV0aW5nSXRlbUlkO1xuXHR2YXIgZmlyZVJlZiA9IG5ldyBGaXJlYmFzZShcImh0dHBzOi8vdG9ycmlkLWZpcmUtNjI2Ni5maXJlYmFzZWlvLmNvbS9cIik7XG5cdGxvY2FsUmV0cmlldmUoKTtcblxuXHRyZXR1cm4ge1xuXHRcdGFkZDogYWRkLFxuXHRcdGxpc3RzOiBsaXN0cyxcblx0XHRzZXRDdXJyZW50TGlzdDogc2V0Q3VycmVudExpc3QsXG5cdFx0Z2V0Q3VycmVudExpc3Q6IGdldEN1cnJlbnRMaXN0LFxuXHRcdGRlbGV0ZUxpc3Q6IGRlbGV0ZUxpc3QsXG5cdFx0ZGVsZXRlSXRlbTogZGVsZXRlSXRlbSxcblx0XHRjYW5jZWxEZWxldGU6IGNhbmNlbERlbGV0ZSxcblx0XHRzeW5jQWxsOiBzeW5jQWxsLFxuXHRcdGltcG9ydExpc3Q6IGltcG9ydExpc3QsXG5cdH07XG5cblx0ZnVuY3Rpb24gYWRkKCkge1xuXHRcdGxpc3RzLnVuc2hpZnQoXG5cdFx0XHRuZXcgTGlzdE9iamVjdChpZEdlbmVyYXRvci5nZXQoOCksIFwiTmV3IExpc3QgXCIrKGxpc3RzLmxlbmd0aCsxKSlcblx0XHQpO1xuXHRcdHJldHVybiBsaXN0c1swXTtcblx0fVxuXG5cdGZ1bmN0aW9uIGZpbmRMaXN0SW5kZXhCeUlkKGlkKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPGxpc3RzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAobGlzdHNbaV0uaWQgPT09IGlkKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVJdGVtRGF0YShpdGVtLCB2YWx1ZXMpIHtcblx0XHRpdGVtLmlkID0gdmFsdWVzLmlkO1xuXHRcdGl0ZW0udGl0bGUgPSB2YWx1ZXMudGl0bGU7XG5cdFx0aXRlbS5ub3RlID0gdmFsdWVzLm5vdGU7XG5cdFx0aXRlbS5hc3NpZ24gPSB2YWx1ZXMuYXNzaWduO1xuXHRcdGl0ZW0uYXVkaW8gPSB2YWx1ZXMuYXVkaW87XG5cdFx0aXRlbS5waG90byA9IHZhbHVlcy5waG90bztcblx0XHRpZiAoaXRlbS5waG90byA9PSBcImRhdGE6aW1hZ2Uvc3ZnK3htbCwlM0NzdmclMjB4bWxucyUzRCUyMmh0dHAlM0EvL3d3dy53My5vcmcvMjAwMC9zdmclMjIlMjB2aWV3Qm94JTNEJTIyMCUyMDAlMjAzMiUyMDMyJTIyJTIwd2lkdGglM0QlMjIzMiUyMiUyMGhlaWdodCUzRCUyMjMyJTIyJTIwZmlsbCUzRCUyMmJsYWNrJTIyJTNFJTBBJTIwJTIwJTNDY2lyY2xlJTIwdHJhbnNmb3JtJTNEJTIydHJhbnNsYXRlJTI4OCUyMDAlMjklMjIlMjBjeCUzRCUyMjAlMjIlMjBjeSUzRCUyMjE2JTIyJTIwciUzRCUyMjAlMjIlM0UlMjAlMEElMjAlMjAlMjAlMjAlM0NhbmltYXRlJTIwYXR0cmlidXRlTmFtZSUzRCUyMnIlMjIlMjB2YWx1ZXMlM0QlMjIwJTNCJTIwNCUzQiUyMDAlM0IlMjAwJTIyJTIwZHVyJTNEJTIyMS4ycyUyMiUyMHJlcGVhdENvdW50JTNEJTIyaW5kZWZpbml0ZSUyMiUyMGJlZ2luJTNEJTIyMCUyMiUwQSUyMCUyMCUyMCUyMCUyMCUyMGtleXRpbWVzJTNEJTIyMCUzQjAuMiUzQjAuNyUzQjElMjIlMjBrZXlTcGxpbmVzJTNEJTIyMC4yJTIwMC4yJTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTIyJTIwY2FsY01vZGUlM0QlMjJzcGxpbmUlMjIlMjAvJTNFJTBBJTIwJTIwJTNDL2NpcmNsZSUzRSUwQSUyMCUyMCUzQ2NpcmNsZSUyMHRyYW5zZm9ybSUzRCUyMnRyYW5zbGF0ZSUyODE2JTIwMCUyOSUyMiUyMGN4JTNEJTIyMCUyMiUyMGN5JTNEJTIyMTYlMjIlMjByJTNEJTIyMCUyMiUzRSUyMCUwQSUyMCUyMCUyMCUyMCUzQ2FuaW1hdGUlMjBhdHRyaWJ1dGVOYW1lJTNEJTIyciUyMiUyMHZhbHVlcyUzRCUyMjAlM0IlMjA0JTNCJTIwMCUzQiUyMDAlMjIlMjBkdXIlM0QlMjIxLjJzJTIyJTIwcmVwZWF0Q291bnQlM0QlMjJpbmRlZmluaXRlJTIyJTIwYmVnaW4lM0QlMjIwLjMlMjIlMEElMjAlMjAlMjAlMjAlMjAlMjBrZXl0aW1lcyUzRCUyMjAlM0IwLjIlM0IwLjclM0IxJTIyJTIwa2V5U3BsaW5lcyUzRCUyMjAuMiUyMDAuMiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUyMiUyMGNhbGNNb2RlJTNEJTIyc3BsaW5lJTIyJTIwLyUzRSUwQSUyMCUyMCUzQy9jaXJjbGUlM0UlMEElMjAlMjAlM0NjaXJjbGUlMjB0cmFuc2Zvcm0lM0QlMjJ0cmFuc2xhdGUlMjgyNCUyMDAlMjklMjIlMjBjeCUzRCUyMjAlMjIlMjBjeSUzRCUyMjE2JTIyJTIwciUzRCUyMjAlMjIlM0UlMjAlMEElMjAlMjAlMjAlMjAlM0NhbmltYXRlJTIwYXR0cmlidXRlTmFtZSUzRCUyMnIlMjIlMjB2YWx1ZXMlM0QlMjIwJTNCJTIwNCUzQiUyMDAlM0IlMjAwJTIyJTIwZHVyJTNEJTIyMS4ycyUyMiUyMHJlcGVhdENvdW50JTNEJTIyaW5kZWZpbml0ZSUyMiUyMGJlZ2luJTNEJTIyMC42JTIyJTBBJTIwJTIwJTIwJTIwJTIwJTIwa2V5dGltZXMlM0QlMjIwJTNCMC4yJTNCMC43JTNCMSUyMiUyMGtleVNwbGluZXMlM0QlMjIwLjIlMjAwLjIlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglMjIlMjBjYWxjTW9kZSUzRCUyMnNwbGluZSUyMiUyMC8lM0UlMEElMjAlMjAlM0MvY2lyY2xlJTNFJTBBJTNDL3N2ZyUzRVwiKSB7XG5cdFx0XHRpdGVtLnBob3RvID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRpdGVtLmRvbmUgPSB2YWx1ZXMuZG9uZTtcblx0XHRpdGVtLmxhc3RFZGl0ZWQgPSB2YWx1ZXMubGFzdEVkaXRlZDtcblx0XHRpdGVtLmRlbGV0aW5nID0gdmFsdWVzLmRlbGV0aW5nO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGF0YU9ubHlJdGVtKG9yaWdpbmFsKSB7XG5cdFx0dmFyIGl0ZW0gPSB7fTtcblx0XHR1cGRhdGVJdGVtRGF0YShpdGVtLCBvcmlnaW5hbCk7XG5cdFx0Zm9yICh2YXIga2V5IGluIGl0ZW0pIHtcblx0XHRcdGlmIChpdGVtW2tleV0gPT09IG51bGwgfHwgaXRlbVtrZXldID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0ZGVsZXRlIGl0ZW1ba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGl0ZW07XG5cdH1cblxuXHRmdW5jdGlvbiBnZXREYXRhT25seUxpc3QoaWQpIHtcblx0XHR2YXIgbGlzdCA9IGxpc3RzW2ZpbmRMaXN0SW5kZXhCeUlkKGlkKV07XG5cdFx0dmFyIHRleHRPbmx5TGlzdCA9IFtdO1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0Lml0ZW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0ZXh0T25seUxpc3QucHVzaChnZXREYXRhT25seUl0ZW0obGlzdC5pdGVtc1tpXSkpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGV4dE9ubHlMaXN0O1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlTGlzdChpZCwgaW1tZWRpYXRlKSB7XG5cdFx0Ly8gU2V0IGxpc3Qgc3RhdHVzIGZvciBkZWxldGlvblxuXHRcdHZhciBpbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGlkKTtcblx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0bGlzdHNbaW5kZXhdLmRlbGV0aW5nID0gdHJ1ZTtcblx0XHRcdGN1cnJlbnRMaXN0SWQgPSAnJztcblx0XHR9XG5cdFx0Ly8gZGVsZXRlIGRlbGF5XG5cdFx0dmFyIGRlbGF5ID0gNTAwMDtcblx0XHRpZiAoIWltbWVkaWF0ZSkgZGVsYXkgPSAwO1xuXHRcdGRlbGV0aW5nTGlzdElkID0gaWQ7XG5cdFx0ZGVsZXRlRGVmZXIgPSAkcS5kZWZlcigpO1xuXHRcdGRlbGV0ZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdC8vIGdldCBpbmRleCBhZ2FpbiwgYXMgaXQgbWF5IGhhdmUgY2hhbmdlZFxuXHRcdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoaWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVzb2x2ZSgnZGVsZXRlZCcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdsaXN0Tm90Rm91bmQnKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nTGlzdElkID0gdW5kZWZpbmVkO1xuXHRcdH0sIGRlbGF5KTtcblx0XHRyZXR1cm4gZGVsZXRlRGVmZXIucHJvbWlzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGRlbGV0ZUl0ZW0oaWQsIGltbWVkaWF0ZSkge1xuXHRcdC8vIFNldCBsaXN0IHN0YXR1cyBmb3IgZGVsZXRpb25cblx0XHR2YXIgaW5kZXggPSBnZXRDdXJyZW50TGlzdCgpLmdldEl0ZW1JbmRleEJ5SWQoaWQpO1xuXHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRnZXRDdXJyZW50TGlzdCgpLml0ZW1zW2luZGV4XS5kZWxldGluZyA9IHRydWU7XG5cdFx0fVxuXHRcdC8vIGRlbGV0ZSBkZWxheVxuXHRcdGRlbGV0aW5nSXRlbUlkID0gaWQ7XG5cdFx0ZGVsZXRpbmdMaXN0SWQgPSBnZXRDdXJyZW50TGlzdCgpLmlkOyAvLyBzdG9yZSBsaXN0IGlkIGluIGNhc2UgY3VycmVudCBsaXN0IGlzIGNoYW5nZWRcblx0XHRkZWxldGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0dmFyIGRlbGF5ID0gNTAwMDtcblx0XHRpZiAoIWltbWVkaWF0ZSkgZGVsYXkgPSAwO1xuXHRcdGRlbGV0ZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdC8vIGdldCBpbmRleCBhZ2FpbiwgYXMgaXQgbWF5IGhhdmUgY2hhbmdlZFxuXHRcdFx0dmFyIGxpc3RJbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGRlbGV0aW5nTGlzdElkKTtcblx0XHRcdGlmIChsaXN0SW5kZXggPj0gMCkge1xuXHRcdFx0XHR2YXIgaW5kZXggPSBsaXN0c1tsaXN0SW5kZXhdLmdldEl0ZW1JbmRleEJ5SWQoaWQpO1xuXHRcdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRcdGxpc3RzW2xpc3RJbmRleF0uaXRlbXMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0XHRkZWxldGVEZWZlci5yZXNvbHZlKCdkZWxldGVkJyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdsaXN0Tm90Rm91bmQnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdJdGVtSWQgPSB1bmRlZmluZWQ7XG5cdFx0fSwgZGVsYXkpO1xuXHRcdHJldHVybiBkZWxldGVEZWZlci5wcm9taXNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2FuY2VsRGVsZXRlKCkge1xuXHRcdGNsZWFyVGltZW91dChkZWxldGVUaW1lcik7XG5cdFx0aWYgKGRlbGV0aW5nSXRlbUlkKSB7XG5cdFx0XHR2YXIgbGlzdCA9IGxpc3RzW2ZpbmRMaXN0SW5kZXhCeUlkKGRlbGV0aW5nTGlzdElkKV07XG5cdFx0XHR2YXIgaW5kZXggPSBsaXN0LmdldEl0ZW1JbmRleEJ5SWQoZGVsZXRpbmdJZCk7XG5cdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRsaXN0Lml0ZW1zW2luZGV4XS5kZWxldGluZyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdJdGVtSWQgPSB1bmRlZmluZWQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBpbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGRlbGV0aW5nSWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdHNbaW5kZXhdLmRlbGV0aW5nID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGluZ0xpc3RJZCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdkZWxldGVDYW5jZWxsZWQnKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNldEN1cnJlbnRMaXN0KGxpc3QpIHtcblx0XHRpZiAodHlwZW9mIGxpc3QgPT09ICdudW1iZXInKSB7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gZmluZExpc3RJbmRleEJ5SWQobGlzdCk7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgbGlzdCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGN1cnJlbnRMaXN0SWQgPSBsaXN0LmlkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ3Vua25vd24gaW5wdXQgZm9yIGxpc3Q6ICcrIHR5cGVvZiBsaXN0KTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRDdXJyZW50TGlzdCgpIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIGxpc3RzW2ZpbmRMaXN0SW5kZXhCeUlkKGN1cnJlbnRMaXN0SWQpXTtcblx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdGNvbnNvbGUud2FybignTGlzdCBub3QgZm91bmQuIElEOiAnK2N1cnJlbnRMaXN0SWQpO1xuXHRcdFx0Y29uc29sZS53YXJuKGxpc3RzKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBpbXBvcnRMaXN0KGlkKSB7XG5cdFx0dmFyIGxpc3RSZWYgPSBmaXJlUmVmLmNoaWxkKGlkKTtcblx0XHR2YXIgbGlzdDtcblx0XHR2YXIgbG9jYWxJbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGlkKTtcblx0XHRpZiAobG9jYWxJbmRleCA8IDApIHtcblx0XHRcdGxpc3RzLnVuc2hpZnQobmV3IExpc3RPYmplY3QoaWQsICdTeW5jaHJvbmlzaW5nLi4uJykpXG5cdFx0XHRsaXN0ID0gbGlzdHNbMF07XG5cdFx0fSBlbHNlIHtcblx0XHRcdGxpc3QgPSBsaXN0c1tsb2NhbEluZGV4XTtcblx0XHR9XG5cdFx0bGlzdFJlZi5vbmNlKCd2YWx1ZScsIGZ1bmN0aW9uKHNuYXBzaG90KSB7XG5cdFx0XHRpZiAoc25hcHNob3QudmFsKCkpIHsgLy8gaWYgbGlzdCBleGlzdHNcblx0XHRcdFx0bGlzdC5uYW1lID0gc25hcHNob3QudmFsKCkubmFtZTtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKHNuYXBzaG90LnZhbCgpLml0ZW1zLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdFx0dXBkYXRlSXRlbSh2YWx1ZSk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGxpc3RSZWYuY2hpbGQoJ25hbWUnKS5vbigndmFsdWUnLCBmdW5jdGlvbihzbmFwc2hvdCkge1xuXHRcdFx0XHRcdGxpc3QubmFtZSA9IHNuYXBzaG90LnZhbCgpO1xuXHRcdFx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnZmlyZWJhc2VTeW5jJyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRsaXN0UmVmLmNoaWxkKCdpdGVtcycpLm9uKCdjaGlsZF9jaGFuZ2VkJywgZnVuY3Rpb24oc25hcHNob3QpIHtcblx0XHRcdFx0XHR1cGRhdGVJdGVtKHNuYXBzaG90LnZhbCgpKVxuXHRcdFx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnZmlyZWJhc2VTeW5jJyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bGlzdC5uYW1lID0gJ05ldyBMaXN0ICcrbGlzdHMubGVuZ3RoO1xuXHRcdFx0fVxuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdmaXJlYmFzZVN5bmMnKTtcblx0XHR9KTtcblx0XHRmdW5jdGlvbiB1cGRhdGVJdGVtKGl0ZW0pIHtcblx0XHRcdHZhciBsb2NhbEl0ZW1JbmRleCA9IGxpc3QuZ2V0SXRlbUluZGV4QnlJZChpdGVtLmlkKTtcblx0XHRcdGlmIChsb2NhbEl0ZW1JbmRleCA8IDApIHtcblx0XHRcdFx0bGlzdC5pdGVtcy5wdXNoKGdldERhdGFPbmx5SXRlbShpdGVtKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAobGlzdC5pdGVtc1tsb2NhbEl0ZW1JbmRleF0gIT0gaXRlbSkge1xuXHRcdFx0XHRcdHVwZGF0ZUl0ZW1EYXRhKGxpc3QuaXRlbXNbbG9jYWxJdGVtSW5kZXhdLCBpdGVtKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGxvY2FsUmV0cmlldmUoKSB7XG5cdFx0dmFyIHJldHJpZXZlZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdCYXNrZXRzJyk7XG5cdFx0aWYgKHJldHJpZXZlZCkge1xuXHRcdFx0dmFyIHBhcnNlZCA9IEpTT04ucGFyc2UocmV0cmlldmVkKTtcblx0XHRcdGZvciAodmFyIGk9MDsgaTxwYXJzZWQubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKCFwYXJzZWRbaV0uZGVsZXRpbmcpIHtcblx0XHRcdFx0XHR2YXIgbGlzdCA9IG5ldyBMaXN0T2JqZWN0KHBhcnNlZFtpXS5pZCwgcGFyc2VkW2ldLm5hbWUpO1xuXHRcdFx0XHRcdGxpc3QuaXRlbXMgPSBwYXJzZWRbaV0uaXRlbXM7XG5cdFx0XHRcdFx0bGlzdHMucHVzaChsaXN0KTtcblx0XHRcdFx0XHRpbXBvcnRMaXN0KGxpc3QuaWQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbG9jYWxTYXZlKCkge1xuXHRcdHZhciBqc29uID0gSlNPTi5zdHJpbmdpZnkobGlzdHMpO1xuXHRcdGlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnQmFza2V0cycpICE9PSBqc29uKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnQmFza2V0cycsIGpzb24pO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJ0Nhbm5vdCBzdG9yZSBkYXRhIHRvIGxvY2FsIHN0b3JhZ2U6ICcrZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIHN5bmNBbGwoKSB7XG5cdFx0aWYgKGxvY2FsU2F2ZSgpKSB7XG5cdFx0XHRzeW5jQ3VycmVudExpc3QoKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBzeW5jQ3VycmVudExpc3QoKSB7XG5cdFx0aWYgKGdldEN1cnJlbnRMaXN0KCkpIHtcblx0XHRcdHZhciBpdGVtcyA9IGdldERhdGFPbmx5TGlzdChnZXRDdXJyZW50TGlzdCgpLmlkKTtcblx0XHRcdGZpcmVSZWYuY2hpbGQoZ2V0Q3VycmVudExpc3QoKS5pZCkuY2hpbGQoJ25hbWUnKS5zZXQoZ2V0Q3VycmVudExpc3QoKS5uYW1lKTtcblx0XHRcdGZvciAodmFyIGk9MDsgaTxpdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRmaXJlUmVmLmNoaWxkKGdldEN1cnJlbnRMaXN0KCkuaWQpLmNoaWxkKCdpdGVtcycpLmNoaWxkKGl0ZW1zW2ldLmlkKS51cGRhdGUoaXRlbXNbaV0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ2lkR2VuZXJhdG9yJywgaWRHZW5lcmF0b3IpO1xuXG5mdW5jdGlvbiBpZEdlbmVyYXRvcigpIHtcblxuXHRyZXR1cm4ge1xuXHRcdGdldDogZ2V0VW5pcUlkLFxuXHR9O1xuXG5cdGZ1bmN0aW9uIGdldFVuaXFJZChsZW5ndGgpIHtcblx0XHRyZXR1cm4gKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpNYXRoLnBvdygzNixsZW5ndGgpKS50b1N0cmluZygzNikpLnNsaWNlKC1sZW5ndGgpO1xuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnc2hhcmVTZXJ2aWNlJywgc2hhcmVTZXJ2aWNlKTtcblxuZnVuY3Rpb24gc2hhcmVTZXJ2aWNlKCkge1xuXG5cdHJldHVybiB7XG5cdFx0Z2V0TGluazogZ2V0TGluayxcblx0XHR3cml0ZUVtYWlsOiB3cml0ZUVtYWlsLFxuXHR9O1xuXG5cdGZ1bmN0aW9uIGdldExpbmsobGlzdCkge1xuXHRcdHJldHVybiBsb2NhdGlvbi5vcmlnaW4rbG9jYXRpb24ucGF0aG5hbWUrXCIjbGlzdD1cIitsaXN0LmlkO1xuXHR9XG5cblx0ZnVuY3Rpb24gd3JpdGVFbWFpbChsaXN0KSB7XG5cdFx0dmFyIHJlc3VsdHMgPSBbXTtcblx0XHRyZXN1bHRzLnB1c2goXCJBZGQgdGhpcyBsaXN0IHRvIHlvdXIgQmFza2V0IGF0IFwiK2dldExpbmsobGlzdCkpO1xuXHRcdHJlc3VsdHMucHVzaChcIj09PT09PT09PT09PT09PT09PT09XCIpO1xuXHRcdHJlc3VsdHMucHVzaChsaXN0Lm5hbWUpO1xuXHRcdHJlc3VsdHMucHVzaChcIj09PT09PT09PT09PT09PT09PT09XCIpO1xuXHRcdHJlc3VsdHMucHVzaChcIlwiKTtcblx0XHRmb3IgKHZhciBpPTA7IGk8bGlzdC5pdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGl0ZW0gPSBsaXN0Lml0ZW1zW2ldO1xuXHRcdFx0cmVzdWx0cy5wdXNoKGl0ZW0udGl0bGUpO1xuXHRcdFx0cmVzdWx0cy5wdXNoKFwiXCIpO1xuXHRcdFx0aWYgKGl0ZW0ubm90ZSkgcmVzdWx0cy5wdXNoKCdOb3RlczogJytpdGVtLm5vdGUpO1xuXHRcdFx0aWYgKGl0ZW0uYXNzaWduKSByZXN1bHRzLnB1c2goJ0Fzc2lnbmVkIHRvICcraXRlbS5hc3NpZ24pO1xuXHRcdFx0cmVzdWx0cy5wdXNoKFwiLS0tLS0tLS0tLS0tLS0tLS0tLS1cIik7XG5cdFx0XHRyZXN1bHRzLnB1c2goXCJcIik7XG5cdFx0fVxuXHRcdHZhciBib2R5ID0gcmVzdWx0cy5qb2luKCclMEEnKTsgLy8gbmV3IGxpbmVcblx0XHRyZXR1cm4gJ21haWx0bzo/Ym9keT0nK2JvZHk7XG5cdH1cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdCYXNrZXRDb250cm9sbGVyJywgQmFza2V0Q29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEJhc2tldENvbnRyb2xsZXIoJG1kU2lkZW5hdiwgJG1kTWVkaWEsIGFsbExpc3RzU2VydmljZSwgJG1kVG9hc3QsIHN1cHBvcnQsICRzY29wZSwgJG1kRGlhbG9nLCBzaGFyZVNlcnZpY2UpIHtcblx0dmFyIHZtID0gdGhpcztcblx0dm0udG9nZ2xlTGlzdHNWaWV3ID0gdG9nZ2xlTGlzdHNWaWV3O1xuXHR2bS5jbG9zZUxpc3RzVmlldyA9IGNsb3NlTGlzdHNWaWV3O1xuXHR2bS5kZWxldGVMaXN0QnlJZCA9IGRlbGV0ZUxpc3RCeUlkO1xuXHR2bS5zaGFyZUxpc3QgPSBzaGFyZUxpc3Q7XG5cdHZtLnN1cHBvcnQgPSBzdXBwb3J0O1xuXG5cdC8vIGxvYWQvc2F2ZSBkYXRhXG5cdGFsbExpc3RzU2VydmljZS5zeW5jQWxsKCk7XG5cdHNldEludGVydmFsKGFsbExpc3RzU2VydmljZS5zeW5jQWxsLCA1MDAwKTtcblxuXHQkc2NvcGUuJG9uKCdmaXJlYmFzZVN5bmMnLCBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdH0pO1xuXG5cdGlmIChsb2NhdGlvbi5oYXNoLnN1YnN0cmluZygxKS5pbmRleE9mKCdsaXN0PScpID09PSAwKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmltcG9ydExpc3QobG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoNikpO1xuXHR9XG5cdHdpbmRvdy5pbXBvcnRCYXNrZXRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmltcG9ydExpc3Q7XG5cblx0ZnVuY3Rpb24gc2hhcmVMaXN0KGxpc3QsIGUpIHtcblx0XHQkbWREaWFsb2cuc2hvdyhcblx0XHRcdCRtZERpYWxvZy5hbGVydCgpXG5cdFx0XHRcdFx0LmNsaWNrT3V0c2lkZVRvQ2xvc2UodHJ1ZSlcblx0XHRcdFx0XHQudGFyZ2V0RXZlbnQoZSlcblx0XHRcdFx0XHQudGl0bGUoJ1NoYXJlICcrbGlzdC5uYW1lKVxuXHRcdFx0XHRcdC5jb250ZW50KCdWaWV3IGFuZCBlZGl0IHRoaXMgbGlzdCBvbiBhbnkgZGV2aWNlIGF0ICcrc2hhcmVTZXJ2aWNlLmdldExpbmsobGlzdCkpXG5cdFx0XHRcdFx0Lm9rKCdTZW5kIGxpc3QgYXMgZW1haWwnKVxuXHRcdCk7XG5cdFx0Ly93aW5kb3cub3BlbihzaGFyZVNlcnZpY2Uud3JpdGVFbWFpbChsaXN0KSk7XG5cdH1cblxuXHQvLyBzaWRlbmF2IGJlaGF2aW91clxuXHR2bS4kbWRNZWRpYSA9ICRtZE1lZGlhO1xuXHRpZiAoIXZtLiRtZE1lZGlhKCdsZycpKSB7XG5cdFx0dm0ubGlzdHNWaWV3T3BlbiA9IHRydWU7XG5cdH1cblx0ZnVuY3Rpb24gdG9nZ2xlTGlzdHNWaWV3KCkge1xuXHRcdCRtZFNpZGVuYXYoJ2xlZnQnKS50b2dnbGUoKTtcblx0fVxuXHRmdW5jdGlvbiBjbG9zZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykuY2xvc2UoKTtcblx0fVxuXG5cdC8vIExpc3RzIGRlbGV0ZSBvcGVyYXRpb25zXG5cdGZ1bmN0aW9uIGRlbGV0ZUxpc3RCeUlkKGlkKSB7XG5cdFx0Ly8gc2hvdyB1bmRvIHRvYXN0XG5cdFx0dmFyIGRlbGV0ZVRvYXN0ID0gJG1kVG9hc3Quc2ltcGxlKCkuY29udGVudCgnTGlzdCBEZWxldGVkJykuYWN0aW9uKCdVbmRvJykuaGlnaGxpZ2h0QWN0aW9uKHRydWUpO1xuXHRcdCRtZFRvYXN0LnNob3coZGVsZXRlVG9hc3QpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZSA9PT0gJ29rJykge1xuXHRcdFx0XHR1bmRvRGVsZXRlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcGVyZm9ybSBkZWxldGVcblx0XHRhbGxMaXN0c1NlcnZpY2UuZGVsZXRlTGlzdChpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRtZFRvYXN0LmhpZGUoKTtcblx0XHR9KTtcblx0XHQvLyBoaWRlIGN1cnJlbnRseSBlZGl0aW5nIGxpc3Rcblx0XHQkbWRTaWRlbmF2KCdsZWZ0Jykub3BlbigpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdW5kb0RlbGV0ZSgpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2UuY2FuY2VsRGVsZXRlKCk7XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1zQ29udHJvbGxlcicsIEl0ZW1zQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1zQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UsICRtZFRvYXN0LCAkbWRNZWRpYSkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXG5cdHZtLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHR2bS5nZXRDdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblx0dm0uZGVsZXRlSXRlbSA9IGRlbGV0ZUl0ZW07XG5cdHZtLnNlYXJjaE5hbWUgPSBzZWFyY2hOYW1lO1xuXHR2bS5nZXRQaG90byA9IGdldFBob3RvO1xuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0aWYgKCFhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKSkge1xuXHRcdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdFx0fVxuXHRcdHZtLmdldEN1cnJlbnRMaXN0KCkuYWRkSXRlbSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlSXRlbShpZCkge1xuXHRcdC8vIHNob3cgdW5kbyB0b2FzdFxuXHRcdHZhciBkZWxldGVUb2FzdCA9ICRtZFRvYXN0LnNpbXBsZSgpLmNvbnRlbnQoJ0l0ZW0gRGVsZXRlZCcpLmFjdGlvbignVW5kbycpLmhpZ2hsaWdodEFjdGlvbih0cnVlKTtcblx0XHQkbWRUb2FzdC5zaG93KGRlbGV0ZVRvYXN0KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2UgPT09ICdvaycpIHtcblx0XHRcdFx0dW5kb0RlbGV0ZSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdC8vIHBlcmZvcm0gZGVsZXRlXG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmRlbGV0ZUl0ZW0oaWQpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkbWRUb2FzdC5oaWRlKCk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiB1bmRvRGVsZXRlKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5jYW5jZWxEZWxldGUoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNlYXJjaE5hbWUocXVlcnkpIHtcblx0XHR2YXIgYWxsSXRlbXMgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKS5pdGVtcztcblx0XHR2YXIgbmFtZXMgPSBbcXVlcnldO1xuXHRcdC8vIGdldCBsaXN0IG9mIGFsbCB1bmlxdWUgbmFtZXNcblx0XHRmb3IgKHZhciBpPTA7IGk8YWxsSXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBuYW1lID0gYWxsSXRlbXNbaV0uYXNzaWduO1xuXHRcdFx0aWYgKG5hbWUgJiYgbmFtZXMuaW5kZXhPZihuYW1lKSA8IDApIHsgLy8gaWYgbmFtZSBpc24ndCBhbHJlYWR5IGluIGxpc3Rcblx0XHRcdFx0bmFtZXMucHVzaChuYW1lKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gZmluZCBtYXRjaGVkIG5hbWVzXG5cdFx0dmFyIG1hdGNoZXMgPSBuYW1lcy5maWx0ZXIoZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0cmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHF1ZXJ5LnRvTG93ZXJDYXNlKCkpID09PSAwO1xuXHRcdH0pO1xuXHRcdHJldHVybiBtYXRjaGVzO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0UGhvdG8oaWQsIHByb21pc2UpIHtcblx0XHR2YXIgbGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpO1xuXHRcdHZhciBpbmRleCA9IGxpc3QuZ2V0SXRlbUluZGV4QnlJZChpZCk7XG5cdFx0dmFyIGxvYWRpbmdJY29uID0gXCJkYXRhOmltYWdlL3N2Zyt4bWwsJTNDc3ZnJTIweG1sbnMlM0QlMjJodHRwJTNBLy93d3cudzMub3JnLzIwMDAvc3ZnJTIyJTIwdmlld0JveCUzRCUyMjAlMjAwJTIwMzIlMjAzMiUyMiUyMHdpZHRoJTNEJTIyMzIlMjIlMjBoZWlnaHQlM0QlMjIzMiUyMiUyMGZpbGwlM0QlMjJibGFjayUyMiUzRSUwQSUyMCUyMCUzQ2NpcmNsZSUyMHRyYW5zZm9ybSUzRCUyMnRyYW5zbGF0ZSUyODglMjAwJTI5JTIyJTIwY3glM0QlMjIwJTIyJTIwY3klM0QlMjIxNiUyMiUyMHIlM0QlMjIwJTIyJTNFJTIwJTBBJTIwJTIwJTIwJTIwJTNDYW5pbWF0ZSUyMGF0dHJpYnV0ZU5hbWUlM0QlMjJyJTIyJTIwdmFsdWVzJTNEJTIyMCUzQiUyMDQlM0IlMjAwJTNCJTIwMCUyMiUyMGR1ciUzRCUyMjEuMnMlMjIlMjByZXBlYXRDb3VudCUzRCUyMmluZGVmaW5pdGUlMjIlMjBiZWdpbiUzRCUyMjAlMjIlMEElMjAlMjAlMjAlMjAlMjAlMjBrZXl0aW1lcyUzRCUyMjAlM0IwLjIlM0IwLjclM0IxJTIyJTIwa2V5U3BsaW5lcyUzRCUyMjAuMiUyMDAuMiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUyMiUyMGNhbGNNb2RlJTNEJTIyc3BsaW5lJTIyJTIwLyUzRSUwQSUyMCUyMCUzQy9jaXJjbGUlM0UlMEElMjAlMjAlM0NjaXJjbGUlMjB0cmFuc2Zvcm0lM0QlMjJ0cmFuc2xhdGUlMjgxNiUyMDAlMjklMjIlMjBjeCUzRCUyMjAlMjIlMjBjeSUzRCUyMjE2JTIyJTIwciUzRCUyMjAlMjIlM0UlMjAlMEElMjAlMjAlMjAlMjAlM0NhbmltYXRlJTIwYXR0cmlidXRlTmFtZSUzRCUyMnIlMjIlMjB2YWx1ZXMlM0QlMjIwJTNCJTIwNCUzQiUyMDAlM0IlMjAwJTIyJTIwZHVyJTNEJTIyMS4ycyUyMiUyMHJlcGVhdENvdW50JTNEJTIyaW5kZWZpbml0ZSUyMiUyMGJlZ2luJTNEJTIyMC4zJTIyJTBBJTIwJTIwJTIwJTIwJTIwJTIwa2V5dGltZXMlM0QlMjIwJTNCMC4yJTNCMC43JTNCMSUyMiUyMGtleVNwbGluZXMlM0QlMjIwLjIlMjAwLjIlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglMjIlMjBjYWxjTW9kZSUzRCUyMnNwbGluZSUyMiUyMC8lM0UlMEElMjAlMjAlM0MvY2lyY2xlJTNFJTBBJTIwJTIwJTNDY2lyY2xlJTIwdHJhbnNmb3JtJTNEJTIydHJhbnNsYXRlJTI4MjQlMjAwJTI5JTIyJTIwY3glM0QlMjIwJTIyJTIwY3klM0QlMjIxNiUyMiUyMHIlM0QlMjIwJTIyJTNFJTIwJTBBJTIwJTIwJTIwJTIwJTNDYW5pbWF0ZSUyMGF0dHJpYnV0ZU5hbWUlM0QlMjJyJTIyJTIwdmFsdWVzJTNEJTIyMCUzQiUyMDQlM0IlMjAwJTNCJTIwMCUyMiUyMGR1ciUzRCUyMjEuMnMlMjIlMjByZXBlYXRDb3VudCUzRCUyMmluZGVmaW5pdGUlMjIlMjBiZWdpbiUzRCUyMjAuNiUyMiUwQSUyMCUyMCUyMCUyMCUyMCUyMGtleXRpbWVzJTNEJTIyMCUzQjAuMiUzQjAuNyUzQjElMjIlMjBrZXlTcGxpbmVzJTNEJTIyMC4yJTIwMC4yJTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTIyJTIwY2FsY01vZGUlM0QlMjJzcGxpbmUlMjIlMjAvJTNFJTBBJTIwJTIwJTNDL2NpcmNsZSUzRSUwQSUzQy9zdmclM0VcIjtcblx0XHQvLyBzZXQgYXMgbG9hZGluZyBpY29uIG9uIG1vYmlsZVxuXHRcdHByb21pc2UudGhlbihmdW5jdGlvbihmaWxlKXtcblx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLnBob3RvID0gZmlsZTtcblx0XHR9LCBudWxsXG5cdFx0LCBmdW5jdGlvbih1cGRhdGUpIHtcblx0XHRcdGlmICh1cGRhdGUgPT09ICdnZXR0aW5nJykge1xuXHRcdFx0XHRsaXN0Lml0ZW1zW2luZGV4XS5waG90byA9IGxvYWRpbmdJY29uO1xuXHRcdFx0fSBlbHNlIGlmICh1cGRhdGUgPT09ICdub0ltYWdlJykge1xuXHRcdFx0XHRpZiAobGlzdC5pdGVtc1tpbmRleF0ucGhvdG8gPT0gbG9hZGluZ0ljb24pIHtcblx0XHRcdFx0XHRsaXN0Lml0ZW1zW2luZGV4XS5waG90byA9IHVuZGVmaW5lZDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdMaXN0c0NvbnRyb2xsZXInLCBMaXN0c0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBMaXN0c0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cblx0dmFyIHZtID0gdGhpcztcblx0XG5cdHZtLmxpc3RzID0gYWxsTGlzdHNTZXJ2aWNlLmxpc3RzO1xuXG5cdHZtLmFkZExpc3QgPSBmdW5jdGlvbigpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0fTtcblxuXHR2bS5jdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==