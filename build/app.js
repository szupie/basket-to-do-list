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
		var loadingIcon = "./img/loading-bubbles.svg";
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
		function onPhotoPromptOpen() {
			if (element[0].contains(document.activeElement) && fileDefer) {
				fileDefer.notify('getting');
			}
		}
		function onPhotoPromptClose() {
			if (fileDefer) {
				fileDefer.notify('noImage');
			}
		}
		function onPhotoPromptChange() {
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
		window.addEventListener('blur', onPhotoPromptOpen);
		window.addEventListener('focus', onPhotoPromptClose);
		document.addEventListener("visibilitychange", onPhotoPromptChange);
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
			}
			photoButton = getPhotoButton();
			if (photoButton) {
				photoButton.addEventListener('click', photoPrompt);
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

function allListsService(ListObject, $q, idGenerator, $rootScope, $timeout) {

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
allListsService.$inject = ["ListObject", "$q", "idGenerator", "$rootScope", "$timeout"];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9MaXN0c0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2JrSXRlbS5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0SW5mby5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0Vmlldy5qcyIsInNlcnZpY2VzL0l0ZW1PYmplY3QuanMiLCJzZXJ2aWNlcy9MaXN0T2JqZWN0LmpzIiwic2VydmljZXMvYWxsTGlzdHNTZXJ2aWNlLmpzIiwic2VydmljZXMvaWRHZW5lcmF0b3IuanMiLCJzZXJ2aWNlcy9zaGFyZVNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxPQUFPLFlBQVk7Q0FDdEIsY0FBYzs7O0FBR2YsSUFBSSxNQUFNLFFBQVEsT0FBTyxPQUFPLENBQUM7S0FDNUIsU0FBUyxXQUFXLENBQUMsWUFBWTtBQUN0QztBQ05BO0VBQ0UsT0FBTztFQUNQLFdBQVcsb0JBQW9COztBQUVqQyxTQUFTLGlCQUFpQixZQUFZLFVBQVUsaUJBQWlCLFVBQVUsU0FBUyxRQUFRLFdBQVcsY0FBYztDQUNwSCxJQUFJLEtBQUs7Q0FDVCxHQUFHLGtCQUFrQjtDQUNyQixHQUFHLGlCQUFpQjtDQUNwQixHQUFHLGlCQUFpQjtDQUNwQixHQUFHLFlBQVk7Q0FDZixHQUFHLFVBQVU7OztDQUdiLGdCQUFnQjtDQUNoQixZQUFZLGdCQUFnQixTQUFTOztDQUVyQyxPQUFPLElBQUksZ0JBQWdCLFdBQVc7RUFDckMsT0FBTzs7O0NBR1IsSUFBSSxTQUFTLEtBQUssVUFBVSxHQUFHLFFBQVEsYUFBYSxHQUFHO0VBQ3RELGdCQUFnQixXQUFXLFNBQVMsS0FBSyxVQUFVOztDQUVwRCxPQUFPLG1CQUFtQixnQkFBZ0I7O0NBRTFDLFNBQVMsVUFBVSxNQUFNLEdBQUc7RUFDM0IsSUFBSSxPQUFPLGFBQWEsUUFBUTtFQUNo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QUFRLEtBQUssS0FBSztFQUNsQixRQUFRLEtBQUs7RUFDYixRQUFRLEtBQUs7RUFDYixLQUFLLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxNQUFNLFFBQVEsS0FBSztHQUN2QyxJQUFJLE9BQU8sS0FBSyxNQUFNO0dBQ3RCLFFBQVEsS0FBSyxLQUFLO0dBQ2xCLFFBQVEsS0FBSztHQUNiLElBQUksS0FBSyxNQUFNLFFBQVEsS0FBSyxVQUFVLEtBQUs7R0FDM0MsSUFBSSxLQUFLLFFBQVEsUUFBUSxLQUFLLGVBQWUsS0FBSztHQUNsRCxRQUFRLEtBQUs7R0FDYixRQUFRLEtBQUs7O0VBRWQsSUFBSSxPQUFPLFFBQVEsS0FBSztFQUN4QixPQUFPLGdCQUFnQixtQkFBbUI7O0NBRTNDIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImlmICh3aW5kb3cuRmlsZVJlYWRlcikge1xuXHRmaWxlU3VwcG9ydCA9IHRydWU7XG59XG5cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyduZ01hdGVyaWFsJ10pXG5cdFx0XHRcdC5jb25zdGFudCgnc3VwcG9ydCcsIHtmaWxlUmVhZGVyOiBmaWxlU3VwcG9ydH0pO1xuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignQmFza2V0Q29udHJvbGxlcicsIEJhc2tldENvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBCYXNrZXRDb250cm9sbGVyKCRtZFNpZGVuYXYsICRtZE1lZGlhLCBhbGxMaXN0c1NlcnZpY2UsICRtZFRvYXN0LCBzdXBwb3J0LCAkc2NvcGUsICRtZERpYWxvZywgc2hhcmVTZXJ2aWNlKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cdHZtLnRvZ2dsZUxpc3RzVmlldyA9IHRvZ2dsZUxpc3RzVmlldztcblx0dm0uY2xvc2VMaXN0c1ZpZXcgPSBjbG9zZUxpc3RzVmlldztcblx0dm0uZGVsZXRlTGlzdEJ5SWQgPSBkZWxldGVMaXN0QnlJZDtcblx0dm0uc2hhcmVMaXN0ID0gc2hhcmVMaXN0O1xuXHR2bS5zdXBwb3J0ID0gc3VwcG9ydDtcblxuXHQvLyBsb2FkL3NhdmUgZGF0YVxuXHRhbGxMaXN0c1NlcnZpY2Uuc3luY0FsbCgpO1xuXHRzZXRJbnRlcnZhbChhbGxMaXN0c1NlcnZpY2Uuc3luY0FsbCwgNTAwMCk7XG5cblx0JHNjb3BlLiRvbignZmlyZWJhc2VTeW5jJywgZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLiRhcHBseSgpO1xuXHR9KTtcblxuXHRpZiAobG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoMSkuaW5kZXhPZignbGlzdD0nKSA9PT0gMCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5pbXBvcnRMaXN0KGxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDYpKTtcblx0fVxuXHR3aW5kb3cuaW1wb3J0QmFza2V0TGlzdCA9IGFsbExpc3RzU2VydmljZS5pbXBvcnRMaXN0O1xuXG5cdGZ1bmN0aW9uIHNoYXJlTGlzdChsaXN0LCBlKSB7XG5cdFx0dmFyIGxpbmsgPSBzaGFyZVNlcnZpY2UuZ2V0TGluayhsaXN0KTtcblx0XHR2YXIgZW1haWwgPSBzaGFyZVNlcnZpY2Uud3JpdGVFbWFpbChsaXN0KTtcblx0XHQkbWREaWFsb2cuc2hvdyh7XG5cdFx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL3NoYXJlRGlhbG9nLmh0bWwnLFxuXHRcdFx0bG9jYWxzOiB7XG5cdFx0XHRcdHVybDogbGluayxcblx0XHRcdFx0ZW1haWw6IGVtYWlsXG5cdFx0XHR9LFxuXHRcdFx0Y2xpY2tPdXRzaWRlVG9DbG9zZTogdHJ1ZSxcblx0XHRcdHRhcmdldEV2ZW50OiBlLFxuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCB1cmwsIGVtYWlsKSB7XG5cdFx0XHRcdCRzY29wZS51cmwgPSB1cmw7XG5cdFx0XHRcdCRzY29wZS5lbWFpbCA9IGVtYWlsO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0Ly8gc2lkZW5hdiBiZWhhdmlvdXJcblx0dm0uJG1kTWVkaWEgPSAkbWRNZWRpYTtcblx0aWYgKCF2bS4kbWRNZWRpYSgnbGcnKSkge1xuXHRcdHZtLmxpc3RzVmlld09wZW4gPSB0cnVlO1xuXHR9XG5cdGZ1bmN0aW9uIHRvZ2dsZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykudG9nZ2xlKCk7XG5cdH1cblx0ZnVuY3Rpb24gY2xvc2VMaXN0c1ZpZXcoKSB7XG5cdFx0JG1kU2lkZW5hdignbGVmdCcpLmNsb3NlKCk7XG5cdH1cblxuXHQvLyBMaXN0cyBkZWxldGUgb3BlcmF0aW9uc1xuXHRmdW5jdGlvbiBkZWxldGVMaXN0QnlJZChpZCkge1xuXHRcdC8vIHNob3cgdW5kbyB0b2FzdFxuXHRcdHZhciBkZWxldGVUb2FzdCA9ICRtZFRvYXN0LnNpbXBsZSgpLmNvbnRlbnQoJ0xpc3QgRGVsZXRlZCcpLmFjdGlvbignVW5kbycpLmhpZ2hsaWdodEFjdGlvbih0cnVlKTtcblx0XHQkbWRUb2FzdC5zaG93KGRlbGV0ZVRvYXN0KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2UgPT09ICdvaycpIHtcblx0XHRcdFx0dW5kb0RlbGV0ZSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdC8vIHBlcmZvcm0gZGVsZXRlXG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmRlbGV0ZUxpc3QoaWQpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkbWRUb2FzdC5oaWRlKCk7XG5cdFx0fSk7XG5cdFx0Ly8gaGlkZSBjdXJyZW50bHkgZWRpdGluZyBsaXN0XG5cdFx0JG1kU2lkZW5hdignbGVmdCcpLm9wZW4oKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVuZG9EZWxldGUoKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmNhbmNlbERlbGV0ZSgpO1xuXHR9XG59XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdJdGVtc0NvbnRyb2xsZXInLCBJdGVtc0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBJdGVtc0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlLCAkbWRUb2FzdCwgJG1kTWVkaWEpIHtcblx0dmFyIHZtID0gdGhpcztcblxuXHR2bS5hZGRJdGVtID0gYWRkSXRlbTtcblx0dm0uZ2V0Q3VycmVudExpc3QgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3Q7XG5cdHZtLmRlbGV0ZUl0ZW0gPSBkZWxldGVJdGVtO1xuXHR2bS5zZWFyY2hOYW1lID0gc2VhcmNoTmFtZTtcblx0dm0uZ2V0UGhvdG8gPSBnZXRQaG90bztcblxuXHRmdW5jdGlvbiBhZGRJdGVtKCkge1xuXHRcdGlmICghYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0KCkpIHtcblx0XHRcdGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChhbGxMaXN0c1NlcnZpY2UuYWRkKCkpO1xuXHRcdH1cblx0XHR2bS5nZXRDdXJyZW50TGlzdCgpLmFkZEl0ZW0oKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGRlbGV0ZUl0ZW0oaWQpIHtcblx0XHQvLyBzaG93IHVuZG8gdG9hc3Rcblx0XHR2YXIgZGVsZXRlVG9hc3QgPSAkbWRUb2FzdC5zaW1wbGUoKS5jb250ZW50KCdJdGVtIERlbGV0ZWQnKS5hY3Rpb24oJ1VuZG8nKS5oaWdobGlnaHRBY3Rpb24odHJ1ZSk7XG5cdFx0JG1kVG9hc3Quc2hvdyhkZWxldGVUb2FzdCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0aWYgKHJlc3BvbnNlID09PSAnb2snKSB7XG5cdFx0XHRcdHVuZG9EZWxldGUoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHQvLyBwZXJmb3JtIGRlbGV0ZVxuXHRcdGFsbExpc3RzU2VydmljZS5kZWxldGVJdGVtKGlkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0JG1kVG9hc3QuaGlkZSgpO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gdW5kb0RlbGV0ZSgpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2UuY2FuY2VsRGVsZXRlKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBzZWFyY2hOYW1lKHF1ZXJ5KSB7XG5cdFx0dmFyIGFsbEl0ZW1zID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0KCkuaXRlbXM7XG5cdFx0dmFyIG5hbWVzID0gW3F1ZXJ5XTtcblx0XHQvLyBnZXQgbGlzdCBvZiBhbGwgdW5pcXVlIG5hbWVzXG5cdFx0Zm9yICh2YXIgaT0wOyBpPGFsbEl0ZW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgbmFtZSA9IGFsbEl0ZW1zW2ldLmFzc2lnbjtcblx0XHRcdGlmIChuYW1lICYmIG5hbWVzLmluZGV4T2YobmFtZSkgPCAwKSB7IC8vIGlmIG5hbWUgaXNuJ3QgYWxyZWFkeSBpbiBsaXN0XG5cdFx0XHRcdG5hbWVzLnB1c2gobmFtZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIGZpbmQgbWF0Y2hlZCBuYW1lc1xuXHRcdHZhciBtYXRjaGVzID0gbmFtZXMuZmlsdGVyKGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRcdHJldHVybiBuYW1lLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihxdWVyeS50b0xvd2VyQ2FzZSgpKSA9PT0gMDtcblx0XHR9KTtcblx0XHRyZXR1cm4gbWF0Y2hlcztcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFBob3RvKGlkLCBwcm9taXNlKSB7XG5cdFx0dmFyIGxpc3QgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKTtcblx0XHR2YXIgaW5kZXggPSBsaXN0LmdldEl0ZW1JbmRleEJ5SWQoaWQpO1xuXHRcdHZhciBsb2FkaW5nSWNvbiA9IFwiLi9pbWcvbG9hZGluZy1idWJibGVzLnN2Z1wiO1xuXHRcdHByb21pc2UudGhlbihmdW5jdGlvbihmaWxlKXtcblx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLnBob3RvID0gZmlsZTtcblx0XHR9LCBudWxsXG5cdFx0LCBmdW5jdGlvbih1cGRhdGUpIHtcblx0XHRcdGlmICh1cGRhdGUgPT09ICdnZXR0aW5nJykge1xuXHRcdFx0XHRsaXN0Lml0ZW1zW2luZGV4XS5waG90byA9IGxvYWRpbmdJY29uO1xuXHRcdFx0fSBlbHNlIGlmICh1cGRhdGUgPT09ICdub0ltYWdlJykge1xuXHRcdFx0XHRpZiAobGlzdC5pdGVtc1tpbmRleF0ucGhvdG8gPT0gbG9hZGluZ0ljb24pIHtcblx0XHRcdFx0XHRsaXN0Lml0ZW1zW2luZGV4XS5waG90byA9IHVuZGVmaW5lZDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdMaXN0c0NvbnRyb2xsZXInLCBMaXN0c0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBMaXN0c0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cblx0dmFyIHZtID0gdGhpcztcblx0XG5cdHZtLmxpc3RzID0gYWxsTGlzdHNTZXJ2aWNlLmxpc3RzO1xuXG5cdHZtLmFkZExpc3QgPSBmdW5jdGlvbigpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0fTtcblxuXHR2bS5jdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtJdGVtJywgYmtJdGVtKTtcblxuZnVuY3Rpb24gYmtJdGVtKCRxKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrSXRlbS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0Ly8gRW5kIGN1c3RvbSBlZGl0IG1vZGUgb24gY2xpY2tcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRkZXNlbGVjdCgpO1xuXHRcdH0pO1xuXG5cdFx0dmFyIGxpc3RWaWV3ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2JrLWxpc3Qtdmlld10nKTtcblx0XHR2YXIgYXNzaWduSW5wdXQ7XG5cblx0XHQvLyBFbnRlciBhc3NpZ24gbW9kZVxuXHRcdGZ1bmN0aW9uIGVudGVyQXNzaWduTW9kZSgpIHtcblx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGFzc2lnbklucHV0LnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBhc3NpZ25JbnB1dC5mb2N1cygpOyB9LCAxMDApOyAvLyBkZWxheSB0byB3YWl0IGZvciBjbGFzc2VzIHRvIGFwcGx5XG5cdFx0XHRsaXN0Vmlldy5jbGFzc0xpc3QuYWRkKFwiaGFzRWRpdGFibGVJdGVtXCIpO1xuXHRcdH1cblxuXHRcdC8vIFBob3RvIHNlbGVjdFxuXHRcdHZhciBwaG90b0lucHV0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdpbnB1dC5waG90bycpO1xuXHRcdHZhciBmaWxlRGVmZXI7XG5cdFx0dmFyIHdhaXRpbmdJbnB1dCA9IDA7XG5cdFx0ZnVuY3Rpb24gcGhvdG9Qcm9tcHQoKSB7XG5cdFx0XHRmaWxlRGVmZXIgPSAkcS5kZWZlcigpO1xuXHRcdFx0c2NvcGUuSXRlbXMuZ2V0UGhvdG8oYXR0cnMuaXRlbUlkLCBmaWxlRGVmZXIucHJvbWlzZSk7XG5cdFx0XHRwaG90b0lucHV0LmNsaWNrKCk7XG5cdFx0XHRwaG90b0lucHV0LnZhbHVlID0gbnVsbDtcblx0XHR9XG5cdFx0ZnVuY3Rpb24gb25QaG90b1Byb21wdE9wZW4oKSB7XG5cdFx0XHRpZiAoZWxlbWVudFswXS5jb250YWlucyhkb2N1bWVudC5hY3RpdmVFbGVtZW50KSAmJiBmaWxlRGVmZXIpIHtcblx0XHRcdFx0ZmlsZURlZmVyLm5vdGlmeSgnZ2V0dGluZycpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRmdW5jdGlvbiBvblBob3RvUHJvbXB0Q2xvc2UoKSB7XG5cdFx0XHRpZiAoZmlsZURlZmVyKSB7XG5cdFx0XHRcdGZpbGVEZWZlci5ub3RpZnkoJ25vSW1hZ2UnKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZnVuY3Rpb24gb25QaG90b1Byb21wdENoYW5nZSgpIHtcblx0XHRcdGlmICh3YWl0aW5nSW5wdXQgPiAwKSB7XG5cdFx0XHRcdHdhaXRpbmdJbnB1dCA9IDA7XG5cdFx0XHRcdGlmIChmaWxlRGVmZXIpIGZpbGVEZWZlci5ub3RpZnkoJ25vSW1hZ2UnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHdhaXRpbmdJbnB1dCsrO1xuXHRcdFx0XHRpZiAoZmlsZURlZmVyKSBmaWxlRGVmZXIubm90aWZ5KCdnZXR0aW5nJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHBob3RvSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIGZpbGUgPSBlLnRhcmdldC5maWxlc1swXTtcblx0XHRcdHdhaXRpbmdJbnB1dCA9IDA7XG5cdFx0XHRpZiAoZmlsZSkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblx0XHRcdFx0cmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGZpbGVEZWZlci5yZXNvbHZlKHJlYWRlci5yZXN1bHQpO1xuXHRcdFx0XHRcdGZpbGVEZWZlciA9IHVuZGVmaW5lZDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2ltZy5waG90bycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdGVsZW1lbnQudG9nZ2xlQ2xhc3MoJ3Bob3RvVmlldycpO1xuXHRcdH0pO1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1lZGlhJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVDbGFzcygncGhvdG9WaWV3Jyk7XG5cdFx0fSk7XG5cblx0XHQvLyBUb2dnbGUgaXRlbSBkb25lbmVzc1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmRvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudC50b2dnbGVDbGFzcyhcImRvbmVcIikucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZVwiKTtcblx0XHRcdGxpc3RWaWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJoYXNFZGl0YWJsZUl0ZW1cIik7XG5cdFx0XHRkZXNlbGVjdCgpO1xuXHRcdH0pO1xuXHRcdFxuXHRcdC8vIFJlYXR0YWNoIGxpc3RlbmVyIHRvIGJ1dHRvbnMgb24gc2NyZWVuIHNpemUgY2hhbmdlXG5cdFx0dmFyIGFzc2lnbkJ1dHRvbiA9IGdldEFzc2lnbkJ1dHRvbigpO1xuXHRcdHZhciBwaG90b0J1dHRvbiA9IGdldFBob3RvQnV0dG9uKCk7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBvblBob3RvUHJvbXB0T3Blbik7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgb25QaG90b1Byb21wdENsb3NlKTtcblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCBvblBob3RvUHJvbXB0Q2hhbmdlKTtcblx0XHRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBzY29wZS5NYWluLiRtZE1lZGlhKCdtZCcpOyB9LCBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChhc3NpZ25CdXR0b24pIHtcblx0XHRcdFx0YXNzaWduQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJBc3NpZ25Nb2RlKTtcblx0XHRcdH1cblx0XHRcdGFzc2lnbkJ1dHRvbiA9IGdldEFzc2lnbkJ1dHRvbigpO1xuXHRcdFx0aWYgKGFzc2lnbkJ1dHRvbikge1xuXHRcdFx0XHRhc3NpZ25CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlbnRlckFzc2lnbk1vZGUpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHBob3RvQnV0dG9uKSB7XG5cdFx0XHRcdHBob3RvQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcGhvdG9Qcm9tcHQpO1xuXHRcdFx0fVxuXHRcdFx0cGhvdG9CdXR0b24gPSBnZXRQaG90b0J1dHRvbigpO1xuXHRcdFx0aWYgKHBob3RvQnV0dG9uKSB7XG5cdFx0XHRcdHBob3RvQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcGhvdG9Qcm9tcHQpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gY2xpY2tpbmcgYnV0dG9uXG5cdFx0XHRlbGVtZW50LmZpbmQoJ2J1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdFx0Ly8gaU9TIGZpeCB0byBkZXNlbGVjdCBidXR0b25cblx0XHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gRGVsYXkgcXVlcnlpbmcgZm9yIGlucHV0IHVudGlsIGVsZW1lbnQgY3JlYXRlZFxuXHRcdFx0YXNzaWduSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ21kLWF1dG9jb21wbGV0ZS5hc3NpZ24gaW5wdXQnKTtcblx0XHRcdC8vIFByZXZlbnQgZW5kaW5nIGVkaXQgbW9kZSB3aGVuIHNlbGVjdGluZyBpbnB1dFxuXHRcdFx0ZWxlbWVudC5maW5kKCdtZC1pbnB1dC1jb250YWluZXInKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHR9KTtcblx0XHR9LCAxMDApO1xuXG5cdFx0Ly8gTGVhdmUgY3VzdG9tIGVkaXQgbW9kZVxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0KCkge1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVDbGFzcyhcImVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGdldEFzc2lnbkJ1dHRvbigpIHtcblx0XHRcdHJldHVybiBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5hc3NpZ24nKTtcblx0XHR9XG5cdFx0ZnVuY3Rpb24gZ2V0UGhvdG9CdXR0b24oKSB7XG5cdFx0XHRyZXR1cm4gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24ucGhvdG8nKTtcblx0XHR9XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0SW5mbycsIGJrTGlzdEluZm8pO1xuXG5mdW5jdGlvbiBia0xpc3RJbmZvKGFsbExpc3RzU2VydmljZSkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0dGVtcGxhdGVVcmw6ICcuL3RlbXBsYXRlcy9ia0xpc3RJbmZvLmh0bWwnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7IGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChzY29wZS5saXN0KSB9KTtcblx0XHR9KTtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0VmlldycsIGJrTGlzdFZpZXcpO1xuXG5mdW5jdGlvbiBia0xpc3RWaWV3KCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0Y29udHJvbGxlcjogJ0l0ZW1zQ29udHJvbGxlcicsXG5cdFx0Y29udHJvbGxlckFzOiAnSXRlbXMnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXG5cdFx0dmFyIHN1YmhlYWRlciA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlcicpO1xuXHRcdHZhciB0aXRsZUlucHV0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyIGlucHV0Jyk7XG5cblx0XHQvLyBDbGljayBvdXRzaWRlIG9mIGl0ZW1zIHRvIGV4aXQgZWRpdCBtb2RlXG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0aWYgKGUudGFyZ2V0KSB7XG5cdFx0XHRcdHZhciBia0l0ZW0gPSBpc0JrSXRlbUNoaWxkKGUudGFyZ2V0KTtcblx0XHRcdFx0aWYgKGJrSXRlbSkge1xuXHRcdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUoYmtJdGVtKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gUHJldmVudCBsb3NpbmcgZm9jdXMgb24gYnV0dG9uIGNsaWNrc1xuXHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblxuXHRcdC8vIE1ha2UgdGl0bGUgZWRpdGFibGUgb24gY2xpY2tcblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgLm5hbWUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0bWFrZVRpdGxlRWRpdGFibGUoKTtcblx0XHR9KTtcblxuXHRcdC8vIEV4aXQgdGl0bGUgZWRpdCBtb2RlIG9uIHRpdGxlIGlucHV0IGxvc2luZyBmb2N1c1xuXHRcdHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJykuY2xhc3NMaXN0LnJlbW92ZSgnZWRpdGFibGUnKTtcblx0XHR9KTtcblxuXHRcdC8vIFN3aXRjaCBmb2N1cyB0byBuZXcgaXRlbVxuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLm5ld0l0ZW0nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdHZhciBuZXdJdGVtID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdiay1pdGVtJyk7XG5cdFx0XHRpZiAobmV3SXRlbSkge1xuXHRcdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0XHRtYWtlSXRlbUVkaXRhYmxlKG5ld0l0ZW0pO1xuXHRcdFx0XHR2YXIgdGl0bGUgPSBuZXdJdGVtLnF1ZXJ5U2VsZWN0b3IoJy50aXRsZSBpbnB1dCcpO1xuXHRcdFx0XHQvLyBmb2N1cyB0aXRsZSBmaWVsZCBieSBkZWZhdWx0OyBkZWxheSB0byB3YWl0IGZvciBzdHlsZSB0byB0YWtlIGVmZmVjdFxuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB0aXRsZS5mb2N1cygpOyB9LCAxMDApO1xuXHRcdFx0XHR0aXRsZS5zZWxlY3QoKTsgLy8gaU9TIGZpeFxuXHRcdFx0XHR3aW5kb3cuc2Nyb2xsKDEsMSk7IC8vIGlPUyBmaXhcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGZ1bmN0aW9uIG1ha2VUaXRsZUVkaXRhYmxlKCkge1xuXHRcdFx0c3ViaGVhZGVyLmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlJyk7XG5cdFx0XHR0aXRsZUlucHV0LmZvY3VzKCk7XG5cdFx0fVxuXHRcdHNjb3BlLm1ha2VUaXRsZUVkaXRhYmxlID0gbWFrZVRpdGxlRWRpdGFibGU7XG5cblx0XHRmdW5jdGlvbiBkZXNlbGVjdEFsbCgpIHtcblx0XHRcdGVsZW1lbnQuZmluZCgnYmstaXRlbScpLnJlbW92ZUNsYXNzKFwiZWRpdGFibGUgZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKCdoYXNFZGl0YWJsZUl0ZW0nKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBtYWtlSXRlbUVkaXRhYmxlKGl0ZW0pIHtcblx0XHRcdGl0ZW0uY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGlzQmtJdGVtQ2hpbGQobm9kZSkge1xuXHRcdFx0dmFyIGlzQ2FyZENvbnRlbnQgPSBmYWxzZTtcblx0XHRcdHdoaWxlIChub2RlICYmIG5vZGUgIT09IGVsZW1lbnRbMF0pIHtcblx0XHRcdFx0aWYgKG5vZGUubm9kZU5hbWUgPT09ICdNRC1DQVJELUNPTlRFTlQnKSB7XG5cdFx0XHRcdFx0aXNDYXJkQ29udGVudCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGlzQ2FyZENvbnRlbnQgJiYgbm9kZS5ub2RlTmFtZSA9PT0gJ0JLLUlURU0nKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5vZGU7XG5cdFx0XHRcdH1cblx0XHRcdFx0bm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0l0ZW1PYmplY3QnLCBJdGVtT2JqZWN0KTtcblxuZnVuY3Rpb24gSXRlbU9iamVjdCgpIHtcblxuXHR2YXIgaXRlbU9iamVjdCA9IGZ1bmN0aW9uKGlkKSB7XG5cdFx0dGhpcy5pZCA9IGlkO1xuXHRcdHRoaXMudGl0bGUgPSAnJztcblx0XHR0aGlzLm5vdGUgPSAnJztcblx0XHR0aGlzLmFzc2lnbiA9ICcnO1xuXHRcdHRoaXMuZG9uZSA9IGZhbHNlO1xuXHRcdHRoaXMubGFzdEVkaXRlZCA9IERhdGUubm93KCk7XG5cdH1cblxuXHRyZXR1cm4gaXRlbU9iamVjdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0xpc3RPYmplY3QnLCBMaXN0T2JqZWN0KTtcblxuZnVuY3Rpb24gTGlzdE9iamVjdChJdGVtT2JqZWN0LCBpZEdlbmVyYXRvcikge1xuXG5cdHZhciBsaXN0T2JqZWN0ID0gZnVuY3Rpb24oaWQsIG5hbWUpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLml0ZW1zID0gW107XG5cdFx0dGhpcy5hZGRJdGVtID0gYWRkSXRlbTtcblx0XHR0aGlzLmdldEl0ZW1JbmRleEJ5SWQgPSBnZXRJdGVtSW5kZXhCeUlkO1xuXHRcdHRoaXMuZ2V0RGVzY3JpcHRpb24gPSBnZXREZXNjcmlwdGlvbjtcblx0fVxuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0dGhpcy5pdGVtcy51bnNoaWZ0KG5ldyBJdGVtT2JqZWN0KGlkR2VuZXJhdG9yLmdldCg0KSkpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0SXRlbUluZGV4QnlJZChpZCkge1xuXHRcdGZvciAodmFyIGk9MDsgaTx0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAodGhpcy5pdGVtc1tpXS5pZCA9PT0gaWQpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAtMTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldERlc2NyaXB0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLml0ZW1zLm1hcChmdW5jdGlvbihpdGVtKSB7IGlmICghaXRlbS5kb25lKSByZXR1cm4gaXRlbS50aXRsZSB9KVxuXHRcdFx0XHRcdFx0LmZpbHRlcihmdW5jdGlvbih2YWwpIHsgcmV0dXJuIHZhbDsgfSkvLyBnZXQgbm9uLWVtcHR5IGl0ZW1zXG5cdFx0XHRcdFx0XHQuam9pbignLCAnKTtcblx0fVxuXG5cdHJldHVybiBsaXN0T2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnYWxsTGlzdHNTZXJ2aWNlJywgYWxsTGlzdHNTZXJ2aWNlKTtcblxuZnVuY3Rpb24gYWxsTGlzdHNTZXJ2aWNlKExpc3RPYmplY3QsICRxLCBpZEdlbmVyYXRvciwgJHJvb3RTY29wZSwgJHRpbWVvdXQpIHtcblxuXHR2YXIgbGlzdHMgPSBbXTtcblx0dmFyIGN1cnJlbnRMaXN0SWQgPSB1bmRlZmluZWQ7XG5cdHZhciBkZWxldGVUaW1lcjtcblx0dmFyIGRlbGV0ZURlZmVyO1xuXHR2YXIgZGVsZXRpbmdMaXN0SWQ7XG5cdHZhciBkZWxldGluZ0l0ZW1JZDtcblx0dmFyIGZpcmVSZWYgPSBuZXcgRmlyZWJhc2UoXCJodHRwczovL3RvcnJpZC1maXJlLTYyNjYuZmlyZWJhc2Vpby5jb20vXCIpO1xuXHRsb2NhbFJldHJpZXZlKCk7XG5cblx0cmV0dXJuIHtcblx0XHRhZGQ6IGFkZCxcblx0XHRsaXN0czogbGlzdHMsXG5cdFx0c2V0Q3VycmVudExpc3Q6IHNldEN1cnJlbnRMaXN0LFxuXHRcdGdldEN1cnJlbnRMaXN0OiBnZXRDdXJyZW50TGlzdCxcblx0XHRkZWxldGVMaXN0OiBkZWxldGVMaXN0LFxuXHRcdGRlbGV0ZUl0ZW06IGRlbGV0ZUl0ZW0sXG5cdFx0Y2FuY2VsRGVsZXRlOiBjYW5jZWxEZWxldGUsXG5cdFx0c3luY0FsbDogc3luY0FsbCxcblx0XHRpbXBvcnRMaXN0OiBpbXBvcnRMaXN0LFxuXHR9O1xuXG5cdGZ1bmN0aW9uIGFkZCgpIHtcblx0XHRsaXN0cy51bnNoaWZ0KFxuXHRcdFx0bmV3IExpc3RPYmplY3QoaWRHZW5lcmF0b3IuZ2V0KDgpLCBcIk5ldyBMaXN0IFwiKyhsaXN0cy5sZW5ndGgrMSkpXG5cdFx0KTtcblx0XHRyZXR1cm4gbGlzdHNbMF07XG5cdH1cblxuXHRmdW5jdGlvbiBmaW5kTGlzdEluZGV4QnlJZChpZCkge1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKGxpc3RzW2ldLmlkID09PSBpZCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlSXRlbURhdGEoaXRlbSwgdmFsdWVzKSB7XG5cdFx0aXRlbS5pZCA9IHZhbHVlcy5pZDtcblx0XHRpdGVtLnRpdGxlID0gdmFsdWVzLnRpdGxlO1xuXHRcdGl0ZW0ubm90ZSA9IHZhbHVlcy5ub3RlO1xuXHRcdGl0ZW0uYXNzaWduID0gdmFsdWVzLmFzc2lnbjtcblx0XHRpdGVtLmF1ZGlvID0gdmFsdWVzLmF1ZGlvO1xuXHRcdGl0ZW0ucGhvdG8gPSB2YWx1ZXMucGhvdG87XG5cdFx0aWYgKGl0ZW0ucGhvdG8gPT0gXCIuL2ltZy9sb2FkaW5nLWJ1YmJsZXMuc3ZnXCIpIHtcblx0XHRcdGl0ZW0ucGhvdG8gPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGl0ZW0uZG9uZSA9IHZhbHVlcy5kb25lO1xuXHRcdGl0ZW0ubGFzdEVkaXRlZCA9IHZhbHVlcy5sYXN0RWRpdGVkO1xuXHRcdGl0ZW0uZGVsZXRpbmcgPSB2YWx1ZXMuZGVsZXRpbmc7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXREYXRhT25seUl0ZW0ob3JpZ2luYWwpIHtcblx0XHR2YXIgaXRlbSA9IHt9O1xuXHRcdHVwZGF0ZUl0ZW1EYXRhKGl0ZW0sIG9yaWdpbmFsKTtcblx0XHRmb3IgKHZhciBrZXkgaW4gaXRlbSkge1xuXHRcdFx0aWYgKGl0ZW1ba2V5XSA9PT0gbnVsbCB8fCBpdGVtW2tleV0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRkZWxldGUgaXRlbVtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gaXRlbTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldERhdGFPbmx5TGlzdChpZCkge1xuXHRcdHZhciBsaXN0ID0gbGlzdHNbZmluZExpc3RJbmRleEJ5SWQoaWQpXTtcblx0XHR2YXIgdGV4dE9ubHlMaXN0ID0gW107XG5cdFx0Zm9yICh2YXIgaT0wOyBpPGxpc3QuaXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRleHRPbmx5TGlzdC5wdXNoKGdldERhdGFPbmx5SXRlbShsaXN0Lml0ZW1zW2ldKSk7XG5cdFx0fVxuXHRcdHJldHVybiB0ZXh0T25seUxpc3Q7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWxldGVMaXN0KGlkLCBpbW1lZGlhdGUpIHtcblx0XHQvLyBTZXQgbGlzdCBzdGF0dXMgZm9yIGRlbGV0aW9uXG5cdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoaWQpO1xuXHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRsaXN0c1tpbmRleF0uZGVsZXRpbmcgPSB0cnVlO1xuXHRcdFx0Y3VycmVudExpc3RJZCA9ICcnO1xuXHRcdH1cblx0XHQvLyBkZWxldGUgZGVsYXlcblx0XHR2YXIgZGVsYXkgPSA1MDAwO1xuXHRcdGlmICghaW1tZWRpYXRlKSBkZWxheSA9IDA7XG5cdFx0ZGVsZXRpbmdMaXN0SWQgPSBpZDtcblx0XHRkZWxldGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0ZGVsZXRlVGltZXIgPSAkdGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdC8vIGdldCBpbmRleCBhZ2FpbiwgYXMgaXQgbWF5IGhhdmUgY2hhbmdlZFxuXHRcdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoaWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVzb2x2ZSgnZGVsZXRlZCcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdsaXN0Tm90Rm91bmQnKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nTGlzdElkID0gdW5kZWZpbmVkO1xuXHRcdH0sIGRlbGF5KTtcblx0XHRyZXR1cm4gZGVsZXRlRGVmZXIucHJvbWlzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGRlbGV0ZUl0ZW0oaWQsIGltbWVkaWF0ZSkge1xuXHRcdC8vIFNldCBsaXN0IHN0YXR1cyBmb3IgZGVsZXRpb25cblx0XHR2YXIgaW5kZXggPSBnZXRDdXJyZW50TGlzdCgpLmdldEl0ZW1JbmRleEJ5SWQoaWQpO1xuXHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRnZXRDdXJyZW50TGlzdCgpLml0ZW1zW2luZGV4XS5kZWxldGluZyA9IHRydWU7XG5cdFx0fVxuXHRcdC8vIGRlbGV0ZSBkZWxheVxuXHRcdGRlbGV0aW5nSXRlbUlkID0gaWQ7XG5cdFx0ZGVsZXRpbmdMaXN0SWQgPSBnZXRDdXJyZW50TGlzdCgpLmlkOyAvLyBzdG9yZSBsaXN0IGlkIGluIGNhc2UgY3VycmVudCBsaXN0IGlzIGNoYW5nZWRcblx0XHRkZWxldGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0dmFyIGRlbGF5ID0gNTAwMDtcblx0XHRpZiAoIWltbWVkaWF0ZSkgZGVsYXkgPSAwO1xuXHRcdGRlbGV0ZVRpbWVyID0gJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBnZXQgaW5kZXggYWdhaW4sIGFzIGl0IG1heSBoYXZlIGNoYW5nZWRcblx0XHRcdHZhciBsaXN0SW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChkZWxldGluZ0xpc3RJZCk7XG5cdFx0XHRpZiAobGlzdEluZGV4ID49IDApIHtcblx0XHRcdFx0dmFyIGluZGV4ID0gbGlzdHNbbGlzdEluZGV4XS5nZXRJdGVtSW5kZXhCeUlkKGlkKTtcblx0XHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0XHRsaXN0c1tsaXN0SW5kZXhdLml0ZW1zLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdFx0ZGVsZXRlRGVmZXIucmVzb2x2ZSgnZGVsZXRlZCcpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGRlbGV0ZURlZmVyLnJlamVjdCgnbGlzdE5vdEZvdW5kJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nSXRlbUlkID0gdW5kZWZpbmVkO1xuXHRcdH0sIGRlbGF5KTtcblx0XHRyZXR1cm4gZGVsZXRlRGVmZXIucHJvbWlzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNhbmNlbERlbGV0ZSgpIHtcblx0XHQkdGltZW91dC5jYW5jZWwoZGVsZXRlVGltZXIpO1xuXHRcdGlmIChkZWxldGluZ0l0ZW1JZCkge1xuXHRcdFx0dmFyIGxpc3QgPSBsaXN0c1tmaW5kTGlzdEluZGV4QnlJZChkZWxldGluZ0xpc3RJZCldO1xuXHRcdFx0dmFyIGluZGV4ID0gbGlzdC5nZXRJdGVtSW5kZXhCeUlkKGRlbGV0aW5nSWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdC5pdGVtc1tpbmRleF0uZGVsZXRpbmcgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nSXRlbUlkID0gdW5kZWZpbmVkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChkZWxldGluZ0lkKTtcblx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdGxpc3RzW2luZGV4XS5kZWxldGluZyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdMaXN0SWQgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGRlbGV0ZURlZmVyLnJlamVjdCgnZGVsZXRlQ2FuY2VsbGVkJyk7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDdXJyZW50TGlzdChsaXN0KSB7XG5cdFx0aWYgKHR5cGVvZiBsaXN0ID09PSAnbnVtYmVyJykge1xuXHRcdFx0Y3VycmVudExpc3RJZCA9IGZpbmRMaXN0SW5kZXhCeUlkKGxpc3QpO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gbGlzdC5pZDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc29sZS53YXJuKCd1bmtub3duIGlucHV0IGZvciBsaXN0OiAnKyB0eXBlb2YgbGlzdCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Q3VycmVudExpc3QoKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBsaXN0c1tmaW5kTGlzdEluZGV4QnlJZChjdXJyZW50TGlzdElkKV07XG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ0xpc3Qgbm90IGZvdW5kLiBJRDogJytjdXJyZW50TGlzdElkKTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0cyk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaW1wb3J0TGlzdChpZCkge1xuXHRcdHZhciBsaXN0UmVmID0gZmlyZVJlZi5jaGlsZChpZCk7XG5cdFx0dmFyIGxpc3Q7XG5cdFx0dmFyIGxvY2FsSW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChpZCk7XG5cdFx0aWYgKGxvY2FsSW5kZXggPCAwKSB7XG5cdFx0XHRsaXN0cy51bnNoaWZ0KG5ldyBMaXN0T2JqZWN0KGlkLCAnU3luY2hyb25pc2luZy4uLicpKVxuXHRcdFx0bGlzdCA9IGxpc3RzWzBdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsaXN0ID0gbGlzdHNbbG9jYWxJbmRleF07XG5cdFx0fVxuXHRcdGxpc3RSZWYub25jZSgndmFsdWUnLCBmdW5jdGlvbihzbmFwc2hvdCkge1xuXHRcdFx0aWYgKHNuYXBzaG90LnZhbCgpKSB7IC8vIGlmIGxpc3QgZXhpc3RzXG5cdFx0XHRcdGxpc3QubmFtZSA9IHNuYXBzaG90LnZhbCgpLm5hbWU7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChzbmFwc2hvdC52YWwoKS5pdGVtcywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRcdHVwZGF0ZUl0ZW0odmFsdWUpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRsaXN0UmVmLmNoaWxkKCduYW1lJykub24oJ3ZhbHVlJywgZnVuY3Rpb24oc25hcHNob3QpIHtcblx0XHRcdFx0XHRsaXN0Lm5hbWUgPSBzbmFwc2hvdC52YWwoKTtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2ZpcmViYXNlU3luYycpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0bGlzdFJlZi5jaGlsZCgnaXRlbXMnKS5vbignY2hpbGRfY2hhbmdlZCcsIGZ1bmN0aW9uKHNuYXBzaG90KSB7XG5cdFx0XHRcdFx0dXBkYXRlSXRlbShzbmFwc2hvdC52YWwoKSlcblx0XHRcdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2ZpcmViYXNlU3luYycpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxpc3QubmFtZSA9ICdOZXcgTGlzdCAnK2xpc3RzLmxlbmd0aDtcblx0XHRcdH1cblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnZmlyZWJhc2VTeW5jJyk7XG5cdFx0fSk7XG5cdFx0ZnVuY3Rpb24gdXBkYXRlSXRlbShpdGVtKSB7XG5cdFx0XHR2YXIgbG9jYWxJdGVtSW5kZXggPSBsaXN0LmdldEl0ZW1JbmRleEJ5SWQoaXRlbS5pZCk7XG5cdFx0XHRpZiAobG9jYWxJdGVtSW5kZXggPCAwKSB7XG5cdFx0XHRcdGxpc3QuaXRlbXMucHVzaChnZXREYXRhT25seUl0ZW0oaXRlbSkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKGxpc3QuaXRlbXNbbG9jYWxJdGVtSW5kZXhdICE9IGl0ZW0pIHtcblx0XHRcdFx0XHR1cGRhdGVJdGVtRGF0YShsaXN0Lml0ZW1zW2xvY2FsSXRlbUluZGV4XSwgaXRlbSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBsb2NhbFJldHJpZXZlKCkge1xuXHRcdHZhciByZXRyaWV2ZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnQmFza2V0cycpO1xuXHRcdGlmIChyZXRyaWV2ZWQpIHtcblx0XHRcdHZhciBwYXJzZWQgPSBKU09OLnBhcnNlKHJldHJpZXZlZCk7XG5cdFx0XHRmb3IgKHZhciBpPTA7IGk8cGFyc2VkLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICghcGFyc2VkW2ldLmRlbGV0aW5nKSB7XG5cdFx0XHRcdFx0dmFyIGxpc3QgPSBuZXcgTGlzdE9iamVjdChwYXJzZWRbaV0uaWQsIHBhcnNlZFtpXS5uYW1lKTtcblx0XHRcdFx0XHRsaXN0Lml0ZW1zID0gcGFyc2VkW2ldLml0ZW1zO1xuXHRcdFx0XHRcdGxpc3RzLnB1c2gobGlzdCk7XG5cdFx0XHRcdFx0aW1wb3J0TGlzdChsaXN0LmlkKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGxvY2FsU2F2ZSgpIHtcblx0XHR2YXIganNvbiA9IEpTT04uc3RyaW5naWZ5KGxpc3RzKTtcblx0XHRpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0Jhc2tldHMnKSAhPT0ganNvbikge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oJ0Jhc2tldHMnLCBqc29uKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdDYW5ub3Qgc3RvcmUgZGF0YSB0byBsb2NhbCBzdG9yYWdlOiAnK2UpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRmdW5jdGlvbiBzeW5jQWxsKCkge1xuXHRcdGlmIChsb2NhbFNhdmUoKSkge1xuXHRcdFx0c3luY0N1cnJlbnRMaXN0KCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gc3luY0N1cnJlbnRMaXN0KCkge1xuXHRcdGlmIChnZXRDdXJyZW50TGlzdCgpKSB7XG5cdFx0XHR2YXIgaXRlbXMgPSBnZXREYXRhT25seUxpc3QoZ2V0Q3VycmVudExpc3QoKS5pZCk7XG5cdFx0XHRmaXJlUmVmLmNoaWxkKGdldEN1cnJlbnRMaXN0KCkuaWQpLmNoaWxkKCduYW1lJykuc2V0KGdldEN1cnJlbnRMaXN0KCkubmFtZSk7XG5cdFx0XHRmb3IgKHZhciBpPTA7IGk8aXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0ZmlyZVJlZi5jaGlsZChnZXRDdXJyZW50TGlzdCgpLmlkKS5jaGlsZCgnaXRlbXMnKS5jaGlsZChpdGVtc1tpXS5pZCkudXBkYXRlKGl0ZW1zW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdpZEdlbmVyYXRvcicsIGlkR2VuZXJhdG9yKTtcblxuZnVuY3Rpb24gaWRHZW5lcmF0b3IoKSB7XG5cblx0cmV0dXJuIHtcblx0XHRnZXQ6IGdldFVuaXFJZCxcblx0fTtcblxuXHRmdW5jdGlvbiBnZXRVbmlxSWQobGVuZ3RoKSB7XG5cdFx0cmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqTWF0aC5wb3coMzYsbGVuZ3RoKSkudG9TdHJpbmcoMzYpKS5zbGljZSgtbGVuZ3RoKTtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ3NoYXJlU2VydmljZScsIHNoYXJlU2VydmljZSk7XG5cbmZ1bmN0aW9uIHNoYXJlU2VydmljZSgpIHtcblxuXHRyZXR1cm4ge1xuXHRcdGdldExpbms6IGdldExpbmssXG5cdFx0d3JpdGVFbWFpbDogd3JpdGVFbWFpbCxcblx0fTtcblxuXHRmdW5jdGlvbiBnZXRMaW5rKGxpc3QpIHtcblx0XHRyZXR1cm4gbG9jYXRpb24ub3JpZ2luK2xvY2F0aW9uLnBhdGhuYW1lK1wiI2xpc3Q9XCIrbGlzdC5pZDtcblx0fVxuXG5cdGZ1bmN0aW9uIHdyaXRlRW1haWwobGlzdCkge1xuXHRcdHZhciByZXN1bHRzID0gW107XG5cdFx0cmVzdWx0cy5wdXNoKFwiQWRkIHRoaXMgbGlzdCB0byB5b3VyIEJhc2tldCBhdCBcIitnZXRMaW5rKGxpc3QpKTtcblx0XHRyZXN1bHRzLnB1c2goXCI9PT09PT09PT09PT09PT09PT09PVwiKTtcblx0XHRyZXN1bHRzLnB1c2gobGlzdC5uYW1lKTtcblx0XHRyZXN1bHRzLnB1c2goXCI9PT09PT09PT09PT09PT09PT09PVwiKTtcblx0XHRyZXN1bHRzLnB1c2goXCJcIik7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPGxpc3QuaXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBpdGVtID0gbGlzdC5pdGVtc1tpXTtcblx0XHRcdHJlc3VsdHMucHVzaChpdGVtLnRpdGxlKTtcblx0XHRcdHJlc3VsdHMucHVzaChcIlwiKTtcblx0XHRcdGlmIChpdGVtLm5vdGUpIHJlc3VsdHMucHVzaCgnTm90ZXM6ICcraXRlbS5ub3RlKTtcblx0XHRcdGlmIChpdGVtLmFzc2lnbikgcmVzdWx0cy5wdXNoKCdBc3NpZ25lZCB0byAnK2l0ZW0uYXNzaWduKTtcblx0XHRcdHJlc3VsdHMucHVzaChcIi0tLS0tLS0tLS0tLS0tLS0tLS0tXCIpO1xuXHRcdFx0cmVzdWx0cy5wdXNoKFwiXCIpO1xuXHRcdH1cblx0XHR2YXIgYm9keSA9IHJlc3VsdHMuam9pbignXFxuJyk7IC8vIG5ldyBsaW5lXG5cdFx0cmV0dXJuICdtYWlsdG86P2JvZHk9JytlbmNvZGVVUklDb21wb25lbnQoYm9keSk7XG5cdH1cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=