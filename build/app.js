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
				if (list.items[index].photo === loadingIcon) {
					list.items[index].photo = '';
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
			if (fileDefer) {
				if (waitingInput > 0) {
					waitingInput = 0;
					fileDefer.notify('noImage');
				} else {
					waitingInput++;
					fileDefer.notify('getting');
				}
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
			localStorage.setItem('Baskets', json);
			return true;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9MaXN0c0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2JrSXRlbS5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0SW5mby5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0Vmlldy5qcyIsInNlcnZpY2VzL0l0ZW1PYmplY3QuanMiLCJzZXJ2aWNlcy9MaXN0T2JqZWN0LmpzIiwic2VydmljZXMvYWxsTGlzdHNTZXJ2aWNlLmpzIiwic2VydmljZXMvaWRHZW5lcmF0b3IuanMiLCJzZXJ2aWNlcy9zaGFyZVNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxPQUFPLFlBQVk7Q0FDdEIsY0FBYzs7O0FBR2YsSUFBSSxNQUFNLFFBQVEsT0FBTyxPQUFPLENBQUM7S0FDNUIsU0FBUyxXQUFXLENBQUMsWUFBWTtBQUN0QztBQ05BO0VBQ0UsT0FBTztFQUNQLFdBQVcsb0JBQW9COztBQUVqQyxTQUFTLGlCQUFpQixZQUFZLFVBQVUsaUJBQWlCLFVBQVUsU0FBUyxRQUFRLFdBQVcsY0FBYztDQUNwSCxJQUFJLEtBQUs7Q0FDVCxHQUFHLGtCQUFrQjtDQUNyQixHQUFHLGlCQUFpQjtDQUNwQixHQUFHLGlCQUFpQjtDQUNwQixHQUFHLFlBQVk7Q0FDZixHQUFHLFVBQVU7OztDQUdiLGdCQUFnQjtDQUNoQixZQUFZLGdCQUFnQixTQUFTOztDQUVyQyxPQUFPLElBQUksZ0JBQWdCLFdBQVc7RUFDckMsT0FBTzs7O0NBR1IsSUFBSSxTQUFTLEtBQUssVUFBVSxHQUFHLFFBQVEsYUFBYSxHQUFHO0VBQ3RELGdCQUFnQixXQUFXLFNBQVMsS0FBSyxVQUFVOztDQUVwRCxPQUFPLG1CQUFtQixnQkFBZ0I7O0NBRTFDLFNBQVMsVUFBVSxNQUFNLEdBQUc7RUFDM0IsVUFBVTtHQUNULFVBQVU7TUFDUCxvQkFB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QUs7OztDQUdOLFNBQVMsVUFBVSxRQUFRO0VBQzFCLE9BQU8sQ0FBQyxLQUFLLE1BQU0sS0FBSyxTQUFTLEtBQUssSUFBSSxHQUFHLFNBQVMsU0FBUyxLQUFLLE1BQU0sQ0FBQzs7Q0FFNUU7QUNiRDtFQUNFLE9BQU87RUFDUCxRQUFRLGdCQUFnQjs7QUFFMUIsU0FBUyxlQUFlOztDQUV2QixPQUFPO0VBQ04sU0FBUztFQUNULFlBQVk7OztDQUdiLFNBQVMsUUFBUSxNQUFNO0VBQ3RCLE9BQU8sU0FBUyxPQUFPLFNBQVMsU0FBUyxTQUFTLEtBQUs7OztDQUd4RCxTQUFTLFdBQVcsTUFBTTtFQUN6QixJQUFJLFVBQVU7RUFDZCxRQUFRLEtBQUssbUNBQW1DLFFBQVE7RUFDeEQsUUFBUSxLQUFLO0VBQ2IsUUFBUSxLQUFLLEtBQUs7RUFDbEIsUUFBUSxLQUFLO0VBQ2IsUUFBUSxLQUFLO0VBQ2IsS0FBSyxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssTUFBTSxRQUFRLEtBQUs7R0FDdkMsSUFBSSxPQUFPLEtBQUssTUFBTTtHQUN0QixRQUFRLEtBQUssS0FBSztHQUNsQixRQUFRLEtBQUs7R0FDYixJQUFJLEtBQUssTUFBTSxRQUFRLEtBQUssVUFBVSxLQUFLO0dBQzNDLElBQUksS0FBSyxRQUFRLFFBQVEsS0FBSyxlQUFlLEtBQUs7R0FDbEQsUUFBUSxLQUFLO0dBQ2IsUUFBUSxLQUFLOztFQUVkLElBQUksT0FBTyxRQUFRLEtBQUs7RUFDeEIsT0FBTyxnQkFBZ0I7O0NBRXhCIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImlmICh3aW5kb3cuRmlsZVJlYWRlcikge1xuXHRmaWxlU3VwcG9ydCA9IHRydWU7XG59XG5cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyduZ01hdGVyaWFsJ10pXG5cdFx0XHRcdC5jb25zdGFudCgnc3VwcG9ydCcsIHtmaWxlUmVhZGVyOiBmaWxlU3VwcG9ydH0pO1xuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignQmFza2V0Q29udHJvbGxlcicsIEJhc2tldENvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBCYXNrZXRDb250cm9sbGVyKCRtZFNpZGVuYXYsICRtZE1lZGlhLCBhbGxMaXN0c1NlcnZpY2UsICRtZFRvYXN0LCBzdXBwb3J0LCAkc2NvcGUsICRtZERpYWxvZywgc2hhcmVTZXJ2aWNlKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cdHZtLnRvZ2dsZUxpc3RzVmlldyA9IHRvZ2dsZUxpc3RzVmlldztcblx0dm0uY2xvc2VMaXN0c1ZpZXcgPSBjbG9zZUxpc3RzVmlldztcblx0dm0uZGVsZXRlTGlzdEJ5SWQgPSBkZWxldGVMaXN0QnlJZDtcblx0dm0uc2hhcmVMaXN0ID0gc2hhcmVMaXN0O1xuXHR2bS5zdXBwb3J0ID0gc3VwcG9ydDtcblxuXHQvLyBsb2FkL3NhdmUgZGF0YVxuXHRhbGxMaXN0c1NlcnZpY2Uuc3luY0FsbCgpO1xuXHRzZXRJbnRlcnZhbChhbGxMaXN0c1NlcnZpY2Uuc3luY0FsbCwgNTAwMCk7XG5cblx0JHNjb3BlLiRvbignZmlyZWJhc2VTeW5jJywgZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLiRhcHBseSgpO1xuXHR9KTtcblxuXHRpZiAobG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoMSkuaW5kZXhPZignbGlzdD0nKSA9PT0gMCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5pbXBvcnRMaXN0KGxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDYpKTtcblx0fVxuXHR3aW5kb3cuaW1wb3J0QmFza2V0TGlzdCA9IGFsbExpc3RzU2VydmljZS5pbXBvcnRMaXN0O1xuXG5cdGZ1bmN0aW9uIHNoYXJlTGlzdChsaXN0LCBlKSB7XG5cdFx0JG1kRGlhbG9nLnNob3coXG5cdFx0XHQkbWREaWFsb2cuYWxlcnQoKVxuXHRcdFx0XHRcdC5jbGlja091dHNpZGVUb0Nsb3NlKHRydWUpXG5cdFx0XHRcdFx0LnRhcmdldEV2ZW50KGUpXG5cdFx0XHRcdFx0LnRpdGxlKCdTaGFyZSAnK2xpc3QubmFtZSlcblx0XHRcdFx0XHQuY29udGVudCgnVmlldyBhbmQgZWRpdCB0aGlzIGxpc3Qgb24gYW55IGRldmljZSBhdCAnK3NoYXJlU2VydmljZS5nZXRMaW5rKGxpc3QpKVxuXHRcdCk7XG5cdFx0Ly93aW5kb3cub3BlbihzaGFyZVNlcnZpY2Uud3JpdGVFbWFpbChsaXN0KSk7XG5cdH1cblxuXHQvLyBzaWRlbmF2IGJlaGF2aW91clxuXHR2bS4kbWRNZWRpYSA9ICRtZE1lZGlhO1xuXHRpZiAoIXZtLiRtZE1lZGlhKCdsZycpKSB7XG5cdFx0dm0ubGlzdHNWaWV3T3BlbiA9IHRydWU7XG5cdH1cblx0ZnVuY3Rpb24gdG9nZ2xlTGlzdHNWaWV3KCkge1xuXHRcdCRtZFNpZGVuYXYoJ2xlZnQnKS50b2dnbGUoKTtcblx0fVxuXHRmdW5jdGlvbiBjbG9zZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykuY2xvc2UoKTtcblx0fVxuXG5cdC8vIExpc3RzIGRlbGV0ZSBvcGVyYXRpb25zXG5cdGZ1bmN0aW9uIGRlbGV0ZUxpc3RCeUlkKGlkKSB7XG5cdFx0Ly8gc2hvdyB1bmRvIHRvYXN0XG5cdFx0dmFyIGRlbGV0ZVRvYXN0ID0gJG1kVG9hc3Quc2ltcGxlKCkuY29udGVudCgnTGlzdCBEZWxldGVkJykuYWN0aW9uKCdVbmRvJykuaGlnaGxpZ2h0QWN0aW9uKHRydWUpO1xuXHRcdCRtZFRvYXN0LnNob3coZGVsZXRlVG9hc3QpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZSA9PT0gJ29rJykge1xuXHRcdFx0XHR1bmRvRGVsZXRlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcGVyZm9ybSBkZWxldGVcblx0XHRhbGxMaXN0c1NlcnZpY2UuZGVsZXRlTGlzdChpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRtZFRvYXN0LmhpZGUoKTtcblx0XHR9KTtcblx0XHQvLyBoaWRlIGN1cnJlbnRseSBlZGl0aW5nIGxpc3Rcblx0XHQkbWRTaWRlbmF2KCdsZWZ0Jykub3BlbigpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdW5kb0RlbGV0ZSgpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2UuY2FuY2VsRGVsZXRlKCk7XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1zQ29udHJvbGxlcicsIEl0ZW1zQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1zQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UsICRtZFRvYXN0LCAkbWRNZWRpYSkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXG5cdHZtLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHR2bS5nZXRDdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblx0dm0uZGVsZXRlSXRlbSA9IGRlbGV0ZUl0ZW07XG5cdHZtLnNlYXJjaE5hbWUgPSBzZWFyY2hOYW1lO1xuXHR2bS5nZXRQaG90byA9IGdldFBob3RvO1xuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0aWYgKCFhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKSkge1xuXHRcdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdFx0fVxuXHRcdHZtLmdldEN1cnJlbnRMaXN0KCkuYWRkSXRlbSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlSXRlbShpZCkge1xuXHRcdC8vIHNob3cgdW5kbyB0b2FzdFxuXHRcdHZhciBkZWxldGVUb2FzdCA9ICRtZFRvYXN0LnNpbXBsZSgpLmNvbnRlbnQoJ0l0ZW0gRGVsZXRlZCcpLmFjdGlvbignVW5kbycpLmhpZ2hsaWdodEFjdGlvbih0cnVlKTtcblx0XHQkbWRUb2FzdC5zaG93KGRlbGV0ZVRvYXN0KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2UgPT09ICdvaycpIHtcblx0XHRcdFx0dW5kb0RlbGV0ZSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdC8vIHBlcmZvcm0gZGVsZXRlXG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmRlbGV0ZUl0ZW0oaWQpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkbWRUb2FzdC5oaWRlKCk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiB1bmRvRGVsZXRlKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5jYW5jZWxEZWxldGUoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNlYXJjaE5hbWUocXVlcnkpIHtcblx0XHR2YXIgYWxsSXRlbXMgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKS5pdGVtcztcblx0XHR2YXIgbmFtZXMgPSBbcXVlcnldO1xuXHRcdC8vIGdldCBsaXN0IG9mIGFsbCB1bmlxdWUgbmFtZXNcblx0XHRmb3IgKHZhciBpPTA7IGk8YWxsSXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBuYW1lID0gYWxsSXRlbXNbaV0uYXNzaWduO1xuXHRcdFx0aWYgKG5hbWUgJiYgbmFtZXMuaW5kZXhPZihuYW1lKSA8IDApIHsgLy8gaWYgbmFtZSBpc24ndCBhbHJlYWR5IGluIGxpc3Rcblx0XHRcdFx0bmFtZXMucHVzaChuYW1lKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gZmluZCBtYXRjaGVkIG5hbWVzXG5cdFx0dmFyIG1hdGNoZXMgPSBuYW1lcy5maWx0ZXIoZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0cmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHF1ZXJ5LnRvTG93ZXJDYXNlKCkpID09PSAwO1xuXHRcdH0pO1xuXHRcdHJldHVybiBtYXRjaGVzO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0UGhvdG8oaWQsIHByb21pc2UpIHtcblx0XHR2YXIgbGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpO1xuXHRcdHZhciBpbmRleCA9IGxpc3QuZ2V0SXRlbUluZGV4QnlJZChpZCk7XG5cdFx0dmFyIGxvYWRpbmdJY29uID0gXCJkYXRhOmltYWdlL3N2Zyt4bWwsJTNDc3ZnJTIweG1sbnMlM0QlMjJodHRwJTNBLy93d3cudzMub3JnLzIwMDAvc3ZnJTIyJTIwdmlld0JveCUzRCUyMjAlMjAwJTIwMzIlMjAzMiUyMiUyMHdpZHRoJTNEJTIyMzIlMjIlMjBoZWlnaHQlM0QlMjIzMiUyMiUyMGZpbGwlM0QlMjJibGFjayUyMiUzRSUwQSUyMCUyMCUzQ2NpcmNsZSUyMHRyYW5zZm9ybSUzRCUyMnRyYW5zbGF0ZSUyODglMjAwJTI5JTIyJTIwY3glM0QlMjIwJTIyJTIwY3klM0QlMjIxNiUyMiUyMHIlM0QlMjIwJTIyJTNFJTIwJTBBJTIwJTIwJTIwJTIwJTNDYW5pbWF0ZSUyMGF0dHJpYnV0ZU5hbWUlM0QlMjJyJTIyJTIwdmFsdWVzJTNEJTIyMCUzQiUyMDQlM0IlMjAwJTNCJTIwMCUyMiUyMGR1ciUzRCUyMjEuMnMlMjIlMjByZXBlYXRDb3VudCUzRCUyMmluZGVmaW5pdGUlMjIlMjBiZWdpbiUzRCUyMjAlMjIlMEElMjAlMjAlMjAlMjAlMjAlMjBrZXl0aW1lcyUzRCUyMjAlM0IwLjIlM0IwLjclM0IxJTIyJTIwa2V5U3BsaW5lcyUzRCUyMjAuMiUyMDAuMiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUyMiUyMGNhbGNNb2RlJTNEJTIyc3BsaW5lJTIyJTIwLyUzRSUwQSUyMCUyMCUzQy9jaXJjbGUlM0UlMEElMjAlMjAlM0NjaXJjbGUlMjB0cmFuc2Zvcm0lM0QlMjJ0cmFuc2xhdGUlMjgxNiUyMDAlMjklMjIlMjBjeCUzRCUyMjAlMjIlMjBjeSUzRCUyMjE2JTIyJTIwciUzRCUyMjAlMjIlM0UlMjAlMEElMjAlMjAlMjAlMjAlM0NhbmltYXRlJTIwYXR0cmlidXRlTmFtZSUzRCUyMnIlMjIlMjB2YWx1ZXMlM0QlMjIwJTNCJTIwNCUzQiUyMDAlM0IlMjAwJTIyJTIwZHVyJTNEJTIyMS4ycyUyMiUyMHJlcGVhdENvdW50JTNEJTIyaW5kZWZpbml0ZSUyMiUyMGJlZ2luJTNEJTIyMC4zJTIyJTBBJTIwJTIwJTIwJTIwJTIwJTIwa2V5dGltZXMlM0QlMjIwJTNCMC4yJTNCMC43JTNCMSUyMiUyMGtleVNwbGluZXMlM0QlMjIwLjIlMjAwLjIlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglMjIlMjBjYWxjTW9kZSUzRCUyMnNwbGluZSUyMiUyMC8lM0UlMEElMjAlMjAlM0MvY2lyY2xlJTNFJTBBJTIwJTIwJTNDY2lyY2xlJTIwdHJhbnNmb3JtJTNEJTIydHJhbnNsYXRlJTI4MjQlMjAwJTI5JTIyJTIwY3glM0QlMjIwJTIyJTIwY3klM0QlMjIxNiUyMiUyMHIlM0QlMjIwJTIyJTNFJTIwJTBBJTIwJTIwJTIwJTIwJTNDYW5pbWF0ZSUyMGF0dHJpYnV0ZU5hbWUlM0QlMjJyJTIyJTIwdmFsdWVzJTNEJTIyMCUzQiUyMDQlM0IlMjAwJTNCJTIwMCUyMiUyMGR1ciUzRCUyMjEuMnMlMjIlMjByZXBlYXRDb3VudCUzRCUyMmluZGVmaW5pdGUlMjIlMjBiZWdpbiUzRCUyMjAuNiUyMiUwQSUyMCUyMCUyMCUyMCUyMCUyMGtleXRpbWVzJTNEJTIyMCUzQjAuMiUzQjAuNyUzQjElMjIlMjBrZXlTcGxpbmVzJTNEJTIyMC4yJTIwMC4yJTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTIyJTIwY2FsY01vZGUlM0QlMjJzcGxpbmUlMjIlMjAvJTNFJTBBJTIwJTIwJTNDL2NpcmNsZSUzRSUwQSUzQy9zdmclM0VcIjtcblx0XHQvLyBzZXQgYXMgbG9hZGluZyBpY29uIG9uIG1vYmlsZVxuXHRcdHByb21pc2UudGhlbihmdW5jdGlvbihmaWxlKXtcblx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLnBob3RvID0gZmlsZTtcblx0XHR9LCBudWxsXG5cdFx0LCBmdW5jdGlvbih1cGRhdGUpIHtcblx0XHRcdGlmICh1cGRhdGUgPT09ICdnZXR0aW5nJykge1xuXHRcdFx0XHRsaXN0Lml0ZW1zW2luZGV4XS5waG90byA9IGxvYWRpbmdJY29uO1xuXHRcdFx0fSBlbHNlIGlmICh1cGRhdGUgPT09ICdub0ltYWdlJykge1xuXHRcdFx0XHRpZiAobGlzdC5pdGVtc1tpbmRleF0ucGhvdG8gPT09IGxvYWRpbmdJY29uKSB7XG5cdFx0XHRcdFx0bGlzdC5pdGVtc1tpbmRleF0ucGhvdG8gPSAnJztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdMaXN0c0NvbnRyb2xsZXInLCBMaXN0c0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBMaXN0c0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cblx0dmFyIHZtID0gdGhpcztcblx0XG5cdHZtLmxpc3RzID0gYWxsTGlzdHNTZXJ2aWNlLmxpc3RzO1xuXG5cdHZtLmFkZExpc3QgPSBmdW5jdGlvbigpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0fTtcblxuXHR2bS5jdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtJdGVtJywgYmtJdGVtKTtcblxuZnVuY3Rpb24gYmtJdGVtKCRxKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrSXRlbS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0Ly8gRW5kIGN1c3RvbSBlZGl0IG1vZGUgb24gY2xpY2tcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRkZXNlbGVjdCgpO1xuXHRcdH0pO1xuXG5cdFx0dmFyIGxpc3RWaWV3ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2JrLWxpc3Qtdmlld10nKTtcblx0XHR2YXIgYXNzaWduSW5wdXQ7XG5cblx0XHQvLyBFbnRlciBhc3NpZ24gbW9kZVxuXHRcdGZ1bmN0aW9uIGVudGVyQXNzaWduTW9kZSgpIHtcblx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGFzc2lnbklucHV0LnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBhc3NpZ25JbnB1dC5mb2N1cygpOyB9LCAxMDApOyAvLyBkZWxheSB0byB3YWl0IGZvciBjbGFzc2VzIHRvIGFwcGx5XG5cdFx0XHRsaXN0Vmlldy5jbGFzc0xpc3QuYWRkKFwiaGFzRWRpdGFibGVJdGVtXCIpO1xuXHRcdH1cblxuXHRcdC8vIFBob3RvIHNlbGVjdFxuXHRcdHZhciBwaG90b0lucHV0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdpbnB1dC5waG90bycpO1xuXHRcdHZhciBmaWxlRGVmZXI7XG5cdFx0dmFyIHdhaXRpbmdJbnB1dCA9IDA7XG5cdFx0ZnVuY3Rpb24gcGhvdG9Qcm9tcHQoKSB7XG5cdFx0XHRmaWxlRGVmZXIgPSAkcS5kZWZlcigpO1xuXHRcdFx0c2NvcGUuSXRlbXMuZ2V0UGhvdG8oYXR0cnMuaXRlbUlkLCBmaWxlRGVmZXIucHJvbWlzZSk7XG5cdFx0XHRwaG90b0lucHV0LmNsaWNrKCk7XG5cdFx0XHRwaG90b0lucHV0LnZhbHVlID0gbnVsbDtcblx0XHR9XG5cdFx0ZnVuY3Rpb24gcGhvdG9Qcm9tcHRDbG9zZSgpIHtcblx0XHRcdGlmIChmaWxlRGVmZXIpIHtcblx0XHRcdFx0aWYgKHdhaXRpbmdJbnB1dCA+IDApIHtcblx0XHRcdFx0XHR3YWl0aW5nSW5wdXQgPSAwO1xuXHRcdFx0XHRcdGZpbGVEZWZlci5ub3RpZnkoJ25vSW1hZ2UnKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR3YWl0aW5nSW5wdXQrKztcblx0XHRcdFx0XHRmaWxlRGVmZXIubm90aWZ5KCdnZXR0aW5nJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cGhvdG9JbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHR2YXIgZmlsZSA9IGUudGFyZ2V0LmZpbGVzWzBdO1xuXHRcdFx0d2FpdGluZ0lucHV0ID0gMDtcblx0XHRcdGlmIChmaWxlKSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXHRcdFx0XHRyZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0ZmlsZURlZmVyLnJlc29sdmUocmVhZGVyLnJlc3VsdCk7XG5cdFx0XHRcdFx0ZmlsZURlZmVyID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignaW1nLnBob3RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZWxlbWVudC50b2dnbGVDbGFzcygncGhvdG9WaWV3Jyk7XG5cdFx0fSk7XG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWVkaWEnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKCdwaG90b1ZpZXcnKTtcblx0XHR9KTtcblxuXHRcdC8vIFRvZ2dsZSBpdGVtIGRvbmVuZXNzXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24uZG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50LnRvZ2dsZUNsYXNzKFwiZG9uZVwiKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlXCIpO1xuXHRcdFx0bGlzdFZpZXcuY2xhc3NMaXN0LnJlbW92ZShcImhhc0VkaXRhYmxlSXRlbVwiKTtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cdFx0XG5cdFx0Ly8gUmVhdHRhY2ggbGlzdGVuZXIgdG8gYnV0dG9ucyBvbiBzY3JlZW4gc2l6ZSBjaGFuZ2Vcblx0XHR2YXIgYXNzaWduQnV0dG9uID0gZ2V0QXNzaWduQnV0dG9uKCk7XG5cdFx0dmFyIHBob3RvQnV0dG9uID0gZ2V0UGhvdG9CdXR0b24oKTtcblx0XHRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBzY29wZS5NYWluLiRtZE1lZGlhKCdtZCcpOyB9LCBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChhc3NpZ25CdXR0b24pIHtcblx0XHRcdFx0YXNzaWduQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJBc3NpZ25Nb2RlKTtcblx0XHRcdH1cblx0XHRcdGFzc2lnbkJ1dHRvbiA9IGdldEFzc2lnbkJ1dHRvbigpO1xuXHRcdFx0aWYgKGFzc2lnbkJ1dHRvbikge1xuXHRcdFx0XHRhc3NpZ25CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlbnRlckFzc2lnbk1vZGUpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHBob3RvQnV0dG9uKSB7XG5cdFx0XHRcdHBob3RvQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcGhvdG9Qcm9tcHQpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCBwaG90b1Byb21wdENsb3NlKTtcblx0XHRcdH1cblx0XHRcdHBob3RvQnV0dG9uID0gZ2V0UGhvdG9CdXR0b24oKTtcblx0XHRcdGlmIChwaG90b0J1dHRvbikge1xuXHRcdFx0XHRwaG90b0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHBob3RvUHJvbXB0KTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgcGhvdG9Qcm9tcHRDbG9zZSk7XG5cdFx0XHR9XG5cdFx0XHQvLyBQcmV2ZW50IGVuZGluZyBlZGl0IG1vZGUgd2hlbiBjbGlja2luZyBidXR0b25cblx0XHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSk7XG5cdFx0XHQvLyBpT1MgZml4IHRvIGRlc2VsZWN0IGJ1dHRvblxuXHRcdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbigndG91Y2hzdGFydCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBEZWxheSBxdWVyeWluZyBmb3IgaW5wdXQgdW50aWwgZWxlbWVudCBjcmVhdGVkXG5cdFx0XHRhc3NpZ25JbnB1dCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignbWQtYXV0b2NvbXBsZXRlLmFzc2lnbiBpbnB1dCcpO1xuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gc2VsZWN0aW5nIGlucHV0XG5cdFx0XHRlbGVtZW50LmZpbmQoJ21kLWlucHV0LWNvbnRhaW5lcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdH0sIDEwMCk7XG5cblx0XHQvLyBMZWF2ZSBjdXN0b20gZWRpdCBtb2RlXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3QoKSB7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKFwiZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ2V0QXNzaWduQnV0dG9uKCkge1xuXHRcdFx0cmV0dXJuIGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmFzc2lnbicpO1xuXHRcdH1cblx0XHRmdW5jdGlvbiBnZXRQaG90b0J1dHRvbigpIHtcblx0XHRcdHJldHVybiBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5waG90bycpO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RJbmZvJywgYmtMaXN0SW5mbyk7XG5cbmZ1bmN0aW9uIGJrTGlzdEluZm8oYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrTGlzdEluZm8uaHRtbCdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHsgYWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KHNjb3BlLmxpc3QpIH0pO1xuXHRcdH0pO1xuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RWaWV3JywgYmtMaXN0Vmlldyk7XG5cbmZ1bmN0aW9uIGJrTGlzdFZpZXcoKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cblx0XHR2YXIgc3ViaGVhZGVyID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJyk7XG5cdFx0dmFyIHRpdGxlSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgaW5wdXQnKTtcblxuXHRcdC8vIENsaWNrIG91dHNpZGUgb2YgaXRlbXMgdG8gZXhpdCBlZGl0IG1vZGVcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRpZiAoZS50YXJnZXQpIHtcblx0XHRcdFx0dmFyIGJrSXRlbSA9IGlzQmtJdGVtQ2hpbGQoZS50YXJnZXQpO1xuXHRcdFx0XHRpZiAoYmtJdGVtKSB7XG5cdFx0XHRcdFx0bWFrZUl0ZW1FZGl0YWJsZShia0l0ZW0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBQcmV2ZW50IGxvc2luZyBmb2N1cyBvbiBidXR0b24gY2xpY2tzXG5cdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gTWFrZSB0aXRsZSBlZGl0YWJsZSBvbiBjbGlja1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlciAubmFtZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRtYWtlVGl0bGVFZGl0YWJsZSgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gRXhpdCB0aXRsZSBlZGl0IG1vZGUgb24gdGl0bGUgaW5wdXQgbG9zaW5nIGZvY3VzXG5cdFx0dGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXInKS5jbGFzc0xpc3QucmVtb3ZlKCdlZGl0YWJsZScpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gU3dpdGNoIGZvY3VzIHRvIG5ldyBpdGVtXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24ubmV3SXRlbScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIG5ld0l0ZW0gPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2JrLWl0ZW0nKTtcblx0XHRcdGlmIChuZXdJdGVtKSB7XG5cdFx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUobmV3SXRlbSk7XG5cdFx0XHRcdHZhciB0aXRsZSA9IG5ld0l0ZW0ucXVlcnlTZWxlY3RvcignLnRpdGxlIGlucHV0Jyk7XG5cdFx0XHRcdC8vIGZvY3VzIHRpdGxlIGZpZWxkIGJ5IGRlZmF1bHQ7IGRlbGF5IHRvIHdhaXQgZm9yIHN0eWxlIHRvIHRha2UgZWZmZWN0XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRpdGxlLmZvY3VzKCk7IH0sIDEwMCk7XG5cdFx0XHRcdHRpdGxlLnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRcdHdpbmRvdy5zY3JvbGwoMSwxKTsgLy8gaU9TIGZpeFxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gbWFrZVRpdGxlRWRpdGFibGUoKSB7XG5cdFx0XHRzdWJoZWFkZXIuY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdHRpdGxlSW5wdXQuZm9jdXMoKTtcblx0XHR9XG5cdFx0c2NvcGUubWFrZVRpdGxlRWRpdGFibGUgPSBtYWtlVGl0bGVFZGl0YWJsZTtcblxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuXHRcdFx0ZWxlbWVudC5maW5kKCdiay1pdGVtJykucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG1ha2VJdGVtRWRpdGFibGUoaXRlbSkge1xuXHRcdFx0aXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcygnaGFzRWRpdGFibGVJdGVtJyk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaXNCa0l0ZW1DaGlsZChub2RlKSB7XG5cdFx0XHR2YXIgaXNDYXJkQ29udGVudCA9IGZhbHNlO1xuXHRcdFx0d2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gZWxlbWVudFswXSkge1xuXHRcdFx0XHRpZiAobm9kZS5ub2RlTmFtZSA9PT0gJ01ELUNBUkQtQ09OVEVOVCcpIHtcblx0XHRcdFx0XHRpc0NhcmRDb250ZW50ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoaXNDYXJkQ29udGVudCAmJiBub2RlLm5vZGVOYW1lID09PSAnQkstSVRFTScpIHtcblx0XHRcdFx0XHRyZXR1cm4gbm9kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnSXRlbU9iamVjdCcsIEl0ZW1PYmplY3QpO1xuXG5mdW5jdGlvbiBJdGVtT2JqZWN0KCkge1xuXG5cdHZhciBpdGVtT2JqZWN0ID0gZnVuY3Rpb24oaWQpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy50aXRsZSA9ICcnO1xuXHRcdHRoaXMubm90ZSA9ICcnO1xuXHRcdHRoaXMuYXNzaWduID0gJyc7XG5cdFx0dGhpcy5kb25lID0gZmFsc2U7XG5cdFx0dGhpcy5sYXN0RWRpdGVkID0gRGF0ZS5ub3coKTtcblx0fVxuXG5cdHJldHVybiBpdGVtT2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnTGlzdE9iamVjdCcsIExpc3RPYmplY3QpO1xuXG5mdW5jdGlvbiBMaXN0T2JqZWN0KEl0ZW1PYmplY3QsIGlkR2VuZXJhdG9yKSB7XG5cblx0dmFyIGxpc3RPYmplY3QgPSBmdW5jdGlvbihpZCwgbmFtZSkge1xuXHRcdHRoaXMuaWQgPSBpZDtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuaXRlbXMgPSBbXTtcblx0XHR0aGlzLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHRcdHRoaXMuZ2V0SXRlbUluZGV4QnlJZCA9IGdldEl0ZW1JbmRleEJ5SWQ7XG5cdFx0dGhpcy5nZXREZXNjcmlwdGlvbiA9IGdldERlc2NyaXB0aW9uO1xuXHR9XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHR0aGlzLml0ZW1zLnVuc2hpZnQobmV3IEl0ZW1PYmplY3QoaWRHZW5lcmF0b3IuZ2V0KDQpKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRJdGVtSW5kZXhCeUlkKGlkKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuaXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICh0aGlzLml0ZW1zW2ldLmlkID09PSBpZCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGVzY3JpcHRpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKCFpdGVtLmRvbmUpIHJldHVybiBpdGVtLnRpdGxlIH0pXG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9KS8vIGdldCBub24tZW1wdHkgaXRlbXNcblx0XHRcdFx0XHRcdC5qb2luKCcsICcpO1xuXHR9XG5cblx0cmV0dXJuIGxpc3RPYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdhbGxMaXN0c1NlcnZpY2UnLCBhbGxMaXN0c1NlcnZpY2UpO1xuXG5mdW5jdGlvbiBhbGxMaXN0c1NlcnZpY2UoTGlzdE9iamVjdCwgJHEsIGlkR2VuZXJhdG9yLCAkcm9vdFNjb3BlKSB7XG5cblx0dmFyIGxpc3RzID0gW107XG5cdHZhciBjdXJyZW50TGlzdElkID0gdW5kZWZpbmVkO1xuXHR2YXIgZGVsZXRlVGltZXI7XG5cdHZhciBkZWxldGVEZWZlcjtcblx0dmFyIGRlbGV0aW5nTGlzdElkO1xuXHR2YXIgZGVsZXRpbmdJdGVtSWQ7XG5cdHZhciBmaXJlUmVmID0gbmV3IEZpcmViYXNlKFwiaHR0cHM6Ly90b3JyaWQtZmlyZS02MjY2LmZpcmViYXNlaW8uY29tL1wiKTtcblx0bG9jYWxSZXRyaWV2ZSgpO1xuXG5cdHJldHVybiB7XG5cdFx0YWRkOiBhZGQsXG5cdFx0bGlzdHM6IGxpc3RzLFxuXHRcdHNldEN1cnJlbnRMaXN0OiBzZXRDdXJyZW50TGlzdCxcblx0XHRnZXRDdXJyZW50TGlzdDogZ2V0Q3VycmVudExpc3QsXG5cdFx0ZGVsZXRlTGlzdDogZGVsZXRlTGlzdCxcblx0XHRkZWxldGVJdGVtOiBkZWxldGVJdGVtLFxuXHRcdGNhbmNlbERlbGV0ZTogY2FuY2VsRGVsZXRlLFxuXHRcdHN5bmNBbGw6IHN5bmNBbGwsXG5cdFx0aW1wb3J0TGlzdDogaW1wb3J0TGlzdCxcblx0fTtcblxuXHRmdW5jdGlvbiBhZGQoKSB7XG5cdFx0bGlzdHMudW5zaGlmdChcblx0XHRcdG5ldyBMaXN0T2JqZWN0KGlkR2VuZXJhdG9yLmdldCg4KSwgXCJOZXcgTGlzdCBcIisobGlzdHMubGVuZ3RoKzEpKVxuXHRcdCk7XG5cdFx0cmV0dXJuIGxpc3RzWzBdO1xuXHR9XG5cblx0ZnVuY3Rpb24gZmluZExpc3RJbmRleEJ5SWQoaWQpIHtcblx0XHRmb3IgKHZhciBpPTA7IGk8bGlzdHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChsaXN0c1tpXS5pZCA9PT0gaWQpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAtMTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZUl0ZW1EYXRhKGl0ZW0sIHZhbHVlcykge1xuXHRcdGl0ZW0uaWQgPSB2YWx1ZXMuaWQ7XG5cdFx0aXRlbS50aXRsZSA9IHZhbHVlcy50aXRsZTtcblx0XHRpdGVtLm5vdGUgPSB2YWx1ZXMubm90ZTtcblx0XHRpdGVtLmFzc2lnbiA9IHZhbHVlcy5hc3NpZ247XG5cdFx0aXRlbS5hdWRpbyA9IHZhbHVlcy5hdWRpbztcblx0XHRpdGVtLnBob3RvID0gdmFsdWVzLnBob3RvO1xuXHRcdGl0ZW0uZG9uZSA9IHZhbHVlcy5kb25lO1xuXHRcdGl0ZW0ubGFzdEVkaXRlZCA9IHZhbHVlcy5sYXN0RWRpdGVkO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGF0YU9ubHlJdGVtKG9yaWdpbmFsKSB7XG5cdFx0dmFyIGl0ZW0gPSB7fTtcblx0XHR1cGRhdGVJdGVtRGF0YShpdGVtLCBvcmlnaW5hbCk7XG5cdFx0Zm9yICh2YXIga2V5IGluIGl0ZW0pIHtcblx0XHRcdGlmIChpdGVtW2tleV0gPT09IG51bGwgfHwgaXRlbVtrZXldID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0ZGVsZXRlIGl0ZW1ba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGl0ZW07XG5cdH1cblxuXHRmdW5jdGlvbiBnZXREYXRhT25seUxpc3QoaWQpIHtcblx0XHR2YXIgbGlzdCA9IGxpc3RzW2ZpbmRMaXN0SW5kZXhCeUlkKGlkKV07XG5cdFx0dmFyIHRleHRPbmx5TGlzdCA9IFtdO1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0Lml0ZW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0ZXh0T25seUxpc3QucHVzaChnZXREYXRhT25seUl0ZW0obGlzdC5pdGVtc1tpXSkpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGV4dE9ubHlMaXN0O1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlTGlzdChpZCkge1xuXHRcdC8vIFNldCBsaXN0IHN0YXR1cyBmb3IgZGVsZXRpb25cblx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChpZCk7XG5cdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdGxpc3RzW2luZGV4XS5kZWxldGluZyA9IHRydWU7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gJyc7XG5cdFx0fVxuXHRcdC8vIGRlbGV0ZSBkZWxheVxuXHRcdGRlbGV0aW5nTGlzdElkID0gaWQ7XG5cdFx0ZGVsZXRlRGVmZXIgPSAkcS5kZWZlcigpO1xuXHRcdGRlbGV0ZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdC8vIGdldCBpbmRleCBhZ2FpbiwgYXMgaXQgbWF5IGhhdmUgY2hhbmdlZFxuXHRcdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoaWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVzb2x2ZSgnZGVsZXRlZCcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdsaXN0Tm90Rm91bmQnKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nTGlzdElkID0gdW5kZWZpbmVkO1xuXHRcdH0sIDUwMDApO1xuXHRcdHJldHVybiBkZWxldGVEZWZlci5wcm9taXNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlSXRlbShpZCkge1xuXHRcdC8vIFNldCBsaXN0IHN0YXR1cyBmb3IgZGVsZXRpb25cblx0XHR2YXIgaW5kZXggPSBnZXRDdXJyZW50TGlzdCgpLmdldEl0ZW1JbmRleEJ5SWQoaWQpO1xuXHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRnZXRDdXJyZW50TGlzdCgpLml0ZW1zW2luZGV4XS5kZWxldGluZyA9IHRydWU7XG5cdFx0fVxuXHRcdC8vIGRlbGV0ZSBkZWxheVxuXHRcdGRlbGV0aW5nSXRlbUlkID0gaWQ7XG5cdFx0ZGVsZXRpbmdMaXN0SWQgPSBnZXRDdXJyZW50TGlzdCgpLmlkOyAvLyBzdG9yZSBsaXN0IGlkIGluIGNhc2UgY3VycmVudCBsaXN0IGlzIGNoYW5nZWRcblx0XHRkZWxldGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0ZGVsZXRlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gZ2V0IGluZGV4IGFnYWluLCBhcyBpdCBtYXkgaGF2ZSBjaGFuZ2VkXG5cdFx0XHR2YXIgbGlzdEluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoZGVsZXRpbmdMaXN0SWQpO1xuXHRcdFx0aWYgKGxpc3RJbmRleCA+PSAwKSB7XG5cdFx0XHRcdHZhciBpbmRleCA9IGxpc3RzW2xpc3RJbmRleF0uZ2V0SXRlbUluZGV4QnlJZChpZCk7XG5cdFx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdFx0bGlzdHNbbGlzdEluZGV4XS5pdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRcdGRlbGV0ZURlZmVyLnJlc29sdmUoJ2RlbGV0ZWQnKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkZWxldGVEZWZlci5yZWplY3QoJ2xpc3ROb3RGb3VuZCcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRkZWxldGluZ0l0ZW1JZCA9IHVuZGVmaW5lZDtcblx0XHR9LCA1MDAwKTtcblx0XHRyZXR1cm4gZGVsZXRlRGVmZXIucHJvbWlzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNhbmNlbERlbGV0ZSgpIHtcblx0XHRjbGVhclRpbWVvdXQoZGVsZXRlVGltZXIpO1xuXHRcdGlmIChkZWxldGluZ0l0ZW1JZCkge1xuXHRcdFx0dmFyIGxpc3QgPSBsaXN0c1tmaW5kTGlzdEluZGV4QnlJZChkZWxldGluZ0xpc3RJZCldO1xuXHRcdFx0dmFyIGluZGV4ID0gbGlzdC5nZXRJdGVtSW5kZXhCeUlkKGRlbGV0aW5nSWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdC5pdGVtc1tpbmRleF0uZGVsZXRpbmcgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nSXRlbUlkID0gdW5kZWZpbmVkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChkZWxldGluZ0lkKTtcblx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdGxpc3RzW2luZGV4XS5kZWxldGluZyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdMaXN0SWQgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGRlbGV0ZURlZmVyLnJlamVjdCgnZGVsZXRlQ2FuY2VsbGVkJyk7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDdXJyZW50TGlzdChsaXN0KSB7XG5cdFx0aWYgKHR5cGVvZiBsaXN0ID09PSAnbnVtYmVyJykge1xuXHRcdFx0Y3VycmVudExpc3RJZCA9IGZpbmRMaXN0SW5kZXhCeUlkKGxpc3QpO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gbGlzdC5pZDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc29sZS53YXJuKCd1bmtub3duIGlucHV0IGZvciBsaXN0OiAnKyB0eXBlb2YgbGlzdCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Q3VycmVudExpc3QoKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBsaXN0c1tmaW5kTGlzdEluZGV4QnlJZChjdXJyZW50TGlzdElkKV07XG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ0xpc3Qgbm90IGZvdW5kLiBJRDogJytjdXJyZW50TGlzdElkKTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0cyk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaW1wb3J0TGlzdChpZCkge1xuXHRcdHZhciBsaXN0UmVmID0gZmlyZVJlZi5jaGlsZChpZCk7XG5cdFx0dmFyIGxpc3Q7XG5cdFx0dmFyIGxvY2FsSW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChpZCk7XG5cdFx0aWYgKGxvY2FsSW5kZXggPCAwKSB7XG5cdFx0XHRsaXN0cy51bnNoaWZ0KG5ldyBMaXN0T2JqZWN0KGlkLCAnU3luY2hyb25pc2luZy4uLicpKVxuXHRcdFx0bGlzdCA9IGxpc3RzWzBdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsaXN0ID0gbGlzdHNbbG9jYWxJbmRleF07XG5cdFx0fVxuXHRcdGxpc3RSZWYub25jZSgndmFsdWUnLCBmdW5jdGlvbihzbmFwc2hvdCkge1xuXHRcdFx0bGlzdC5uYW1lID0gc25hcHNob3QudmFsKCkubmFtZTtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChzbmFwc2hvdC52YWwoKS5pdGVtcywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHR1cGRhdGVJdGVtKHZhbHVlKTtcblx0XHRcdH0pO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdmaXJlYmFzZVN5bmMnKTtcblx0XHR9KTtcblx0XHRsaXN0UmVmLmNoaWxkKCduYW1lJykub24oJ3ZhbHVlJywgZnVuY3Rpb24oc25hcHNob3QpIHtcblx0XHRcdGxpc3QubmFtZSA9IHNuYXBzaG90LnZhbCgpO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdmaXJlYmFzZVN5bmMnKTtcblx0XHR9KTtcblx0XHRsaXN0UmVmLmNoaWxkKCdpdGVtcycpLm9uKCdjaGlsZF9jaGFuZ2VkJywgZnVuY3Rpb24oc25hcHNob3QpIHtcblx0XHRcdHVwZGF0ZUl0ZW0oc25hcHNob3QudmFsKCkpXG5cdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2ZpcmViYXNlU3luYycpO1xuXHRcdH0pO1xuXHRcdGZ1bmN0aW9uIHVwZGF0ZUl0ZW0oaXRlbSkge1xuXHRcdFx0dmFyIGxvY2FsSXRlbUluZGV4ID0gbGlzdC5nZXRJdGVtSW5kZXhCeUlkKGl0ZW0uaWQpO1xuXHRcdFx0aWYgKGxvY2FsSXRlbUluZGV4IDwgMCkge1xuXHRcdFx0XHRsaXN0Lml0ZW1zLnB1c2goZ2V0RGF0YU9ubHlJdGVtKGl0ZW0pKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmIChsaXN0Lml0ZW1zW2xvY2FsSXRlbUluZGV4XSAhPSBpdGVtKSB7XG5cdFx0XHRcdFx0dXBkYXRlSXRlbURhdGEobGlzdC5pdGVtc1tsb2NhbEl0ZW1JbmRleF0sIGl0ZW0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbG9jYWxSZXRyaWV2ZSgpIHtcblx0XHR2YXIgcmV0cmlldmVkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0Jhc2tldHMnKTtcblx0XHRpZiAocmV0cmlldmVkKSB7XG5cdFx0XHR2YXIgcGFyc2VkID0gSlNPTi5wYXJzZShyZXRyaWV2ZWQpO1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHBhcnNlZC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIgbGlzdCA9IG5ldyBMaXN0T2JqZWN0KHBhcnNlZFtpXS5pZCwgcGFyc2VkW2ldLm5hbWUpO1xuXHRcdFx0XHRsaXN0Lml0ZW1zID0gcGFyc2VkW2ldLml0ZW1zO1xuXHRcdFx0XHRsaXN0cy5wdXNoKGxpc3QpO1xuXHRcdFx0XHRpbXBvcnRMaXN0KGxpc3QuaWQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGxvY2FsU2F2ZSgpIHtcblx0XHR2YXIganNvbiA9IEpTT04uc3RyaW5naWZ5KGxpc3RzKTtcblx0XHRpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0Jhc2tldHMnKSAhPT0ganNvbikge1xuXHRcdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oJ0Jhc2tldHMnLCBqc29uKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRmdW5jdGlvbiBzeW5jQWxsKCkge1xuXHRcdGlmIChsb2NhbFNhdmUoKSkge1xuXHRcdFx0c3luY0N1cnJlbnRMaXN0KCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gc3luY0N1cnJlbnRMaXN0KCkge1xuXHRcdGlmIChnZXRDdXJyZW50TGlzdCgpKSB7XG5cdFx0XHR2YXIgaXRlbXMgPSBnZXREYXRhT25seUxpc3QoZ2V0Q3VycmVudExpc3QoKS5pZCk7XG5cdFx0XHRmaXJlUmVmLmNoaWxkKGdldEN1cnJlbnRMaXN0KCkuaWQpLmNoaWxkKCduYW1lJykuc2V0KGdldEN1cnJlbnRMaXN0KCkubmFtZSk7XG5cdFx0XHRmb3IgKHZhciBpPTA7IGk8aXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0ZmlyZVJlZi5jaGlsZChnZXRDdXJyZW50TGlzdCgpLmlkKS5jaGlsZCgnaXRlbXMnKS5jaGlsZChpdGVtc1tpXS5pZCkudXBkYXRlKGl0ZW1zW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdpZEdlbmVyYXRvcicsIGlkR2VuZXJhdG9yKTtcblxuZnVuY3Rpb24gaWRHZW5lcmF0b3IoKSB7XG5cblx0cmV0dXJuIHtcblx0XHRnZXQ6IGdldFVuaXFJZCxcblx0fTtcblxuXHRmdW5jdGlvbiBnZXRVbmlxSWQobGVuZ3RoKSB7XG5cdFx0cmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqTWF0aC5wb3coMzYsbGVuZ3RoKSkudG9TdHJpbmcoMzYpKS5zbGljZSgtbGVuZ3RoKTtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ3NoYXJlU2VydmljZScsIHNoYXJlU2VydmljZSk7XG5cbmZ1bmN0aW9uIHNoYXJlU2VydmljZSgpIHtcblxuXHRyZXR1cm4ge1xuXHRcdGdldExpbms6IGdldExpbmssXG5cdFx0d3JpdGVFbWFpbDogd3JpdGVFbWFpbCxcblx0fTtcblxuXHRmdW5jdGlvbiBnZXRMaW5rKGxpc3QpIHtcblx0XHRyZXR1cm4gbG9jYXRpb24ub3JpZ2luK2xvY2F0aW9uLnBhdGhuYW1lK1wiI2xpc3Q9XCIrbGlzdC5pZDtcblx0fVxuXG5cdGZ1bmN0aW9uIHdyaXRlRW1haWwobGlzdCkge1xuXHRcdHZhciByZXN1bHRzID0gW107XG5cdFx0cmVzdWx0cy5wdXNoKFwiQWRkIHRoaXMgbGlzdCB0byB5b3VyIEJhc2tldCBhdCBcIitnZXRMaW5rKGxpc3QpKTtcblx0XHRyZXN1bHRzLnB1c2goXCI9PT09PT09PT09PT09PT09PT09PVwiKTtcblx0XHRyZXN1bHRzLnB1c2gobGlzdC5uYW1lKTtcblx0XHRyZXN1bHRzLnB1c2goXCI9PT09PT09PT09PT09PT09PT09PVwiKTtcblx0XHRyZXN1bHRzLnB1c2goXCJcIik7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPGxpc3QuaXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBpdGVtID0gbGlzdC5pdGVtc1tpXTtcblx0XHRcdHJlc3VsdHMucHVzaChpdGVtLnRpdGxlKTtcblx0XHRcdHJlc3VsdHMucHVzaChcIlwiKTtcblx0XHRcdGlmIChpdGVtLm5vdGUpIHJlc3VsdHMucHVzaCgnTm90ZXM6ICcraXRlbS5ub3RlKTtcblx0XHRcdGlmIChpdGVtLmFzc2lnbikgcmVzdWx0cy5wdXNoKCdBc3NpZ25lZCB0byAnK2l0ZW0uYXNzaWduKTtcblx0XHRcdHJlc3VsdHMucHVzaChcIi0tLS0tLS0tLS0tLS0tLS0tLS0tXCIpO1xuXHRcdFx0cmVzdWx0cy5wdXNoKFwiXCIpO1xuXHRcdH1cblx0XHR2YXIgYm9keSA9IHJlc3VsdHMuam9pbignJTBBJyk7IC8vIG5ldyBsaW5lXG5cdFx0cmV0dXJuICdtYWlsdG86P2JvZHk9Jytib2R5O1xuXHR9XG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9