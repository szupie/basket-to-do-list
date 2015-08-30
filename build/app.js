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
			photoInput.click();
			photoInput.value = null;
			fileDefer = $q.defer();
			scope.Items.getPhoto(attrs.itemId, fileDefer.promise);
		}
		function photoPromptClose() {
			if (waitingInput > 0) {
				waitingInput = 0;
				fileDefer.notify('noImage');
			} else {
				waitingInput++;
				fileDefer.notify('getting');
			}
		}
		photoInput.addEventListener('change', function(e) {
			var file = e.target.files[0];
			waitingInput = 0;
			if (file) {
				var reader = new FileReader();
				reader.onloadend = function() {
					fileDefer.resolve(reader.result);
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
	}

	return itemObject;

}
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
			if (this.items[i].id == id) {
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
ListObject.$inject = ["ItemObject"];
angular
	.module('app')
	.factory('allListsService', allListsService);

function allListsService(ListObject, $q) {

	var lists = [];
	var currentListId = undefined;
	var deleteTimer;
	var deleteDefer;
	var deletingListId;
	var deletingItemId;

	return {
		add: add,
		lists: lists,
		setCurrentList: setCurrentList,
		getCurrentList: getCurrentList,
		deleteList: deleteList,
		deleteItem: deleteItem,
		cancelDelete: cancelDelete,
		localRetrieve: localRetrieve,
		localSave: localSave
	};

	function add() {
		lists.unshift(
			new ListObject(getUniqId(), "New List "+(lists.length+1))
		);
		return lists[0];
	}

	function getUniqId() {
		var length = 8;
		return (Math.floor(Math.random()*Math.pow(36,length)).toString(36)).slice(-length);
	}

	function findListIndexById(id) {
		for (var i=0; i<lists.length; i++) {
			if (lists[i].id === id) {
				return i;
			}
		}
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

	function localRetrieve() {
		var retrieved = localStorage.getItem('Baskets');
		if (retrieved) {
			var parsed = JSON.parse(retrieved);
			for (var i=0; i<parsed.length; i++) {
				var list = new ListObject(parsed[i].id, parsed[i].name);
				list.items = parsed[i].items;
				lists.push(list);
			}
		}
	}

	function localSave() {
		localStorage.setItem('Baskets', JSON.stringify(lists));
	}
}
allListsService.$inject = ["ListObject", "$q"];
angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($mdSidenav, $mdMedia, allListsService, $mdToast, support) {
	var vm = this;
	vm.toggleListsView = toggleListsView;
	vm.closeListsView = closeListsView;
	vm.deleteListById = deleteListById;
	vm.support = support;

	allListsService.localRetrieve();
	setInterval(allListsService.localSave, 5000);

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
BasketController.$inject = ["$mdSidenav", "$mdMedia", "allListsService", "$mdToast", "support"];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImRpcmVjdGl2ZXMvYmtJdGVtLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RJbmZvLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RWaWV3LmpzIiwic2VydmljZXMvSXRlbU9iamVjdC5qcyIsInNlcnZpY2VzL0xpc3RPYmplY3QuanMiLCJzZXJ2aWNlcy9hbGxMaXN0c1NlcnZpY2UuanMiLCJjb250cm9sbGVycy9CYXNrZXRDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvSXRlbXNDb250cm9sbGVyLmpzIiwiY29udHJvbGxlcnMvTGlzdHNDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUksT0FBTyxZQUFZO0NBQ3RCLGNBQWM7OztBQUdmLElBQUksTUFBTSxRQUFRLE9BQU8sT0FBTyxDQUFDO0tBQzVCLFNBQVMsV0FBVyxDQUFDLFlBQVksY0FBYztBQ0xwRDtFQUNFLE9BQU87RUFDUCxVQUFVLFVBQVU7O0FBRXRCLFNBQVMsT0FBTyxJQUFJO0NBQ25CLElBQUksWUFBWTtFQUNmLFVBQVU7RUFDVixNQUFNO0VBQ04sYUFBYTtFQUNiLFlBQVk7RUFDWixjQUFjOzs7Q0FHZixPQUFPOztDQUVQLFNBQVMsS0FBSyxPQUFPLFNBQVMsT0FBTzs7RUFFcEMsUUFBUSxHQUFHLFNBQVMsVUFBVSxHQUFHO0dBQ2hDOzs7RUFHRCxJQUFJLFdBQVcsU0FBUyxjQUFjO0VBQ3RDLElBQUk7OztFQUdKLFNBQVMsa0JBQWtCO0dBQzFCLFFBQVEsU0FBUztHQUNqQixZQUFZO0dBQ1osV0FBVyxXQUFXLEVBQUUsWUFBWSxZQUFZO0dBQ2hELFNBQVMsVUFBVSxJQUFJOzs7O0VBSXhCLElBQUksYUFBYSxRQUFRLEdBQUcsY0FBYztFQUMxQyxJQUFJO0VBQ0osSUFBSSxlQUFlO0VBQ25CLFNBQVMsY0FBYztHQUN0QixXQUFXO0dBQ1gsV0FBVyxRQUFRO0dBQ25CLFlBQVksR0FBRztHQUNmLE1BQU0sTUFBTSxTQUFTLE1BQU0sUUFBUSxVQUFV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QUFXLE9BQU87RUFDMUIsSUFBSSxXQUFXLGdCQUFnQixpQkFBaUI7RUFDaEQsSUFBSSxRQUFRLENBQUM7O0VBRWIsS0FBSyxJQUFJLEVBQUUsR0FBRyxFQUFFLFNBQVMsUUFBUSxLQUFLO0dBQ3JDLElBQUksT0FBTyxTQUFTLEdBQUc7R0FDdkIsSUFBSSxRQUFRLE1BQU0sUUFBUSxRQUFRLEdBQUc7SUFDcEMsTUFBTSxLQUFLOzs7O0VBSWIsSUFBSSxVQUFVLE1BQU0sT0FBTyxTQUFTLE1BQU07R0FDekMsT0FBTyxLQUFLLGNBQWMsUUFBUSxNQUFNLG1CQUFtQjs7RUFFNUQsT0FBTzs7O0NBR1IsU0FBUyxTQUFTLElBQUksU0FBUztFQUM5QixJQUFJLE9BQU8sZ0JBQWdCO0VBQzNCLElBQUksUUFBUSxLQUFLLGlCQUFpQjtFQUNsQyxJQUFJLGNBQWM7O0VBRWxCLFFBQVEsS0FBSyxTQUFTLEtBQUs7R0FDMUIsS0FBSyxNQUFNLE9BQU8sUUFBUTtLQUN4QjtJQUNELFNBQVMsUUFBUTtHQUNsQixJQUFJLFdBQVcsV0FBVztJQUN6QixLQUFLLE1BQU0sT0FBTyxRQUFRO1VBQ3BCLElBQUksV0FBVyxXQUFXO0lBQ2hDLElBQUksS0FBSyxNQUFNLE9BQU8sVUFBVSxhQUFhO0tBQzVDLEtBQUssTUFBTSxPQUFPLFFBQVE7Ozs7Ozs7c0VBTTlCO0FDMUVEO0VBQ0UsT0FBTztFQUNQLFdBQVcsbUJBQW1COztBQUVoQyxTQUFTLGdCQUFnQixpQkFBaUI7O0NBRXpDLElBQUksS0FBSzs7Q0FFVCxHQUFHLFFBQVEsZ0JBQWdCOztDQUUzQixHQUFHLFVBQVUsV0FBVztFQUN2QixnQkFBZ0IsZUFBZSxnQkFBZ0I7OztDQUdoRCxHQUFHLGNBQWMsZ0JBQWdCOzs7OENBRWpDIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImlmICh3aW5kb3cuRmlsZVJlYWRlcikge1xuXHRmaWxlU3VwcG9ydCA9IHRydWU7XG59XG5cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyduZ01hdGVyaWFsJ10pXG5cdFx0XHRcdC5jb25zdGFudCgnc3VwcG9ydCcsIHtmaWxlUmVhZGVyOiBmaWxlU3VwcG9ydH0pOyIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtJdGVtJywgYmtJdGVtKTtcblxuZnVuY3Rpb24gYmtJdGVtKCRxKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrSXRlbS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0Ly8gRW5kIGN1c3RvbSBlZGl0IG1vZGUgb24gY2xpY2tcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRkZXNlbGVjdCgpO1xuXHRcdH0pO1xuXG5cdFx0dmFyIGxpc3RWaWV3ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2JrLWxpc3Qtdmlld10nKTtcblx0XHR2YXIgYXNzaWduSW5wdXQ7XG5cblx0XHQvLyBFbnRlciBhc3NpZ24gbW9kZVxuXHRcdGZ1bmN0aW9uIGVudGVyQXNzaWduTW9kZSgpIHtcblx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGFzc2lnbklucHV0LnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBhc3NpZ25JbnB1dC5mb2N1cygpOyB9LCAxMDApOyAvLyBkZWxheSB0byB3YWl0IGZvciBjbGFzc2VzIHRvIGFwcGx5XG5cdFx0XHRsaXN0Vmlldy5jbGFzc0xpc3QuYWRkKFwiaGFzRWRpdGFibGVJdGVtXCIpO1xuXHRcdH1cblxuXHRcdC8vIFBob3RvIHNlbGVjdFxuXHRcdHZhciBwaG90b0lucHV0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdpbnB1dC5waG90bycpO1xuXHRcdHZhciBmaWxlRGVmZXI7XG5cdFx0dmFyIHdhaXRpbmdJbnB1dCA9IDA7XG5cdFx0ZnVuY3Rpb24gcGhvdG9Qcm9tcHQoKSB7XG5cdFx0XHRwaG90b0lucHV0LmNsaWNrKCk7XG5cdFx0XHRwaG90b0lucHV0LnZhbHVlID0gbnVsbDtcblx0XHRcdGZpbGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0XHRzY29wZS5JdGVtcy5nZXRQaG90byhhdHRycy5pdGVtSWQsIGZpbGVEZWZlci5wcm9taXNlKTtcblx0XHR9XG5cdFx0ZnVuY3Rpb24gcGhvdG9Qcm9tcHRDbG9zZSgpIHtcblx0XHRcdGlmICh3YWl0aW5nSW5wdXQgPiAwKSB7XG5cdFx0XHRcdHdhaXRpbmdJbnB1dCA9IDA7XG5cdFx0XHRcdGZpbGVEZWZlci5ub3RpZnkoJ25vSW1hZ2UnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHdhaXRpbmdJbnB1dCsrO1xuXHRcdFx0XHRmaWxlRGVmZXIubm90aWZ5KCdnZXR0aW5nJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHBob3RvSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIGZpbGUgPSBlLnRhcmdldC5maWxlc1swXTtcblx0XHRcdHdhaXRpbmdJbnB1dCA9IDA7XG5cdFx0XHRpZiAoZmlsZSkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblx0XHRcdFx0cmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGZpbGVEZWZlci5yZXNvbHZlKHJlYWRlci5yZXN1bHQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignaW1nLnBob3RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZWxlbWVudC50b2dnbGVDbGFzcygncGhvdG9WaWV3Jyk7XG5cdFx0fSk7XG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWVkaWEnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKCdwaG90b1ZpZXcnKTtcblx0XHR9KTtcblxuXHRcdC8vIFRvZ2dsZSBpdGVtIGRvbmVuZXNzXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24uZG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50LnRvZ2dsZUNsYXNzKFwiZG9uZVwiKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlXCIpO1xuXHRcdFx0bGlzdFZpZXcuY2xhc3NMaXN0LnJlbW92ZShcImhhc0VkaXRhYmxlSXRlbVwiKTtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cdFx0XG5cdFx0Ly8gUmVhdHRhY2ggbGlzdGVuZXIgdG8gYnV0dG9ucyBvbiBzY3JlZW4gc2l6ZSBjaGFuZ2Vcblx0XHR2YXIgYXNzaWduQnV0dG9uID0gZ2V0QXNzaWduQnV0dG9uKCk7XG5cdFx0dmFyIHBob3RvQnV0dG9uID0gZ2V0UGhvdG9CdXR0b24oKTtcblx0XHRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBzY29wZS5NYWluLiRtZE1lZGlhKCdtZCcpOyB9LCBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChhc3NpZ25CdXR0b24pIHtcblx0XHRcdFx0YXNzaWduQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJBc3NpZ25Nb2RlKTtcblx0XHRcdH1cblx0XHRcdGFzc2lnbkJ1dHRvbiA9IGdldEFzc2lnbkJ1dHRvbigpO1xuXHRcdFx0aWYgKGFzc2lnbkJ1dHRvbikge1xuXHRcdFx0XHRhc3NpZ25CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlbnRlckFzc2lnbk1vZGUpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHBob3RvQnV0dG9uKSB7XG5cdFx0XHRcdHBob3RvQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcGhvdG9Qcm9tcHQpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCBwaG90b1Byb21wdENsb3NlKTtcblx0XHRcdH1cblx0XHRcdHBob3RvQnV0dG9uID0gZ2V0UGhvdG9CdXR0b24oKTtcblx0XHRcdGlmIChwaG90b0J1dHRvbikge1xuXHRcdFx0XHRwaG90b0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHBob3RvUHJvbXB0KTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgcGhvdG9Qcm9tcHRDbG9zZSk7XG5cdFx0XHR9XG5cdFx0XHQvLyBQcmV2ZW50IGVuZGluZyBlZGl0IG1vZGUgd2hlbiBjbGlja2luZyBidXR0b25cblx0XHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSk7XG5cdFx0XHQvLyBpT1MgZml4IHRvIGRlc2VsZWN0IGJ1dHRvblxuXHRcdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbigndG91Y2hzdGFydCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBEZWxheSBxdWVyeWluZyBmb3IgaW5wdXQgdW50aWwgZWxlbWVudCBjcmVhdGVkXG5cdFx0XHRhc3NpZ25JbnB1dCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignbWQtYXV0b2NvbXBsZXRlLmFzc2lnbiBpbnB1dCcpO1xuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gc2VsZWN0aW5nIGlucHV0XG5cdFx0XHRlbGVtZW50LmZpbmQoJ21kLWlucHV0LWNvbnRhaW5lcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdH0sIDEwMCk7XG5cblx0XHQvLyBMZWF2ZSBjdXN0b20gZWRpdCBtb2RlXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3QoKSB7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKFwiZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ2V0QXNzaWduQnV0dG9uKCkge1xuXHRcdFx0cmV0dXJuIGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmFzc2lnbicpO1xuXHRcdH1cblx0XHRmdW5jdGlvbiBnZXRQaG90b0J1dHRvbigpIHtcblx0XHRcdHJldHVybiBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5waG90bycpO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RJbmZvJywgYmtMaXN0SW5mbyk7XG5cbmZ1bmN0aW9uIGJrTGlzdEluZm8oYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrTGlzdEluZm8uaHRtbCdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHsgYWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KHNjb3BlLmxpc3QpIH0pO1xuXHRcdH0pO1xuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RWaWV3JywgYmtMaXN0Vmlldyk7XG5cbmZ1bmN0aW9uIGJrTGlzdFZpZXcoKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cblx0XHR2YXIgc3ViaGVhZGVyID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJyk7XG5cdFx0dmFyIHRpdGxlSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgaW5wdXQnKTtcblxuXHRcdC8vIENsaWNrIG91dHNpZGUgb2YgaXRlbXMgdG8gZXhpdCBlZGl0IG1vZGVcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRpZiAoZS50YXJnZXQpIHtcblx0XHRcdFx0dmFyIGJrSXRlbSA9IGlzQmtJdGVtQ2hpbGQoZS50YXJnZXQpO1xuXHRcdFx0XHRpZiAoYmtJdGVtKSB7XG5cdFx0XHRcdFx0bWFrZUl0ZW1FZGl0YWJsZShia0l0ZW0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBQcmV2ZW50IGxvc2luZyBmb2N1cyBvbiBidXR0b24gY2xpY2tzXG5cdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gTWFrZSB0aXRsZSBlZGl0YWJsZSBvbiBjbGlja1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlciAubmFtZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRtYWtlVGl0bGVFZGl0YWJsZSgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gRXhpdCB0aXRsZSBlZGl0IG1vZGUgb24gdGl0bGUgaW5wdXQgbG9zaW5nIGZvY3VzXG5cdFx0dGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXInKS5jbGFzc0xpc3QucmVtb3ZlKCdlZGl0YWJsZScpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gU3dpdGNoIGZvY3VzIHRvIG5ldyBpdGVtXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24ubmV3SXRlbScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIG5ld0l0ZW0gPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2JrLWl0ZW0nKTtcblx0XHRcdGlmIChuZXdJdGVtKSB7XG5cdFx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUobmV3SXRlbSk7XG5cdFx0XHRcdHZhciB0aXRsZSA9IG5ld0l0ZW0ucXVlcnlTZWxlY3RvcignLnRpdGxlIGlucHV0Jyk7XG5cdFx0XHRcdC8vIGZvY3VzIHRpdGxlIGZpZWxkIGJ5IGRlZmF1bHQ7IGRlbGF5IHRvIHdhaXQgZm9yIHN0eWxlIHRvIHRha2UgZWZmZWN0XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRpdGxlLmZvY3VzKCk7IH0sIDEwMCk7XG5cdFx0XHRcdHRpdGxlLnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRcdHdpbmRvdy5zY3JvbGwoMSwxKTsgLy8gaU9TIGZpeFxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gbWFrZVRpdGxlRWRpdGFibGUoKSB7XG5cdFx0XHRzdWJoZWFkZXIuY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdHRpdGxlSW5wdXQuZm9jdXMoKTtcblx0XHR9XG5cdFx0c2NvcGUubWFrZVRpdGxlRWRpdGFibGUgPSBtYWtlVGl0bGVFZGl0YWJsZTtcblxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuXHRcdFx0ZWxlbWVudC5maW5kKCdiay1pdGVtJykucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG1ha2VJdGVtRWRpdGFibGUoaXRlbSkge1xuXHRcdFx0aXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcygnaGFzRWRpdGFibGVJdGVtJyk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaXNCa0l0ZW1DaGlsZChub2RlKSB7XG5cdFx0XHR2YXIgaXNDYXJkQ29udGVudCA9IGZhbHNlO1xuXHRcdFx0d2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gZWxlbWVudFswXSkge1xuXHRcdFx0XHRpZiAobm9kZS5ub2RlTmFtZSA9PT0gJ01ELUNBUkQtQ09OVEVOVCcpIHtcblx0XHRcdFx0XHRpc0NhcmRDb250ZW50ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoaXNDYXJkQ29udGVudCAmJiBub2RlLm5vZGVOYW1lID09PSAnQkstSVRFTScpIHtcblx0XHRcdFx0XHRyZXR1cm4gbm9kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnSXRlbU9iamVjdCcsIEl0ZW1PYmplY3QpO1xuXG5mdW5jdGlvbiBJdGVtT2JqZWN0KCkge1xuXG5cdHZhciBpdGVtT2JqZWN0ID0gZnVuY3Rpb24oaWQpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy50aXRsZSA9ICcnO1xuXHRcdHRoaXMubm90ZSA9ICcnO1xuXHRcdHRoaXMuYXNzaWduID0gJyc7XG5cdFx0dGhpcy5kb25lID0gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4gaXRlbU9iamVjdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0xpc3RPYmplY3QnLCBMaXN0T2JqZWN0KTtcblxuZnVuY3Rpb24gTGlzdE9iamVjdChJdGVtT2JqZWN0KSB7XG5cblx0dmFyIGxpc3RPYmplY3QgPSBmdW5jdGlvbihpZCwgbmFtZSkge1xuXHRcdHRoaXMuaWQgPSBpZDtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuaXRlbXMgPSBbXTtcblx0XHR0aGlzLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHRcdHRoaXMuZ2V0SXRlbUluZGV4QnlJZCA9IGdldEl0ZW1JbmRleEJ5SWQ7XG5cdFx0dGhpcy5nZXREZXNjcmlwdGlvbiA9IGdldERlc2NyaXB0aW9uO1xuXHR9XG5cdHZhciBuZXh0SXRlbUlkID0gMDtcblxuXHRmdW5jdGlvbiBhZGRJdGVtKCkge1xuXHRcdHRoaXMuaXRlbXMudW5zaGlmdChuZXcgSXRlbU9iamVjdChuZXh0SXRlbUlkKyspKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldEl0ZW1JbmRleEJ5SWQoaWQpIHtcblx0XHRmb3IgKHZhciBpPTA7IGk8dGhpcy5pdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKHRoaXMuaXRlbXNbaV0uaWQgPT0gaWQpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGVzY3JpcHRpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKCFpdGVtLmRvbmUpIHJldHVybiBpdGVtLnRpdGxlIH0pXG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9KS8vIGdldCBub24tZW1wdHkgaXRlbXNcblx0XHRcdFx0XHRcdC5qb2luKCcsICcpO1xuXHR9XG5cblx0cmV0dXJuIGxpc3RPYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdhbGxMaXN0c1NlcnZpY2UnLCBhbGxMaXN0c1NlcnZpY2UpO1xuXG5mdW5jdGlvbiBhbGxMaXN0c1NlcnZpY2UoTGlzdE9iamVjdCwgJHEpIHtcblxuXHR2YXIgbGlzdHMgPSBbXTtcblx0dmFyIGN1cnJlbnRMaXN0SWQgPSB1bmRlZmluZWQ7XG5cdHZhciBkZWxldGVUaW1lcjtcblx0dmFyIGRlbGV0ZURlZmVyO1xuXHR2YXIgZGVsZXRpbmdMaXN0SWQ7XG5cdHZhciBkZWxldGluZ0l0ZW1JZDtcblxuXHRyZXR1cm4ge1xuXHRcdGFkZDogYWRkLFxuXHRcdGxpc3RzOiBsaXN0cyxcblx0XHRzZXRDdXJyZW50TGlzdDogc2V0Q3VycmVudExpc3QsXG5cdFx0Z2V0Q3VycmVudExpc3Q6IGdldEN1cnJlbnRMaXN0LFxuXHRcdGRlbGV0ZUxpc3Q6IGRlbGV0ZUxpc3QsXG5cdFx0ZGVsZXRlSXRlbTogZGVsZXRlSXRlbSxcblx0XHRjYW5jZWxEZWxldGU6IGNhbmNlbERlbGV0ZSxcblx0XHRsb2NhbFJldHJpZXZlOiBsb2NhbFJldHJpZXZlLFxuXHRcdGxvY2FsU2F2ZTogbG9jYWxTYXZlXG5cdH07XG5cblx0ZnVuY3Rpb24gYWRkKCkge1xuXHRcdGxpc3RzLnVuc2hpZnQoXG5cdFx0XHRuZXcgTGlzdE9iamVjdChnZXRVbmlxSWQoKSwgXCJOZXcgTGlzdCBcIisobGlzdHMubGVuZ3RoKzEpKVxuXHRcdCk7XG5cdFx0cmV0dXJuIGxpc3RzWzBdO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0VW5pcUlkKCkge1xuXHRcdHZhciBsZW5ndGggPSA4O1xuXHRcdHJldHVybiAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKk1hdGgucG93KDM2LGxlbmd0aCkpLnRvU3RyaW5nKDM2KSkuc2xpY2UoLWxlbmd0aCk7XG5cdH1cblxuXHRmdW5jdGlvbiBmaW5kTGlzdEluZGV4QnlJZChpZCkge1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKGxpc3RzW2ldLmlkID09PSBpZCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBkZWxldGVMaXN0KGlkKSB7XG5cdFx0Ly8gU2V0IGxpc3Qgc3RhdHVzIGZvciBkZWxldGlvblxuXHRcdHZhciBpbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGlkKTtcblx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0bGlzdHNbaW5kZXhdLmRlbGV0aW5nID0gdHJ1ZTtcblx0XHRcdGN1cnJlbnRMaXN0SWQgPSAnJztcblx0XHR9XG5cdFx0Ly8gZGVsZXRlIGRlbGF5XG5cdFx0ZGVsZXRpbmdMaXN0SWQgPSBpZDtcblx0XHRkZWxldGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0ZGVsZXRlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gZ2V0IGluZGV4IGFnYWluLCBhcyBpdCBtYXkgaGF2ZSBjaGFuZ2VkXG5cdFx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChpZCk7XG5cdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRsaXN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRkZWxldGVEZWZlci5yZXNvbHZlKCdkZWxldGVkJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkZWxldGVEZWZlci5yZWplY3QoJ2xpc3ROb3RGb3VuZCcpO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdMaXN0SWQgPSB1bmRlZmluZWQ7XG5cdFx0fSwgNTAwMCk7XG5cdFx0cmV0dXJuIGRlbGV0ZURlZmVyLnByb21pc2U7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWxldGVJdGVtKGlkKSB7XG5cdFx0Ly8gU2V0IGxpc3Qgc3RhdHVzIGZvciBkZWxldGlvblxuXHRcdHZhciBpbmRleCA9IGdldEN1cnJlbnRMaXN0KCkuZ2V0SXRlbUluZGV4QnlJZChpZCk7XG5cdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdGdldEN1cnJlbnRMaXN0KCkuaXRlbXNbaW5kZXhdLmRlbGV0aW5nID0gdHJ1ZTtcblx0XHR9XG5cdFx0Ly8gZGVsZXRlIGRlbGF5XG5cdFx0ZGVsZXRpbmdJdGVtSWQgPSBpZDtcblx0XHRkZWxldGluZ0xpc3RJZCA9IGdldEN1cnJlbnRMaXN0KCkuaWQ7IC8vIHN0b3JlIGxpc3QgaWQgaW4gY2FzZSBjdXJyZW50IGxpc3QgaXMgY2hhbmdlZFxuXHRcdGRlbGV0ZURlZmVyID0gJHEuZGVmZXIoKTtcblx0XHRkZWxldGVUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBnZXQgaW5kZXggYWdhaW4sIGFzIGl0IG1heSBoYXZlIGNoYW5nZWRcblx0XHRcdHZhciBsaXN0SW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChkZWxldGluZ0xpc3RJZCk7XG5cdFx0XHRpZiAobGlzdEluZGV4ID49IDApIHtcblx0XHRcdFx0dmFyIGluZGV4ID0gbGlzdHNbbGlzdEluZGV4XS5nZXRJdGVtSW5kZXhCeUlkKGlkKTtcblx0XHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0XHRsaXN0c1tsaXN0SW5kZXhdLml0ZW1zLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdFx0ZGVsZXRlRGVmZXIucmVzb2x2ZSgnZGVsZXRlZCcpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGRlbGV0ZURlZmVyLnJlamVjdCgnbGlzdE5vdEZvdW5kJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nSXRlbUlkID0gdW5kZWZpbmVkO1xuXHRcdH0sIDUwMDApO1xuXHRcdHJldHVybiBkZWxldGVEZWZlci5wcm9taXNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2FuY2VsRGVsZXRlKCkge1xuXHRcdGNsZWFyVGltZW91dChkZWxldGVUaW1lcik7XG5cdFx0aWYgKGRlbGV0aW5nSXRlbUlkKSB7XG5cdFx0XHR2YXIgbGlzdCA9IGxpc3RzW2ZpbmRMaXN0SW5kZXhCeUlkKGRlbGV0aW5nTGlzdElkKV07XG5cdFx0XHR2YXIgaW5kZXggPSBsaXN0LmdldEl0ZW1JbmRleEJ5SWQoZGVsZXRpbmdJZCk7XG5cdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRsaXN0Lml0ZW1zW2luZGV4XS5kZWxldGluZyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdJdGVtSWQgPSB1bmRlZmluZWQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBpbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGRlbGV0aW5nSWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdHNbaW5kZXhdLmRlbGV0aW5nID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGluZ0xpc3RJZCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdkZWxldGVDYW5jZWxsZWQnKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNldEN1cnJlbnRMaXN0KGxpc3QpIHtcblx0XHRpZiAodHlwZW9mIGxpc3QgPT09ICdudW1iZXInKSB7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gZmluZExpc3RJbmRleEJ5SWQobGlzdCk7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgbGlzdCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGN1cnJlbnRMaXN0SWQgPSBsaXN0LmlkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ3Vua25vd24gaW5wdXQgZm9yIGxpc3Q6ICcrIHR5cGVvZiBsaXN0KTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRDdXJyZW50TGlzdCgpIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIGxpc3RzW2ZpbmRMaXN0SW5kZXhCeUlkKGN1cnJlbnRMaXN0SWQpXTtcblx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdGNvbnNvbGUud2FybignTGlzdCBub3QgZm91bmQuIElEOiAnK2N1cnJlbnRMaXN0SWQpO1xuXHRcdFx0Y29uc29sZS53YXJuKGxpc3RzKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBsb2NhbFJldHJpZXZlKCkge1xuXHRcdHZhciByZXRyaWV2ZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnQmFza2V0cycpO1xuXHRcdGlmIChyZXRyaWV2ZWQpIHtcblx0XHRcdHZhciBwYXJzZWQgPSBKU09OLnBhcnNlKHJldHJpZXZlZCk7XG5cdFx0XHRmb3IgKHZhciBpPTA7IGk8cGFyc2VkLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHZhciBsaXN0ID0gbmV3IExpc3RPYmplY3QocGFyc2VkW2ldLmlkLCBwYXJzZWRbaV0ubmFtZSk7XG5cdFx0XHRcdGxpc3QuaXRlbXMgPSBwYXJzZWRbaV0uaXRlbXM7XG5cdFx0XHRcdGxpc3RzLnB1c2gobGlzdCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbG9jYWxTYXZlKCkge1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdCYXNrZXRzJywgSlNPTi5zdHJpbmdpZnkobGlzdHMpKTtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0Jhc2tldENvbnRyb2xsZXInLCBCYXNrZXRDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gQmFza2V0Q29udHJvbGxlcigkbWRTaWRlbmF2LCAkbWRNZWRpYSwgYWxsTGlzdHNTZXJ2aWNlLCAkbWRUb2FzdCwgc3VwcG9ydCkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXHR2bS50b2dnbGVMaXN0c1ZpZXcgPSB0b2dnbGVMaXN0c1ZpZXc7XG5cdHZtLmNsb3NlTGlzdHNWaWV3ID0gY2xvc2VMaXN0c1ZpZXc7XG5cdHZtLmRlbGV0ZUxpc3RCeUlkID0gZGVsZXRlTGlzdEJ5SWQ7XG5cdHZtLnN1cHBvcnQgPSBzdXBwb3J0O1xuXG5cdGFsbExpc3RzU2VydmljZS5sb2NhbFJldHJpZXZlKCk7XG5cdHNldEludGVydmFsKGFsbExpc3RzU2VydmljZS5sb2NhbFNhdmUsIDUwMDApO1xuXG5cdHZtLiRtZE1lZGlhID0gJG1kTWVkaWE7XG5cdGlmICghdm0uJG1kTWVkaWEoJ2xnJykpIHtcblx0XHR2bS5saXN0c1ZpZXdPcGVuID0gdHJ1ZTtcblx0fVxuXG5cdGZ1bmN0aW9uIHRvZ2dsZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykudG9nZ2xlKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBjbG9zZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykuY2xvc2UoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGRlbGV0ZUxpc3RCeUlkKGlkKSB7XG5cdFx0Ly8gc2hvdyB1bmRvIHRvYXN0XG5cdFx0dmFyIGRlbGV0ZVRvYXN0ID0gJG1kVG9hc3Quc2ltcGxlKCkuY29udGVudCgnTGlzdCBEZWxldGVkJykuYWN0aW9uKCdVbmRvJykuaGlnaGxpZ2h0QWN0aW9uKHRydWUpO1xuXHRcdCRtZFRvYXN0LnNob3coZGVsZXRlVG9hc3QpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZSA9PT0gJ29rJykge1xuXHRcdFx0XHR1bmRvRGVsZXRlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcGVyZm9ybSBkZWxldGVcblx0XHRhbGxMaXN0c1NlcnZpY2UuZGVsZXRlTGlzdChpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRtZFRvYXN0LmhpZGUoKTtcblx0XHR9KTtcblx0XHQvLyBoaWRlIGN1cnJlbnRseSBlZGl0aW5nIGxpc3Rcblx0XHQkbWRTaWRlbmF2KCdsZWZ0Jykub3BlbigpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdW5kb0RlbGV0ZSgpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2UuY2FuY2VsRGVsZXRlKCk7XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1zQ29udHJvbGxlcicsIEl0ZW1zQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1zQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UsICRtZFRvYXN0LCAkbWRNZWRpYSkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXG5cdHZtLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHR2bS5nZXRDdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblx0dm0uZGVsZXRlSXRlbSA9IGRlbGV0ZUl0ZW07XG5cdHZtLnNlYXJjaE5hbWUgPSBzZWFyY2hOYW1lO1xuXHR2bS5nZXRQaG90byA9IGdldFBob3RvO1xuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0aWYgKCFhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKSkge1xuXHRcdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdFx0fVxuXHRcdHZtLmdldEN1cnJlbnRMaXN0KCkuYWRkSXRlbSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlSXRlbShpZCkge1xuXHRcdC8vIHNob3cgdW5kbyB0b2FzdFxuXHRcdHZhciBkZWxldGVUb2FzdCA9ICRtZFRvYXN0LnNpbXBsZSgpLmNvbnRlbnQoJ0l0ZW0gRGVsZXRlZCcpLmFjdGlvbignVW5kbycpLmhpZ2hsaWdodEFjdGlvbih0cnVlKTtcblx0XHQkbWRUb2FzdC5zaG93KGRlbGV0ZVRvYXN0KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2UgPT09ICdvaycpIHtcblx0XHRcdFx0dW5kb0RlbGV0ZSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdC8vIHBlcmZvcm0gZGVsZXRlXG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmRlbGV0ZUl0ZW0oaWQpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkbWRUb2FzdC5oaWRlKCk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiB1bmRvRGVsZXRlKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5jYW5jZWxEZWxldGUoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNlYXJjaE5hbWUocXVlcnkpIHtcblx0XHR2YXIgYWxsSXRlbXMgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKS5pdGVtcztcblx0XHR2YXIgbmFtZXMgPSBbcXVlcnldO1xuXHRcdC8vIGdldCBsaXN0IG9mIGFsbCB1bmlxdWUgbmFtZXNcblx0XHRmb3IgKHZhciBpPTA7IGk8YWxsSXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBuYW1lID0gYWxsSXRlbXNbaV0uYXNzaWduO1xuXHRcdFx0aWYgKG5hbWUgJiYgbmFtZXMuaW5kZXhPZihuYW1lKSA8IDApIHsgLy8gaWYgbmFtZSBpc24ndCBhbHJlYWR5IGluIGxpc3Rcblx0XHRcdFx0bmFtZXMucHVzaChuYW1lKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gZmluZCBtYXRjaGVkIG5hbWVzXG5cdFx0dmFyIG1hdGNoZXMgPSBuYW1lcy5maWx0ZXIoZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0cmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHF1ZXJ5LnRvTG93ZXJDYXNlKCkpID09PSAwO1xuXHRcdH0pO1xuXHRcdHJldHVybiBtYXRjaGVzO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0UGhvdG8oaWQsIHByb21pc2UpIHtcblx0XHR2YXIgbGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpO1xuXHRcdHZhciBpbmRleCA9IGxpc3QuZ2V0SXRlbUluZGV4QnlJZChpZCk7XG5cdFx0dmFyIGxvYWRpbmdJY29uID0gXCJkYXRhOmltYWdlL3N2Zyt4bWwsJTNDc3ZnJTIweG1sbnMlM0QlMjJodHRwJTNBLy93d3cudzMub3JnLzIwMDAvc3ZnJTIyJTIwdmlld0JveCUzRCUyMjAlMjAwJTIwMzIlMjAzMiUyMiUyMHdpZHRoJTNEJTIyMzIlMjIlMjBoZWlnaHQlM0QlMjIzMiUyMiUyMGZpbGwlM0QlMjJibGFjayUyMiUzRSUwQSUyMCUyMCUzQ2NpcmNsZSUyMHRyYW5zZm9ybSUzRCUyMnRyYW5zbGF0ZSUyODglMjAwJTI5JTIyJTIwY3glM0QlMjIwJTIyJTIwY3klM0QlMjIxNiUyMiUyMHIlM0QlMjIwJTIyJTNFJTIwJTBBJTIwJTIwJTIwJTIwJTNDYW5pbWF0ZSUyMGF0dHJpYnV0ZU5hbWUlM0QlMjJyJTIyJTIwdmFsdWVzJTNEJTIyMCUzQiUyMDQlM0IlMjAwJTNCJTIwMCUyMiUyMGR1ciUzRCUyMjEuMnMlMjIlMjByZXBlYXRDb3VudCUzRCUyMmluZGVmaW5pdGUlMjIlMjBiZWdpbiUzRCUyMjAlMjIlMEElMjAlMjAlMjAlMjAlMjAlMjBrZXl0aW1lcyUzRCUyMjAlM0IwLjIlM0IwLjclM0IxJTIyJTIwa2V5U3BsaW5lcyUzRCUyMjAuMiUyMDAuMiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUyMiUyMGNhbGNNb2RlJTNEJTIyc3BsaW5lJTIyJTIwLyUzRSUwQSUyMCUyMCUzQy9jaXJjbGUlM0UlMEElMjAlMjAlM0NjaXJjbGUlMjB0cmFuc2Zvcm0lM0QlMjJ0cmFuc2xhdGUlMjgxNiUyMDAlMjklMjIlMjBjeCUzRCUyMjAlMjIlMjBjeSUzRCUyMjE2JTIyJTIwciUzRCUyMjAlMjIlM0UlMjAlMEElMjAlMjAlMjAlMjAlM0NhbmltYXRlJTIwYXR0cmlidXRlTmFtZSUzRCUyMnIlMjIlMjB2YWx1ZXMlM0QlMjIwJTNCJTIwNCUzQiUyMDAlM0IlMjAwJTIyJTIwZHVyJTNEJTIyMS4ycyUyMiUyMHJlcGVhdENvdW50JTNEJTIyaW5kZWZpbml0ZSUyMiUyMGJlZ2luJTNEJTIyMC4zJTIyJTBBJTIwJTIwJTIwJTIwJTIwJTIwa2V5dGltZXMlM0QlMjIwJTNCMC4yJTNCMC43JTNCMSUyMiUyMGtleVNwbGluZXMlM0QlMjIwLjIlMjAwLjIlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglMjIlMjBjYWxjTW9kZSUzRCUyMnNwbGluZSUyMiUyMC8lM0UlMEElMjAlMjAlM0MvY2lyY2xlJTNFJTBBJTIwJTIwJTNDY2lyY2xlJTIwdHJhbnNmb3JtJTNEJTIydHJhbnNsYXRlJTI4MjQlMjAwJTI5JTIyJTIwY3glM0QlMjIwJTIyJTIwY3klM0QlMjIxNiUyMiUyMHIlM0QlMjIwJTIyJTNFJTIwJTBBJTIwJTIwJTIwJTIwJTNDYW5pbWF0ZSUyMGF0dHJpYnV0ZU5hbWUlM0QlMjJyJTIyJTIwdmFsdWVzJTNEJTIyMCUzQiUyMDQlM0IlMjAwJTNCJTIwMCUyMiUyMGR1ciUzRCUyMjEuMnMlMjIlMjByZXBlYXRDb3VudCUzRCUyMmluZGVmaW5pdGUlMjIlMjBiZWdpbiUzRCUyMjAuNiUyMiUwQSUyMCUyMCUyMCUyMCUyMCUyMGtleXRpbWVzJTNEJTIyMCUzQjAuMiUzQjAuNyUzQjElMjIlMjBrZXlTcGxpbmVzJTNEJTIyMC4yJTIwMC4yJTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTIyJTIwY2FsY01vZGUlM0QlMjJzcGxpbmUlMjIlMjAvJTNFJTBBJTIwJTIwJTNDL2NpcmNsZSUzRSUwQSUzQy9zdmclM0VcIjtcblx0XHQvLyBzZXQgYXMgbG9hZGluZyBpY29uIG9uIG1vYmlsZVxuXHRcdHByb21pc2UudGhlbihmdW5jdGlvbihmaWxlKXtcblx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLnBob3RvID0gZmlsZTtcblx0XHR9LCBudWxsXG5cdFx0LCBmdW5jdGlvbih1cGRhdGUpIHtcblx0XHRcdGlmICh1cGRhdGUgPT09ICdnZXR0aW5nJykge1xuXHRcdFx0XHRsaXN0Lml0ZW1zW2luZGV4XS5waG90byA9IGxvYWRpbmdJY29uO1xuXHRcdFx0fSBlbHNlIGlmICh1cGRhdGUgPT09ICdub0ltYWdlJykge1xuXHRcdFx0XHRpZiAobGlzdC5pdGVtc1tpbmRleF0ucGhvdG8gPT09IGxvYWRpbmdJY29uKSB7XG5cdFx0XHRcdFx0bGlzdC5pdGVtc1tpbmRleF0ucGhvdG8gPSAnJztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdMaXN0c0NvbnRyb2xsZXInLCBMaXN0c0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBMaXN0c0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cblx0dmFyIHZtID0gdGhpcztcblx0XG5cdHZtLmxpc3RzID0gYWxsTGlzdHNTZXJ2aWNlLmxpc3RzO1xuXG5cdHZtLmFkZExpc3QgPSBmdW5jdGlvbigpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0fTtcblxuXHR2bS5jdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==