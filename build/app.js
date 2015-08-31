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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9MaXN0c0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2JrSXRlbS5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0SW5mby5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0Vmlldy5qcyIsInNlcnZpY2VzL0l0ZW1PYmplY3QuanMiLCJzZXJ2aWNlcy9MaXN0T2JqZWN0LmpzIiwic2VydmljZXMvYWxsTGlzdHNTZXJ2aWNlLmpzIiwic2VydmljZXMvaWRHZW5lcmF0b3IuanMiLCJzZXJ2aWNlcy9zaGFyZVNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxPQUFPLFlBQVk7Q0FDdEIsY0FBYzs7O0FBR2YsSUFBSSxNQUFNLFFBQVEsT0FBTyxPQUFPLENBQUM7S0FDNUIsU0FBUyxXQUFXLENBQUMsWUFBWTtBQUN0QztBQ05BO0VBQ0UsT0FBTztFQUNQLFdBQVcsb0JBQW9COztBQUVqQyxTQUFTLGlCQUFpQixZQUFZLFVBQVUsaUJBQWlCLFVBQVUsU0FBUyxRQUFRLFdBQVcsY0FBYztDQUNwSCxJQUFJLEtBQUs7Q0FDVCxHQUFHLGtCQUFrQjtDQUNyQixHQUFHLGlCQUFpQjtDQUNwQixHQUFHLGlCQUFpQjtDQUNwQixHQUFHLFlBQVk7Q0FDZixHQUFHLFVBQVU7OztDQUdiLGdCQUFnQjtDQUNoQixZQUFZLGdCQUFnQixTQUFTOztDQUVyQyxPQUFPLElBQUksZ0JBQWdCLFdBQVc7RUFDckMsT0FBTzs7O0NBR1IsSUFBSSxTQUFTLEtBQUssVUFBVSxHQUFHLFFBQVEsYUFBYSxHQUFHO0VBQ3RELGdCQUFnQixXQUFXLFNBQVMsS0FBSyxVQUFVOztDQUVwRCxPQUFPLG1CQUFtQixnQkFBZ0I7O0NBRTFDLFNBQVMsVUFBVSxNQUFNLEdBQUc7RUFDM0IsSUFBSSxPQUFPLGFBQWEsUUFBUTtFQUNo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LE1BQU07RUFDekIsSUFBSSxVQUFVO0VBQ2QsUUFBUSxLQUFLLG1DQUFtQyxRQUFRO0VBQ3hELFFBQVEsS0FBSztFQUNiLFFBQVEsS0FBSyxLQUFLO0VBQ2xCLFFBQVEsS0FBSztFQUNiLFFBQVEsS0FBSztFQUNiLEtBQUssSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLE1BQU0sUUFBUSxLQUFLO0dBQ3ZDLElBQUksT0FBTyxLQUFLLE1BQU07R0FDdEIsUUFBUSxLQUFLLEtBQUs7R0FDbEIsUUFBUSxLQUFLO0dBQ2IsSUFBSSxLQUFLLE1BQU0sUUFBUSxLQUFLLFVBQVUsS0FBSztHQUMzQyxJQUFJLEtBQUssUUFBUSxRQUFRLEtBQUssZUFBZSxLQUFLO0dBQ2xELFFBQVEsS0FBSztHQUNiLFFBQVEsS0FBSzs7RUFFZCxJQUFJLE9BQU8sUUFBUSxLQUFLO0VBQ3hCLE9BQU8sZ0JBQWdCLG1CQUFtQjs7Q0FFM0MiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaWYgKHdpbmRvdy5GaWxlUmVhZGVyKSB7XG5cdGZpbGVTdXBwb3J0ID0gdHJ1ZTtcbn1cblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nTWF0ZXJpYWwnXSlcblx0XHRcdFx0LmNvbnN0YW50KCdzdXBwb3J0Jywge2ZpbGVSZWFkZXI6IGZpbGVTdXBwb3J0fSk7XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdCYXNrZXRDb250cm9sbGVyJywgQmFza2V0Q29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEJhc2tldENvbnRyb2xsZXIoJG1kU2lkZW5hdiwgJG1kTWVkaWEsIGFsbExpc3RzU2VydmljZSwgJG1kVG9hc3QsIHN1cHBvcnQsICRzY29wZSwgJG1kRGlhbG9nLCBzaGFyZVNlcnZpY2UpIHtcblx0dmFyIHZtID0gdGhpcztcblx0dm0udG9nZ2xlTGlzdHNWaWV3ID0gdG9nZ2xlTGlzdHNWaWV3O1xuXHR2bS5jbG9zZUxpc3RzVmlldyA9IGNsb3NlTGlzdHNWaWV3O1xuXHR2bS5kZWxldGVMaXN0QnlJZCA9IGRlbGV0ZUxpc3RCeUlkO1xuXHR2bS5zaGFyZUxpc3QgPSBzaGFyZUxpc3Q7XG5cdHZtLnN1cHBvcnQgPSBzdXBwb3J0O1xuXG5cdC8vIGxvYWQvc2F2ZSBkYXRhXG5cdGFsbExpc3RzU2VydmljZS5zeW5jQWxsKCk7XG5cdHNldEludGVydmFsKGFsbExpc3RzU2VydmljZS5zeW5jQWxsLCA1MDAwKTtcblxuXHQkc2NvcGUuJG9uKCdmaXJlYmFzZVN5bmMnLCBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdH0pO1xuXG5cdGlmIChsb2NhdGlvbi5oYXNoLnN1YnN0cmluZygxKS5pbmRleE9mKCdsaXN0PScpID09PSAwKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmltcG9ydExpc3QobG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoNikpO1xuXHR9XG5cdHdpbmRvdy5pbXBvcnRCYXNrZXRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmltcG9ydExpc3Q7XG5cblx0ZnVuY3Rpb24gc2hhcmVMaXN0KGxpc3QsIGUpIHtcblx0XHR2YXIgbGluayA9IHNoYXJlU2VydmljZS5nZXRMaW5rKGxpc3QpO1xuXHRcdHZhciBlbWFpbCA9IHNoYXJlU2VydmljZS53cml0ZUVtYWlsKGxpc3QpO1xuXHRcdCRtZERpYWxvZy5zaG93KHtcblx0XHRcdHRlbXBsYXRlVXJsOiAnLi90ZW1wbGF0ZXMvc2hhcmVEaWFsb2cuaHRtbCcsXG5cdFx0XHRsb2NhbHM6IHtcblx0XHRcdFx0dXJsOiBsaW5rLFxuXHRcdFx0XHRlbWFpbDogZW1haWxcblx0XHRcdH0sXG5cdFx0XHRjbGlja091dHNpZGVUb0Nsb3NlOiB0cnVlLFxuXHRcdFx0dGFyZ2V0RXZlbnQ6IGUsXG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsIHVybCwgZW1haWwpIHtcblx0XHRcdFx0JHNjb3BlLnVybCA9IHVybDtcblx0XHRcdFx0JHNjb3BlLmVtYWlsID0gZW1haWw7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBzaWRlbmF2IGJlaGF2aW91clxuXHR2bS4kbWRNZWRpYSA9ICRtZE1lZGlhO1xuXHRpZiAoIXZtLiRtZE1lZGlhKCdsZycpKSB7XG5cdFx0dm0ubGlzdHNWaWV3T3BlbiA9IHRydWU7XG5cdH1cblx0ZnVuY3Rpb24gdG9nZ2xlTGlzdHNWaWV3KCkge1xuXHRcdCRtZFNpZGVuYXYoJ2xlZnQnKS50b2dnbGUoKTtcblx0fVxuXHRmdW5jdGlvbiBjbG9zZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykuY2xvc2UoKTtcblx0fVxuXG5cdC8vIExpc3RzIGRlbGV0ZSBvcGVyYXRpb25zXG5cdGZ1bmN0aW9uIGRlbGV0ZUxpc3RCeUlkKGlkKSB7XG5cdFx0Ly8gc2hvdyB1bmRvIHRvYXN0XG5cdFx0dmFyIGRlbGV0ZVRvYXN0ID0gJG1kVG9hc3Quc2ltcGxlKCkuY29udGVudCgnTGlzdCBEZWxldGVkJykuYWN0aW9uKCdVbmRvJykuaGlnaGxpZ2h0QWN0aW9uKHRydWUpO1xuXHRcdCRtZFRvYXN0LnNob3coZGVsZXRlVG9hc3QpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZSA9PT0gJ29rJykge1xuXHRcdFx0XHR1bmRvRGVsZXRlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcGVyZm9ybSBkZWxldGVcblx0XHRhbGxMaXN0c1NlcnZpY2UuZGVsZXRlTGlzdChpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRtZFRvYXN0LmhpZGUoKTtcblx0XHR9KTtcblx0XHQvLyBoaWRlIGN1cnJlbnRseSBlZGl0aW5nIGxpc3Rcblx0XHQkbWRTaWRlbmF2KCdsZWZ0Jykub3BlbigpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdW5kb0RlbGV0ZSgpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2UuY2FuY2VsRGVsZXRlKCk7XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1zQ29udHJvbGxlcicsIEl0ZW1zQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1zQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UsICRtZFRvYXN0LCAkbWRNZWRpYSkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXG5cdHZtLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHR2bS5nZXRDdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblx0dm0uZGVsZXRlSXRlbSA9IGRlbGV0ZUl0ZW07XG5cdHZtLnNlYXJjaE5hbWUgPSBzZWFyY2hOYW1lO1xuXHR2bS5nZXRQaG90byA9IGdldFBob3RvO1xuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0aWYgKCFhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKSkge1xuXHRcdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdFx0fVxuXHRcdHZtLmdldEN1cnJlbnRMaXN0KCkuYWRkSXRlbSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlSXRlbShpZCkge1xuXHRcdC8vIHNob3cgdW5kbyB0b2FzdFxuXHRcdHZhciBkZWxldGVUb2FzdCA9ICRtZFRvYXN0LnNpbXBsZSgpLmNvbnRlbnQoJ0l0ZW0gRGVsZXRlZCcpLmFjdGlvbignVW5kbycpLmhpZ2hsaWdodEFjdGlvbih0cnVlKTtcblx0XHQkbWRUb2FzdC5zaG93KGRlbGV0ZVRvYXN0KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2UgPT09ICdvaycpIHtcblx0XHRcdFx0dW5kb0RlbGV0ZSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdC8vIHBlcmZvcm0gZGVsZXRlXG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmRlbGV0ZUl0ZW0oaWQpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkbWRUb2FzdC5oaWRlKCk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiB1bmRvRGVsZXRlKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5jYW5jZWxEZWxldGUoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNlYXJjaE5hbWUocXVlcnkpIHtcblx0XHR2YXIgYWxsSXRlbXMgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKS5pdGVtcztcblx0XHR2YXIgbmFtZXMgPSBbcXVlcnldO1xuXHRcdC8vIGdldCBsaXN0IG9mIGFsbCB1bmlxdWUgbmFtZXNcblx0XHRmb3IgKHZhciBpPTA7IGk8YWxsSXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBuYW1lID0gYWxsSXRlbXNbaV0uYXNzaWduO1xuXHRcdFx0aWYgKG5hbWUgJiYgbmFtZXMuaW5kZXhPZihuYW1lKSA8IDApIHsgLy8gaWYgbmFtZSBpc24ndCBhbHJlYWR5IGluIGxpc3Rcblx0XHRcdFx0bmFtZXMucHVzaChuYW1lKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gZmluZCBtYXRjaGVkIG5hbWVzXG5cdFx0dmFyIG1hdGNoZXMgPSBuYW1lcy5maWx0ZXIoZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0cmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHF1ZXJ5LnRvTG93ZXJDYXNlKCkpID09PSAwO1xuXHRcdH0pO1xuXHRcdHJldHVybiBtYXRjaGVzO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0UGhvdG8oaWQsIHByb21pc2UpIHtcblx0XHR2YXIgbGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpO1xuXHRcdHZhciBpbmRleCA9IGxpc3QuZ2V0SXRlbUluZGV4QnlJZChpZCk7XG5cdFx0dmFyIGxvYWRpbmdJY29uID0gXCIuL2ltZy9sb2FkaW5nLWJ1YmJsZXMuc3ZnXCI7XG5cdFx0cHJvbWlzZS50aGVuKGZ1bmN0aW9uKGZpbGUpe1xuXHRcdFx0bGlzdC5pdGVtc1tpbmRleF0ucGhvdG8gPSBmaWxlO1xuXHRcdH0sIG51bGxcblx0XHQsIGZ1bmN0aW9uKHVwZGF0ZSkge1xuXHRcdFx0aWYgKHVwZGF0ZSA9PT0gJ2dldHRpbmcnKSB7XG5cdFx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLnBob3RvID0gbG9hZGluZ0ljb247XG5cdFx0XHR9IGVsc2UgaWYgKHVwZGF0ZSA9PT0gJ25vSW1hZ2UnKSB7XG5cdFx0XHRcdGlmIChsaXN0Lml0ZW1zW2luZGV4XS5waG90byA9PSBsb2FkaW5nSWNvbikge1xuXHRcdFx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLnBob3RvID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0xpc3RzQ29udHJvbGxlcicsIExpc3RzQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIExpc3RzQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblxuXHR2YXIgdm0gPSB0aGlzO1xuXHRcblx0dm0ubGlzdHMgPSBhbGxMaXN0c1NlcnZpY2UubGlzdHM7XG5cblx0dm0uYWRkTGlzdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChhbGxMaXN0c1NlcnZpY2UuYWRkKCkpO1xuXHR9O1xuXG5cdHZtLmN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0l0ZW0nLCBia0l0ZW0pO1xuXG5mdW5jdGlvbiBia0l0ZW0oJHEpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdHRlbXBsYXRlVXJsOiAnLi90ZW1wbGF0ZXMvYmtJdGVtLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdJdGVtc0NvbnRyb2xsZXInLFxuXHRcdGNvbnRyb2xsZXJBczogJ0l0ZW1zJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHQvLyBFbmQgY3VzdG9tIGVkaXQgbW9kZSBvbiBjbGlja1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cblx0XHR2YXIgbGlzdFZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbYmstbGlzdC12aWV3XScpO1xuXHRcdHZhciBhc3NpZ25JbnB1dDtcblxuXHRcdC8vIEVudGVyIGFzc2lnbiBtb2RlXG5cdFx0ZnVuY3Rpb24gZW50ZXJBc3NpZ25Nb2RlKCkge1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcyhcImVkaXRhYmxlIGVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdFx0YXNzaWduSW5wdXQuc2VsZWN0KCk7IC8vIGlPUyBmaXhcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGFzc2lnbklucHV0LmZvY3VzKCk7IH0sIDEwMCk7IC8vIGRlbGF5IHRvIHdhaXQgZm9yIGNsYXNzZXMgdG8gYXBwbHlcblx0XHRcdGxpc3RWaWV3LmNsYXNzTGlzdC5hZGQoXCJoYXNFZGl0YWJsZUl0ZW1cIik7XG5cdFx0fVxuXG5cdFx0Ly8gUGhvdG8gc2VsZWN0XG5cdFx0dmFyIHBob3RvSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LnBob3RvJyk7XG5cdFx0dmFyIGZpbGVEZWZlcjtcblx0XHR2YXIgd2FpdGluZ0lucHV0ID0gMDtcblx0XHRmdW5jdGlvbiBwaG90b1Byb21wdCgpIHtcblx0XHRcdGZpbGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0XHRzY29wZS5JdGVtcy5nZXRQaG90byhhdHRycy5pdGVtSWQsIGZpbGVEZWZlci5wcm9taXNlKTtcblx0XHRcdHBob3RvSW5wdXQuY2xpY2soKTtcblx0XHRcdHBob3RvSW5wdXQudmFsdWUgPSBudWxsO1xuXHRcdH1cblx0XHRmdW5jdGlvbiBvblBob3RvUHJvbXB0T3BlbigpIHtcblx0XHRcdGlmIChlbGVtZW50WzBdLmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpICYmIGZpbGVEZWZlcikge1xuXHRcdFx0XHRmaWxlRGVmZXIubm90aWZ5KCdnZXR0aW5nJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGZ1bmN0aW9uIG9uUGhvdG9Qcm9tcHRDbG9zZSgpIHtcblx0XHRcdGlmIChmaWxlRGVmZXIpIHtcblx0XHRcdFx0ZmlsZURlZmVyLm5vdGlmeSgnbm9JbWFnZScpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRmdW5jdGlvbiBvblBob3RvUHJvbXB0Q2hhbmdlKCkge1xuXHRcdFx0aWYgKHdhaXRpbmdJbnB1dCA+IDApIHtcblx0XHRcdFx0d2FpdGluZ0lucHV0ID0gMDtcblx0XHRcdFx0aWYgKGZpbGVEZWZlcikgZmlsZURlZmVyLm5vdGlmeSgnbm9JbWFnZScpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0d2FpdGluZ0lucHV0Kys7XG5cdFx0XHRcdGlmIChmaWxlRGVmZXIpIGZpbGVEZWZlci5ub3RpZnkoJ2dldHRpbmcnKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cGhvdG9JbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHR2YXIgZmlsZSA9IGUudGFyZ2V0LmZpbGVzWzBdO1xuXHRcdFx0d2FpdGluZ0lucHV0ID0gMDtcblx0XHRcdGlmIChmaWxlKSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXHRcdFx0XHRyZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0ZmlsZURlZmVyLnJlc29sdmUocmVhZGVyLnJlc3VsdCk7XG5cdFx0XHRcdFx0ZmlsZURlZmVyID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignaW1nLnBob3RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZWxlbWVudC50b2dnbGVDbGFzcygncGhvdG9WaWV3Jyk7XG5cdFx0fSk7XG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWVkaWEnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKCdwaG90b1ZpZXcnKTtcblx0XHR9KTtcblxuXHRcdC8vIFRvZ2dsZSBpdGVtIGRvbmVuZXNzXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24uZG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50LnRvZ2dsZUNsYXNzKFwiZG9uZVwiKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlXCIpO1xuXHRcdFx0bGlzdFZpZXcuY2xhc3NMaXN0LnJlbW92ZShcImhhc0VkaXRhYmxlSXRlbVwiKTtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cdFx0XG5cdFx0Ly8gUmVhdHRhY2ggbGlzdGVuZXIgdG8gYnV0dG9ucyBvbiBzY3JlZW4gc2l6ZSBjaGFuZ2Vcblx0XHR2YXIgYXNzaWduQnV0dG9uID0gZ2V0QXNzaWduQnV0dG9uKCk7XG5cdFx0dmFyIHBob3RvQnV0dG9uID0gZ2V0UGhvdG9CdXR0b24oKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIG9uUGhvdG9Qcm9tcHRPcGVuKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBvblBob3RvUHJvbXB0Q2xvc2UpO1xuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ2aXNpYmlsaXR5Y2hhbmdlXCIsIG9uUGhvdG9Qcm9tcHRDaGFuZ2UpO1xuXHRcdHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuIHNjb3BlLk1haW4uJG1kTWVkaWEoJ21kJyk7IH0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKGFzc2lnbkJ1dHRvbikge1xuXHRcdFx0XHRhc3NpZ25CdXR0b24ucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlbnRlckFzc2lnbk1vZGUpO1xuXHRcdFx0fVxuXHRcdFx0YXNzaWduQnV0dG9uID0gZ2V0QXNzaWduQnV0dG9uKCk7XG5cdFx0XHRpZiAoYXNzaWduQnV0dG9uKSB7XG5cdFx0XHRcdGFzc2lnbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGVudGVyQXNzaWduTW9kZSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAocGhvdG9CdXR0b24pIHtcblx0XHRcdFx0cGhvdG9CdXR0b24ucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBwaG90b1Byb21wdCk7XG5cdFx0XHR9XG5cdFx0XHRwaG90b0J1dHRvbiA9IGdldFBob3RvQnV0dG9uKCk7XG5cdFx0XHRpZiAocGhvdG9CdXR0b24pIHtcblx0XHRcdFx0cGhvdG9CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBwaG90b1Byb21wdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyBQcmV2ZW50IGVuZGluZyBlZGl0IG1vZGUgd2hlbiBjbGlja2luZyBidXR0b25cblx0XHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSk7XG5cdFx0XHQvLyBpT1MgZml4IHRvIGRlc2VsZWN0IGJ1dHRvblxuXHRcdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbigndG91Y2hzdGFydCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBEZWxheSBxdWVyeWluZyBmb3IgaW5wdXQgdW50aWwgZWxlbWVudCBjcmVhdGVkXG5cdFx0XHRhc3NpZ25JbnB1dCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignbWQtYXV0b2NvbXBsZXRlLmFzc2lnbiBpbnB1dCcpO1xuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gc2VsZWN0aW5nIGlucHV0XG5cdFx0XHRlbGVtZW50LmZpbmQoJ21kLWlucHV0LWNvbnRhaW5lcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdH0sIDEwMCk7XG5cblx0XHQvLyBMZWF2ZSBjdXN0b20gZWRpdCBtb2RlXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3QoKSB7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKFwiZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ2V0QXNzaWduQnV0dG9uKCkge1xuXHRcdFx0cmV0dXJuIGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmFzc2lnbicpO1xuXHRcdH1cblx0XHRmdW5jdGlvbiBnZXRQaG90b0J1dHRvbigpIHtcblx0XHRcdHJldHVybiBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5waG90bycpO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RJbmZvJywgYmtMaXN0SW5mbyk7XG5cbmZ1bmN0aW9uIGJrTGlzdEluZm8oYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrTGlzdEluZm8uaHRtbCdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHsgYWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KHNjb3BlLmxpc3QpIH0pO1xuXHRcdH0pO1xuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RWaWV3JywgYmtMaXN0Vmlldyk7XG5cbmZ1bmN0aW9uIGJrTGlzdFZpZXcoKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cblx0XHR2YXIgc3ViaGVhZGVyID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJyk7XG5cdFx0dmFyIHRpdGxlSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgaW5wdXQnKTtcblxuXHRcdC8vIENsaWNrIG91dHNpZGUgb2YgaXRlbXMgdG8gZXhpdCBlZGl0IG1vZGVcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRpZiAoZS50YXJnZXQpIHtcblx0XHRcdFx0dmFyIGJrSXRlbSA9IGlzQmtJdGVtQ2hpbGQoZS50YXJnZXQpO1xuXHRcdFx0XHRpZiAoYmtJdGVtKSB7XG5cdFx0XHRcdFx0bWFrZUl0ZW1FZGl0YWJsZShia0l0ZW0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBQcmV2ZW50IGxvc2luZyBmb2N1cyBvbiBidXR0b24gY2xpY2tzXG5cdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gTWFrZSB0aXRsZSBlZGl0YWJsZSBvbiBjbGlja1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlciAubmFtZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRtYWtlVGl0bGVFZGl0YWJsZSgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gRXhpdCB0aXRsZSBlZGl0IG1vZGUgb24gdGl0bGUgaW5wdXQgbG9zaW5nIGZvY3VzXG5cdFx0dGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXInKS5jbGFzc0xpc3QucmVtb3ZlKCdlZGl0YWJsZScpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gU3dpdGNoIGZvY3VzIHRvIG5ldyBpdGVtXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24ubmV3SXRlbScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIG5ld0l0ZW0gPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2JrLWl0ZW0nKTtcblx0XHRcdGlmIChuZXdJdGVtKSB7XG5cdFx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUobmV3SXRlbSk7XG5cdFx0XHRcdHZhciB0aXRsZSA9IG5ld0l0ZW0ucXVlcnlTZWxlY3RvcignLnRpdGxlIGlucHV0Jyk7XG5cdFx0XHRcdC8vIGZvY3VzIHRpdGxlIGZpZWxkIGJ5IGRlZmF1bHQ7IGRlbGF5IHRvIHdhaXQgZm9yIHN0eWxlIHRvIHRha2UgZWZmZWN0XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRpdGxlLmZvY3VzKCk7IH0sIDEwMCk7XG5cdFx0XHRcdHRpdGxlLnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRcdHdpbmRvdy5zY3JvbGwoMSwxKTsgLy8gaU9TIGZpeFxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gbWFrZVRpdGxlRWRpdGFibGUoKSB7XG5cdFx0XHRzdWJoZWFkZXIuY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdHRpdGxlSW5wdXQuZm9jdXMoKTtcblx0XHR9XG5cdFx0c2NvcGUubWFrZVRpdGxlRWRpdGFibGUgPSBtYWtlVGl0bGVFZGl0YWJsZTtcblxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuXHRcdFx0ZWxlbWVudC5maW5kKCdiay1pdGVtJykucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG1ha2VJdGVtRWRpdGFibGUoaXRlbSkge1xuXHRcdFx0aXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcygnaGFzRWRpdGFibGVJdGVtJyk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaXNCa0l0ZW1DaGlsZChub2RlKSB7XG5cdFx0XHR2YXIgaXNDYXJkQ29udGVudCA9IGZhbHNlO1xuXHRcdFx0d2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gZWxlbWVudFswXSkge1xuXHRcdFx0XHRpZiAobm9kZS5ub2RlTmFtZSA9PT0gJ01ELUNBUkQtQ09OVEVOVCcpIHtcblx0XHRcdFx0XHRpc0NhcmRDb250ZW50ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoaXNDYXJkQ29udGVudCAmJiBub2RlLm5vZGVOYW1lID09PSAnQkstSVRFTScpIHtcblx0XHRcdFx0XHRyZXR1cm4gbm9kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnSXRlbU9iamVjdCcsIEl0ZW1PYmplY3QpO1xuXG5mdW5jdGlvbiBJdGVtT2JqZWN0KCkge1xuXG5cdHZhciBpdGVtT2JqZWN0ID0gZnVuY3Rpb24oaWQpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy50aXRsZSA9ICcnO1xuXHRcdHRoaXMubm90ZSA9ICcnO1xuXHRcdHRoaXMuYXNzaWduID0gJyc7XG5cdFx0dGhpcy5kb25lID0gZmFsc2U7XG5cdFx0dGhpcy5sYXN0RWRpdGVkID0gRGF0ZS5ub3coKTtcblx0fVxuXG5cdHJldHVybiBpdGVtT2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnTGlzdE9iamVjdCcsIExpc3RPYmplY3QpO1xuXG5mdW5jdGlvbiBMaXN0T2JqZWN0KEl0ZW1PYmplY3QsIGlkR2VuZXJhdG9yKSB7XG5cblx0dmFyIGxpc3RPYmplY3QgPSBmdW5jdGlvbihpZCwgbmFtZSkge1xuXHRcdHRoaXMuaWQgPSBpZDtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuaXRlbXMgPSBbXTtcblx0XHR0aGlzLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHRcdHRoaXMuZ2V0SXRlbUluZGV4QnlJZCA9IGdldEl0ZW1JbmRleEJ5SWQ7XG5cdFx0dGhpcy5nZXREZXNjcmlwdGlvbiA9IGdldERlc2NyaXB0aW9uO1xuXHR9XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHR0aGlzLml0ZW1zLnVuc2hpZnQobmV3IEl0ZW1PYmplY3QoaWRHZW5lcmF0b3IuZ2V0KDQpKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRJdGVtSW5kZXhCeUlkKGlkKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuaXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICh0aGlzLml0ZW1zW2ldLmlkID09PSBpZCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGVzY3JpcHRpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKCFpdGVtLmRvbmUpIHJldHVybiBpdGVtLnRpdGxlIH0pXG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9KS8vIGdldCBub24tZW1wdHkgaXRlbXNcblx0XHRcdFx0XHRcdC5qb2luKCcsICcpO1xuXHR9XG5cblx0cmV0dXJuIGxpc3RPYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdhbGxMaXN0c1NlcnZpY2UnLCBhbGxMaXN0c1NlcnZpY2UpO1xuXG5mdW5jdGlvbiBhbGxMaXN0c1NlcnZpY2UoTGlzdE9iamVjdCwgJHEsIGlkR2VuZXJhdG9yLCAkcm9vdFNjb3BlLCAkdGltZW91dCkge1xuXG5cdHZhciBsaXN0cyA9IFtdO1xuXHR2YXIgY3VycmVudExpc3RJZCA9IHVuZGVmaW5lZDtcblx0dmFyIGRlbGV0ZVRpbWVyO1xuXHR2YXIgZGVsZXRlRGVmZXI7XG5cdHZhciBkZWxldGluZ0xpc3RJZDtcblx0dmFyIGRlbGV0aW5nSXRlbUlkO1xuXHR2YXIgZmlyZVJlZjtcblx0aWYgKHdpbmRvdy5GaXJlYmFzZSkge1xuXHRcdGZpcmVSZWYgPSBuZXcgRmlyZWJhc2UoXCJodHRwczovL3RvcnJpZC1maXJlLTYyNjYuZmlyZWJhc2Vpby5jb20vXCIpO1xuXHR9XG5cdGxvY2FsUmV0cmlldmUoKTtcblxuXHRyZXR1cm4ge1xuXHRcdGFkZDogYWRkLFxuXHRcdGxpc3RzOiBsaXN0cyxcblx0XHRzZXRDdXJyZW50TGlzdDogc2V0Q3VycmVudExpc3QsXG5cdFx0Z2V0Q3VycmVudExpc3Q6IGdldEN1cnJlbnRMaXN0LFxuXHRcdGRlbGV0ZUxpc3Q6IGRlbGV0ZUxpc3QsXG5cdFx0ZGVsZXRlSXRlbTogZGVsZXRlSXRlbSxcblx0XHRjYW5jZWxEZWxldGU6IGNhbmNlbERlbGV0ZSxcblx0XHRzeW5jQWxsOiBzeW5jQWxsLFxuXHRcdGltcG9ydExpc3Q6IGltcG9ydExpc3QsXG5cdH07XG5cblx0ZnVuY3Rpb24gYWRkKCkge1xuXHRcdGxpc3RzLnVuc2hpZnQoXG5cdFx0XHRuZXcgTGlzdE9iamVjdChpZEdlbmVyYXRvci5nZXQoOCksIFwiTmV3IExpc3QgXCIrKGxpc3RzLmxlbmd0aCsxKSlcblx0XHQpO1xuXHRcdHJldHVybiBsaXN0c1swXTtcblx0fVxuXG5cdGZ1bmN0aW9uIGZpbmRMaXN0SW5kZXhCeUlkKGlkKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPGxpc3RzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAobGlzdHNbaV0uaWQgPT09IGlkKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVJdGVtRGF0YShpdGVtLCB2YWx1ZXMpIHtcblx0XHRpdGVtLmlkID0gdmFsdWVzLmlkO1xuXHRcdGl0ZW0udGl0bGUgPSB2YWx1ZXMudGl0bGU7XG5cdFx0aXRlbS5ub3RlID0gdmFsdWVzLm5vdGU7XG5cdFx0aXRlbS5hc3NpZ24gPSB2YWx1ZXMuYXNzaWduO1xuXHRcdGl0ZW0uYXVkaW8gPSB2YWx1ZXMuYXVkaW87XG5cdFx0aXRlbS5waG90byA9IHZhbHVlcy5waG90bztcblx0XHRpZiAoaXRlbS5waG90byA9PSBcIi4vaW1nL2xvYWRpbmctYnViYmxlcy5zdmdcIikge1xuXHRcdFx0aXRlbS5waG90byA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0aXRlbS5kb25lID0gdmFsdWVzLmRvbmU7XG5cdFx0aXRlbS5sYXN0RWRpdGVkID0gdmFsdWVzLmxhc3RFZGl0ZWQ7XG5cdFx0aXRlbS5kZWxldGluZyA9IHZhbHVlcy5kZWxldGluZztcblx0fVxuXG5cdGZ1bmN0aW9uIGdldERhdGFPbmx5SXRlbShvcmlnaW5hbCkge1xuXHRcdHZhciBpdGVtID0ge307XG5cdFx0dXBkYXRlSXRlbURhdGEoaXRlbSwgb3JpZ2luYWwpO1xuXHRcdGZvciAodmFyIGtleSBpbiBpdGVtKSB7XG5cdFx0XHRpZiAoaXRlbVtrZXldID09PSBudWxsIHx8IGl0ZW1ba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGRlbGV0ZSBpdGVtW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBpdGVtO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGF0YU9ubHlMaXN0KGlkKSB7XG5cdFx0dmFyIGxpc3QgPSBsaXN0c1tmaW5kTGlzdEluZGV4QnlJZChpZCldO1xuXHRcdHZhciB0ZXh0T25seUxpc3QgPSBbXTtcblx0XHRmb3IgKHZhciBpPTA7IGk8bGlzdC5pdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGV4dE9ubHlMaXN0LnB1c2goZ2V0RGF0YU9ubHlJdGVtKGxpc3QuaXRlbXNbaV0pKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRleHRPbmx5TGlzdDtcblx0fVxuXG5cdGZ1bmN0aW9uIGRlbGV0ZUxpc3QoaWQsIGltbWVkaWF0ZSkge1xuXHRcdC8vIFNldCBsaXN0IHN0YXR1cyBmb3IgZGVsZXRpb25cblx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChpZCk7XG5cdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdGxpc3RzW2luZGV4XS5kZWxldGluZyA9IHRydWU7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gJyc7XG5cdFx0fVxuXHRcdC8vIGRlbGV0ZSBkZWxheVxuXHRcdHZhciBkZWxheSA9IDUwMDA7XG5cdFx0aWYgKCFpbW1lZGlhdGUpIGRlbGF5ID0gMDtcblx0XHRkZWxldGluZ0xpc3RJZCA9IGlkO1xuXHRcdGRlbGV0ZURlZmVyID0gJHEuZGVmZXIoKTtcblx0XHRkZWxldGVUaW1lciA9ICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gZ2V0IGluZGV4IGFnYWluLCBhcyBpdCBtYXkgaGF2ZSBjaGFuZ2VkXG5cdFx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChpZCk7XG5cdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRsaXN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRkZWxldGVEZWZlci5yZXNvbHZlKCdkZWxldGVkJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkZWxldGVEZWZlci5yZWplY3QoJ2xpc3ROb3RGb3VuZCcpO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdMaXN0SWQgPSB1bmRlZmluZWQ7XG5cdFx0fSwgZGVsYXkpO1xuXHRcdHJldHVybiBkZWxldGVEZWZlci5wcm9taXNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlSXRlbShpZCwgaW1tZWRpYXRlKSB7XG5cdFx0Ly8gU2V0IGxpc3Qgc3RhdHVzIGZvciBkZWxldGlvblxuXHRcdHZhciBpbmRleCA9IGdldEN1cnJlbnRMaXN0KCkuZ2V0SXRlbUluZGV4QnlJZChpZCk7XG5cdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdGdldEN1cnJlbnRMaXN0KCkuaXRlbXNbaW5kZXhdLmRlbGV0aW5nID0gdHJ1ZTtcblx0XHR9XG5cdFx0Ly8gZGVsZXRlIGRlbGF5XG5cdFx0ZGVsZXRpbmdJdGVtSWQgPSBpZDtcblx0XHRkZWxldGluZ0xpc3RJZCA9IGdldEN1cnJlbnRMaXN0KCkuaWQ7IC8vIHN0b3JlIGxpc3QgaWQgaW4gY2FzZSBjdXJyZW50IGxpc3QgaXMgY2hhbmdlZFxuXHRcdGRlbGV0ZURlZmVyID0gJHEuZGVmZXIoKTtcblx0XHR2YXIgZGVsYXkgPSA1MDAwO1xuXHRcdGlmICghaW1tZWRpYXRlKSBkZWxheSA9IDA7XG5cdFx0ZGVsZXRlVGltZXIgPSAkdGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdC8vIGdldCBpbmRleCBhZ2FpbiwgYXMgaXQgbWF5IGhhdmUgY2hhbmdlZFxuXHRcdFx0dmFyIGxpc3RJbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGRlbGV0aW5nTGlzdElkKTtcblx0XHRcdGlmIChsaXN0SW5kZXggPj0gMCkge1xuXHRcdFx0XHR2YXIgaW5kZXggPSBsaXN0c1tsaXN0SW5kZXhdLmdldEl0ZW1JbmRleEJ5SWQoaWQpO1xuXHRcdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRcdGxpc3RzW2xpc3RJbmRleF0uaXRlbXMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0XHRkZWxldGVEZWZlci5yZXNvbHZlKCdkZWxldGVkJyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdsaXN0Tm90Rm91bmQnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdJdGVtSWQgPSB1bmRlZmluZWQ7XG5cdFx0fSwgZGVsYXkpO1xuXHRcdHJldHVybiBkZWxldGVEZWZlci5wcm9taXNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2FuY2VsRGVsZXRlKCkge1xuXHRcdCR0aW1lb3V0LmNhbmNlbChkZWxldGVUaW1lcik7XG5cdFx0aWYgKGRlbGV0aW5nSXRlbUlkKSB7XG5cdFx0XHR2YXIgbGlzdCA9IGxpc3RzW2ZpbmRMaXN0SW5kZXhCeUlkKGRlbGV0aW5nTGlzdElkKV07XG5cdFx0XHR2YXIgaW5kZXggPSBsaXN0LmdldEl0ZW1JbmRleEJ5SWQoZGVsZXRpbmdJZCk7XG5cdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRsaXN0Lml0ZW1zW2luZGV4XS5kZWxldGluZyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdJdGVtSWQgPSB1bmRlZmluZWQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBpbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGRlbGV0aW5nSWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdHNbaW5kZXhdLmRlbGV0aW5nID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGluZ0xpc3RJZCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdkZWxldGVDYW5jZWxsZWQnKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNldEN1cnJlbnRMaXN0KGxpc3QpIHtcblx0XHRpZiAodHlwZW9mIGxpc3QgPT09ICdudW1iZXInKSB7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gZmluZExpc3RJbmRleEJ5SWQobGlzdCk7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgbGlzdCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGN1cnJlbnRMaXN0SWQgPSBsaXN0LmlkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ3Vua25vd24gaW5wdXQgZm9yIGxpc3Q6ICcrIHR5cGVvZiBsaXN0KTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRDdXJyZW50TGlzdCgpIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIGxpc3RzW2ZpbmRMaXN0SW5kZXhCeUlkKGN1cnJlbnRMaXN0SWQpXTtcblx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdGNvbnNvbGUud2FybignTGlzdCBub3QgZm91bmQuIElEOiAnK2N1cnJlbnRMaXN0SWQpO1xuXHRcdFx0Y29uc29sZS53YXJuKGxpc3RzKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBpbXBvcnRMaXN0KGlkKSB7XG5cdFx0dmFyIGxpc3Q7XG5cdFx0dmFyIGxvY2FsSW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChpZCk7XG5cdFx0aWYgKGxvY2FsSW5kZXggPCAwKSB7XG5cdFx0XHRsaXN0cy51bnNoaWZ0KG5ldyBMaXN0T2JqZWN0KGlkLCAnU3luY2hyb25pc2luZy4uLicpKVxuXHRcdFx0bGlzdCA9IGxpc3RzWzBdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsaXN0ID0gbGlzdHNbbG9jYWxJbmRleF07XG5cdFx0fVxuXHRcdGlmICh3aW5kb3cuRmlyZWJhc2UpIHtcblx0XHRcdHZhciBsaXN0UmVmID0gZmlyZVJlZi5jaGlsZChpZCk7XG5cdFx0XHRsaXN0UmVmLm9uY2UoJ3ZhbHVlJywgZnVuY3Rpb24oc25hcHNob3QpIHtcblx0XHRcdFx0aWYgKHNuYXBzaG90LnZhbCgpKSB7IC8vIGlmIGxpc3QgZXhpc3RzXG5cdFx0XHRcdFx0bGlzdC5uYW1lID0gc25hcHNob3QudmFsKCkubmFtZTtcblx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2goc25hcHNob3QudmFsKCkuaXRlbXMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0XHRcdHVwZGF0ZUl0ZW0odmFsdWUpO1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0bGlzdFJlZi5jaGlsZCgnbmFtZScpLm9uKCd2YWx1ZScsIGZ1bmN0aW9uKHNuYXBzaG90KSB7XG5cdFx0XHRcdFx0XHRsaXN0Lm5hbWUgPSBzbmFwc2hvdC52YWwoKTtcblx0XHRcdFx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnZmlyZWJhc2VTeW5jJyk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0bGlzdFJlZi5jaGlsZCgnaXRlbXMnKS5vbignY2hpbGRfY2hhbmdlZCcsIGZ1bmN0aW9uKHNuYXBzaG90KSB7XG5cdFx0XHRcdFx0XHR1cGRhdGVJdGVtKHNuYXBzaG90LnZhbCgpKVxuXHRcdFx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdmaXJlYmFzZVN5bmMnKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRsaXN0Lm5hbWUgPSAnTmV3IExpc3QgJytsaXN0cy5sZW5ndGg7XG5cdFx0XHRcdH1cblx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdmaXJlYmFzZVN5bmMnKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRmdW5jdGlvbiB1cGRhdGVJdGVtKGl0ZW0pIHtcblx0XHRcdHZhciBsb2NhbEl0ZW1JbmRleCA9IGxpc3QuZ2V0SXRlbUluZGV4QnlJZChpdGVtLmlkKTtcblx0XHRcdGlmIChsb2NhbEl0ZW1JbmRleCA8IDApIHtcblx0XHRcdFx0bGlzdC5pdGVtcy5wdXNoKGdldERhdGFPbmx5SXRlbShpdGVtKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAobGlzdC5pdGVtc1tsb2NhbEl0ZW1JbmRleF0gIT0gaXRlbSkge1xuXHRcdFx0XHRcdHVwZGF0ZUl0ZW1EYXRhKGxpc3QuaXRlbXNbbG9jYWxJdGVtSW5kZXhdLCBpdGVtKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGxvY2FsUmV0cmlldmUoKSB7XG5cdFx0dmFyIHJldHJpZXZlZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdCYXNrZXRzJyk7XG5cdFx0aWYgKHJldHJpZXZlZCkge1xuXHRcdFx0dmFyIHBhcnNlZCA9IEpTT04ucGFyc2UocmV0cmlldmVkKTtcblx0XHRcdGZvciAodmFyIGk9MDsgaTxwYXJzZWQubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKCFwYXJzZWRbaV0uZGVsZXRpbmcpIHtcblx0XHRcdFx0XHR2YXIgbGlzdCA9IG5ldyBMaXN0T2JqZWN0KHBhcnNlZFtpXS5pZCwgcGFyc2VkW2ldLm5hbWUpO1xuXHRcdFx0XHRcdGxpc3QuaXRlbXMgPSBwYXJzZWRbaV0uaXRlbXM7XG5cdFx0XHRcdFx0bGlzdHMucHVzaChsaXN0KTtcblx0XHRcdFx0XHRpbXBvcnRMaXN0KGxpc3QuaWQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbG9jYWxTYXZlKCkge1xuXHRcdHZhciBqc29uID0gSlNPTi5zdHJpbmdpZnkobGlzdHMpO1xuXHRcdGlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnQmFza2V0cycpICE9PSBqc29uKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnQmFza2V0cycsIGpzb24pO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJ0Nhbm5vdCBzdG9yZSBkYXRhIHRvIGxvY2FsIHN0b3JhZ2U6ICcrZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIHN5bmNBbGwoKSB7XG5cdFx0aWYgKGxvY2FsU2F2ZSgpKSB7XG5cdFx0XHRzeW5jQ3VycmVudExpc3QoKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBzeW5jQ3VycmVudExpc3QoKSB7XG5cdFx0aWYgKGdldEN1cnJlbnRMaXN0KCkpIHtcblx0XHRcdHZhciBpdGVtcyA9IGdldERhdGFPbmx5TGlzdChnZXRDdXJyZW50TGlzdCgpLmlkKTtcblx0XHRcdGlmICh3aW5kb3cuRmlyZWJhc2UpIHtcblx0XHRcdFx0ZmlyZVJlZi5jaGlsZChnZXRDdXJyZW50TGlzdCgpLmlkKS5jaGlsZCgnbmFtZScpLnNldChnZXRDdXJyZW50TGlzdCgpLm5hbWUpO1xuXHRcdFx0XHRmb3IgKHZhciBpPTA7IGk8aXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRmaXJlUmVmLmNoaWxkKGdldEN1cnJlbnRMaXN0KCkuaWQpLmNoaWxkKCdpdGVtcycpLmNoaWxkKGl0ZW1zW2ldLmlkKS51cGRhdGUoaXRlbXNbaV0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnaWRHZW5lcmF0b3InLCBpZEdlbmVyYXRvcik7XG5cbmZ1bmN0aW9uIGlkR2VuZXJhdG9yKCkge1xuXG5cdHJldHVybiB7XG5cdFx0Z2V0OiBnZXRVbmlxSWQsXG5cdH07XG5cblx0ZnVuY3Rpb24gZ2V0VW5pcUlkKGxlbmd0aCkge1xuXHRcdHJldHVybiAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKk1hdGgucG93KDM2LGxlbmd0aCkpLnRvU3RyaW5nKDM2KSkuc2xpY2UoLWxlbmd0aCk7XG5cdH1cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdzaGFyZVNlcnZpY2UnLCBzaGFyZVNlcnZpY2UpO1xuXG5mdW5jdGlvbiBzaGFyZVNlcnZpY2UoKSB7XG5cblx0cmV0dXJuIHtcblx0XHRnZXRMaW5rOiBnZXRMaW5rLFxuXHRcdHdyaXRlRW1haWw6IHdyaXRlRW1haWwsXG5cdH07XG5cblx0ZnVuY3Rpb24gZ2V0TGluayhsaXN0KSB7XG5cdFx0cmV0dXJuIGxvY2F0aW9uLm9yaWdpbitsb2NhdGlvbi5wYXRobmFtZStcIiNsaXN0PVwiK2xpc3QuaWQ7XG5cdH1cblxuXHRmdW5jdGlvbiB3cml0ZUVtYWlsKGxpc3QpIHtcblx0XHR2YXIgcmVzdWx0cyA9IFtdO1xuXHRcdHJlc3VsdHMucHVzaChcIkFkZCB0aGlzIGxpc3QgdG8geW91ciBCYXNrZXQgYXQgXCIrZ2V0TGluayhsaXN0KSk7XG5cdFx0cmVzdWx0cy5wdXNoKFwiPT09PT09PT09PT09PT09PT09PT1cIik7XG5cdFx0cmVzdWx0cy5wdXNoKGxpc3QubmFtZSk7XG5cdFx0cmVzdWx0cy5wdXNoKFwiPT09PT09PT09PT09PT09PT09PT1cIik7XG5cdFx0cmVzdWx0cy5wdXNoKFwiXCIpO1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0Lml0ZW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgaXRlbSA9IGxpc3QuaXRlbXNbaV07XG5cdFx0XHRyZXN1bHRzLnB1c2goaXRlbS50aXRsZSk7XG5cdFx0XHRyZXN1bHRzLnB1c2goXCJcIik7XG5cdFx0XHRpZiAoaXRlbS5ub3RlKSByZXN1bHRzLnB1c2goJ05vdGVzOiAnK2l0ZW0ubm90ZSk7XG5cdFx0XHRpZiAoaXRlbS5hc3NpZ24pIHJlc3VsdHMucHVzaCgnQXNzaWduZWQgdG8gJytpdGVtLmFzc2lnbik7XG5cdFx0XHRyZXN1bHRzLnB1c2goXCItLS0tLS0tLS0tLS0tLS0tLS0tLVwiKTtcblx0XHRcdHJlc3VsdHMucHVzaChcIlwiKTtcblx0XHR9XG5cdFx0dmFyIGJvZHkgPSByZXN1bHRzLmpvaW4oJ1xcbicpOyAvLyBuZXcgbGluZVxuXHRcdHJldHVybiAnbWFpbHRvOj9ib2R5PScrZW5jb2RlVVJJQ29tcG9uZW50KGJvZHkpO1xuXHR9XG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9