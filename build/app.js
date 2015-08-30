if (window.FileReader) {
	fileSupport = true;
}

var app = angular.module('app', ['ngMaterial'])
				.constant('support', {fileReader: fileSupport});
angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($mdSidenav, $mdMedia, allListsService, $mdToast, support) {
	var vm = this;
	vm.toggleListsView = toggleListsView;
	vm.closeListsView = closeListsView;
	vm.deleteListById = deleteListById;
	vm.support = support;

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
		cancelDelete: cancelDelete
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
}
allListsService.$inject = ["ListObject", "$q"];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9MaXN0c0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2JrSXRlbS5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0SW5mby5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0Vmlldy5qcyIsInNlcnZpY2VzL0l0ZW1PYmplY3QuanMiLCJzZXJ2aWNlcy9MaXN0T2JqZWN0LmpzIiwic2VydmljZXMvYWxsTGlzdHNTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUksT0FBTyxZQUFZO0NBQ3RCLGNBQWM7OztBQUdmLElBQUksTUFBTSxRQUFRLE9BQU8sT0FBTyxDQUFDO0tBQzVCLFNBQVMsV0FBVyxDQUFDLFlBQVksY0FBYztBQ0xwRDtFQUNFLE9BQU87RUFDUCxXQUFXLG9CQUFvQjs7QUFFakMsU0FBUyxpQkFBaUIsWUFBWSxVQUFVLGlCQUFpQixVQUFVLFNBQVM7Q0FDbkYsSUFBSSxLQUFLO0NBQ1QsR0FBRyxrQkFBa0I7Q0FDckIsR0FBRyxpQkFBaUI7Q0FDcEIsR0FBRyxpQkFBaUI7Q0FDcEIsR0FBRyxVQUFVOztDQUViLEdBQUcsV0FBVztDQUNkLElBQUksQ0FBQyxHQUFHLFNBQVMsT0FBTztFQUN2QixHQUFHLGdCQUFnQjs7O0NBR3BCLFNBQVMsa0JBQWtCO0VBQzFCLFdBQVcsUUFBUTs7O0NBR3BCLFNBQVMsaUJBQWlCO0VBQ3pCLFdBQVcsUUFBUTs7O0NBR3BCLFNBQVMsZUFBZSxJQUFJOztFQUUzQixJQUFJLGNBQWMsU0FBUyxTQUFTLFFBQVEsZ0JBQWdCLE9BQU8sUUFBUSxnQkFBZ0I7RUFDM0YsU0FBUyxLQUFLLGFBQWEsS0FBSyxTQUFTLFVBQVU7R0FDbEQsSUFBSSxhQUFhLE1BQU07SUFDdEI7Ozs7RUFJRixnQkFBZ0IsV0FBVyxJQUFJLEtBQUssV0FBVztHQUM5QyxTQUFT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U0FBUyxlQUFlLE1BQU07RUFDN0IsSUFBSSxPQUFPLFNBQVMsVUFBVTtHQUM3QixnQkFBZ0Isa0JBQWtCO1NBQzVCLElBQUksT0FBTyxTQUFTLFVBQVU7R0FDcEMsZ0JBQWdCLEtBQUs7U0FDZjtHQUNOLFFBQVEsS0FBSyw0QkFBNEIsT0FBTztHQUNoRCxRQUFRLEtBQUs7Ozs7Q0FJZixTQUFTLGlCQUFpQjtFQUN6QixJQUFJO0dBQ0gsT0FBTyxNQUFNLGtCQUFrQjtJQUM5QixNQUFNLEdBQUc7R0FDVixRQUFRLEtBQUssdUJBQXVCO0dBQ3BDLFFBQVEsS0FBSztHQUNiLE9BQU87Ozs7K0NBR1QiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaWYgKHdpbmRvdy5GaWxlUmVhZGVyKSB7XG5cdGZpbGVTdXBwb3J0ID0gdHJ1ZTtcbn1cblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nTWF0ZXJpYWwnXSlcblx0XHRcdFx0LmNvbnN0YW50KCdzdXBwb3J0Jywge2ZpbGVSZWFkZXI6IGZpbGVTdXBwb3J0fSk7IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignQmFza2V0Q29udHJvbGxlcicsIEJhc2tldENvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBCYXNrZXRDb250cm9sbGVyKCRtZFNpZGVuYXYsICRtZE1lZGlhLCBhbGxMaXN0c1NlcnZpY2UsICRtZFRvYXN0LCBzdXBwb3J0KSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cdHZtLnRvZ2dsZUxpc3RzVmlldyA9IHRvZ2dsZUxpc3RzVmlldztcblx0dm0uY2xvc2VMaXN0c1ZpZXcgPSBjbG9zZUxpc3RzVmlldztcblx0dm0uZGVsZXRlTGlzdEJ5SWQgPSBkZWxldGVMaXN0QnlJZDtcblx0dm0uc3VwcG9ydCA9IHN1cHBvcnQ7XG5cblx0dm0uJG1kTWVkaWEgPSAkbWRNZWRpYTtcblx0aWYgKCF2bS4kbWRNZWRpYSgnbGcnKSkge1xuXHRcdHZtLmxpc3RzVmlld09wZW4gPSB0cnVlO1xuXHR9XG5cblx0ZnVuY3Rpb24gdG9nZ2xlTGlzdHNWaWV3KCkge1xuXHRcdCRtZFNpZGVuYXYoJ2xlZnQnKS50b2dnbGUoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNsb3NlTGlzdHNWaWV3KCkge1xuXHRcdCRtZFNpZGVuYXYoJ2xlZnQnKS5jbG9zZSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlTGlzdEJ5SWQoaWQpIHtcblx0XHQvLyBzaG93IHVuZG8gdG9hc3Rcblx0XHR2YXIgZGVsZXRlVG9hc3QgPSAkbWRUb2FzdC5zaW1wbGUoKS5jb250ZW50KCdMaXN0IERlbGV0ZWQnKS5hY3Rpb24oJ1VuZG8nKS5oaWdobGlnaHRBY3Rpb24odHJ1ZSk7XG5cdFx0JG1kVG9hc3Quc2hvdyhkZWxldGVUb2FzdCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0aWYgKHJlc3BvbnNlID09PSAnb2snKSB7XG5cdFx0XHRcdHVuZG9EZWxldGUoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHQvLyBwZXJmb3JtIGRlbGV0ZVxuXHRcdGFsbExpc3RzU2VydmljZS5kZWxldGVMaXN0KGlkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0JG1kVG9hc3QuaGlkZSgpO1xuXHRcdH0pO1xuXHRcdC8vIGhpZGUgY3VycmVudGx5IGVkaXRpbmcgbGlzdFxuXHRcdCRtZFNpZGVuYXYoJ2xlZnQnKS5vcGVuKCk7XG5cdH1cblxuXHRmdW5jdGlvbiB1bmRvRGVsZXRlKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5jYW5jZWxEZWxldGUoKTtcblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignSXRlbXNDb250cm9sbGVyJywgSXRlbXNDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gSXRlbXNDb250cm9sbGVyKGFsbExpc3RzU2VydmljZSwgJG1kVG9hc3QsICRtZE1lZGlhKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cblx0dm0uYWRkSXRlbSA9IGFkZEl0ZW07XG5cdHZtLmdldEN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXHR2bS5kZWxldGVJdGVtID0gZGVsZXRlSXRlbTtcblx0dm0uc2VhcmNoTmFtZSA9IHNlYXJjaE5hbWU7XG5cdHZtLmdldFBob3RvID0gZ2V0UGhvdG87XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHRpZiAoIWFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpKSB7XG5cdFx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0XHR9XG5cdFx0dm0uZ2V0Q3VycmVudExpc3QoKS5hZGRJdGVtKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWxldGVJdGVtKGlkKSB7XG5cdFx0Ly8gc2hvdyB1bmRvIHRvYXN0XG5cdFx0dmFyIGRlbGV0ZVRvYXN0ID0gJG1kVG9hc3Quc2ltcGxlKCkuY29udGVudCgnSXRlbSBEZWxldGVkJykuYWN0aW9uKCdVbmRvJykuaGlnaGxpZ2h0QWN0aW9uKHRydWUpO1xuXHRcdCRtZFRvYXN0LnNob3coZGVsZXRlVG9hc3QpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZSA9PT0gJ29rJykge1xuXHRcdFx0XHR1bmRvRGVsZXRlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcGVyZm9ybSBkZWxldGVcblx0XHRhbGxMaXN0c1NlcnZpY2UuZGVsZXRlSXRlbShpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRtZFRvYXN0LmhpZGUoKTtcblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVuZG9EZWxldGUoKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmNhbmNlbERlbGV0ZSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2VhcmNoTmFtZShxdWVyeSkge1xuXHRcdHZhciBhbGxJdGVtcyA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpLml0ZW1zO1xuXHRcdHZhciBuYW1lcyA9IFtxdWVyeV07XG5cdFx0Ly8gZ2V0IGxpc3Qgb2YgYWxsIHVuaXF1ZSBuYW1lc1xuXHRcdGZvciAodmFyIGk9MDsgaTxhbGxJdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIG5hbWUgPSBhbGxJdGVtc1tpXS5hc3NpZ247XG5cdFx0XHRpZiAobmFtZSAmJiBuYW1lcy5pbmRleE9mKG5hbWUpIDwgMCkgeyAvLyBpZiBuYW1lIGlzbid0IGFscmVhZHkgaW4gbGlzdFxuXHRcdFx0XHRuYW1lcy5wdXNoKG5hbWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBmaW5kIG1hdGNoZWQgbmFtZXNcblx0XHR2YXIgbWF0Y2hlcyA9IG5hbWVzLmZpbHRlcihmdW5jdGlvbihuYW1lKSB7XG5cdFx0XHRyZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkudG9Mb3dlckNhc2UoKSkgPT09IDA7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIG1hdGNoZXM7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRQaG90byhpZCwgcHJvbWlzZSkge1xuXHRcdHZhciBsaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0KCk7XG5cdFx0dmFyIGluZGV4ID0gbGlzdC5nZXRJdGVtSW5kZXhCeUlkKGlkKTtcblx0XHR2YXIgbG9hZGluZ0ljb24gPSBcImRhdGE6aW1hZ2Uvc3ZnK3htbCwlM0NzdmclMjB4bWxucyUzRCUyMmh0dHAlM0EvL3d3dy53My5vcmcvMjAwMC9zdmclMjIlMjB2aWV3Qm94JTNEJTIyMCUyMDAlMjAzMiUyMDMyJTIyJTIwd2lkdGglM0QlMjIzMiUyMiUyMGhlaWdodCUzRCUyMjMyJTIyJTIwZmlsbCUzRCUyMmJsYWNrJTIyJTNFJTBBJTIwJTIwJTNDY2lyY2xlJTIwdHJhbnNmb3JtJTNEJTIydHJhbnNsYXRlJTI4OCUyMDAlMjklMjIlMjBjeCUzRCUyMjAlMjIlMjBjeSUzRCUyMjE2JTIyJTIwciUzRCUyMjAlMjIlM0UlMjAlMEElMjAlMjAlMjAlMjAlM0NhbmltYXRlJTIwYXR0cmlidXRlTmFtZSUzRCUyMnIlMjIlMjB2YWx1ZXMlM0QlMjIwJTNCJTIwNCUzQiUyMDAlM0IlMjAwJTIyJTIwZHVyJTNEJTIyMS4ycyUyMiUyMHJlcGVhdENvdW50JTNEJTIyaW5kZWZpbml0ZSUyMiUyMGJlZ2luJTNEJTIyMCUyMiUwQSUyMCUyMCUyMCUyMCUyMCUyMGtleXRpbWVzJTNEJTIyMCUzQjAuMiUzQjAuNyUzQjElMjIlMjBrZXlTcGxpbmVzJTNEJTIyMC4yJTIwMC4yJTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTIyJTIwY2FsY01vZGUlM0QlMjJzcGxpbmUlMjIlMjAvJTNFJTBBJTIwJTIwJTNDL2NpcmNsZSUzRSUwQSUyMCUyMCUzQ2NpcmNsZSUyMHRyYW5zZm9ybSUzRCUyMnRyYW5zbGF0ZSUyODE2JTIwMCUyOSUyMiUyMGN4JTNEJTIyMCUyMiUyMGN5JTNEJTIyMTYlMjIlMjByJTNEJTIyMCUyMiUzRSUyMCUwQSUyMCUyMCUyMCUyMCUzQ2FuaW1hdGUlMjBhdHRyaWJ1dGVOYW1lJTNEJTIyciUyMiUyMHZhbHVlcyUzRCUyMjAlM0IlMjA0JTNCJTIwMCUzQiUyMDAlMjIlMjBkdXIlM0QlMjIxLjJzJTIyJTIwcmVwZWF0Q291bnQlM0QlMjJpbmRlZmluaXRlJTIyJTIwYmVnaW4lM0QlMjIwLjMlMjIlMEElMjAlMjAlMjAlMjAlMjAlMjBrZXl0aW1lcyUzRCUyMjAlM0IwLjIlM0IwLjclM0IxJTIyJTIwa2V5U3BsaW5lcyUzRCUyMjAuMiUyMDAuMiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUyMiUyMGNhbGNNb2RlJTNEJTIyc3BsaW5lJTIyJTIwLyUzRSUwQSUyMCUyMCUzQy9jaXJjbGUlM0UlMEElMjAlMjAlM0NjaXJjbGUlMjB0cmFuc2Zvcm0lM0QlMjJ0cmFuc2xhdGUlMjgyNCUyMDAlMjklMjIlMjBjeCUzRCUyMjAlMjIlMjBjeSUzRCUyMjE2JTIyJTIwciUzRCUyMjAlMjIlM0UlMjAlMEElMjAlMjAlMjAlMjAlM0NhbmltYXRlJTIwYXR0cmlidXRlTmFtZSUzRCUyMnIlMjIlMjB2YWx1ZXMlM0QlMjIwJTNCJTIwNCUzQiUyMDAlM0IlMjAwJTIyJTIwZHVyJTNEJTIyMS4ycyUyMiUyMHJlcGVhdENvdW50JTNEJTIyaW5kZWZpbml0ZSUyMiUyMGJlZ2luJTNEJTIyMC42JTIyJTBBJTIwJTIwJTIwJTIwJTIwJTIwa2V5dGltZXMlM0QlMjIwJTNCMC4yJTNCMC43JTNCMSUyMiUyMGtleVNwbGluZXMlM0QlMjIwLjIlMjAwLjIlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglMjIlMjBjYWxjTW9kZSUzRCUyMnNwbGluZSUyMiUyMC8lM0UlMEElMjAlMjAlM0MvY2lyY2xlJTNFJTBBJTNDL3N2ZyUzRVwiO1xuXHRcdC8vIHNldCBhcyBsb2FkaW5nIGljb24gb24gbW9iaWxlXG5cdFx0cHJvbWlzZS50aGVuKGZ1bmN0aW9uKGZpbGUpe1xuXHRcdFx0bGlzdC5pdGVtc1tpbmRleF0ucGhvdG8gPSBmaWxlO1xuXHRcdH0sIG51bGxcblx0XHQsIGZ1bmN0aW9uKHVwZGF0ZSkge1xuXHRcdFx0aWYgKHVwZGF0ZSA9PT0gJ2dldHRpbmcnKSB7XG5cdFx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLnBob3RvID0gbG9hZGluZ0ljb247XG5cdFx0XHR9IGVsc2UgaWYgKHVwZGF0ZSA9PT0gJ25vSW1hZ2UnKSB7XG5cdFx0XHRcdGlmIChsaXN0Lml0ZW1zW2luZGV4XS5waG90byA9PT0gbG9hZGluZ0ljb24pIHtcblx0XHRcdFx0XHRsaXN0Lml0ZW1zW2luZGV4XS5waG90byA9ICcnO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0xpc3RzQ29udHJvbGxlcicsIExpc3RzQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIExpc3RzQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblxuXHR2YXIgdm0gPSB0aGlzO1xuXHRcblx0dm0ubGlzdHMgPSBhbGxMaXN0c1NlcnZpY2UubGlzdHM7XG5cblx0dm0uYWRkTGlzdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChhbGxMaXN0c1NlcnZpY2UuYWRkKCkpO1xuXHR9O1xuXG5cdHZtLmN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0l0ZW0nLCBia0l0ZW0pO1xuXG5mdW5jdGlvbiBia0l0ZW0oJHEpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdHRlbXBsYXRlVXJsOiAnLi90ZW1wbGF0ZXMvYmtJdGVtLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdJdGVtc0NvbnRyb2xsZXInLFxuXHRcdGNvbnRyb2xsZXJBczogJ0l0ZW1zJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHQvLyBFbmQgY3VzdG9tIGVkaXQgbW9kZSBvbiBjbGlja1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cblx0XHR2YXIgbGlzdFZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbYmstbGlzdC12aWV3XScpO1xuXHRcdHZhciBhc3NpZ25JbnB1dDtcblxuXHRcdC8vIEVudGVyIGFzc2lnbiBtb2RlXG5cdFx0ZnVuY3Rpb24gZW50ZXJBc3NpZ25Nb2RlKCkge1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcyhcImVkaXRhYmxlIGVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdFx0YXNzaWduSW5wdXQuc2VsZWN0KCk7IC8vIGlPUyBmaXhcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGFzc2lnbklucHV0LmZvY3VzKCk7IH0sIDEwMCk7IC8vIGRlbGF5IHRvIHdhaXQgZm9yIGNsYXNzZXMgdG8gYXBwbHlcblx0XHRcdGxpc3RWaWV3LmNsYXNzTGlzdC5hZGQoXCJoYXNFZGl0YWJsZUl0ZW1cIik7XG5cdFx0fVxuXG5cdFx0dmFyIHBob3RvSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LnBob3RvJyk7XG5cdFx0dmFyIGZpbGVEZWZlcjtcblx0XHR2YXIgd2FpdGluZ0lucHV0ID0gMDtcblx0XHRmdW5jdGlvbiBwaG90b1Byb21wdCgpIHtcblx0XHRcdHBob3RvSW5wdXQuY2xpY2soKTtcblx0XHRcdHBob3RvSW5wdXQudmFsdWUgPSBudWxsO1xuXHRcdFx0ZmlsZURlZmVyID0gJHEuZGVmZXIoKTtcblx0XHRcdHNjb3BlLkl0ZW1zLmdldFBob3RvKGF0dHJzLml0ZW1JZCwgZmlsZURlZmVyLnByb21pc2UpO1xuXHRcdH1cblx0XHRmdW5jdGlvbiBwaG90b1Byb21wdENsb3NlKCkge1xuXHRcdFx0aWYgKHdhaXRpbmdJbnB1dCA+IDApIHtcblx0XHRcdFx0d2FpdGluZ0lucHV0ID0gMDtcblx0XHRcdFx0ZmlsZURlZmVyLm5vdGlmeSgnbm9JbWFnZScpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0d2FpdGluZ0lucHV0Kys7XG5cdFx0XHRcdGZpbGVEZWZlci5ub3RpZnkoJ2dldHRpbmcnKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cGhvdG9JbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHR2YXIgZmlsZSA9IGUudGFyZ2V0LmZpbGVzWzBdO1xuXHRcdFx0d2FpdGluZ0lucHV0ID0gMDtcblx0XHRcdGlmIChmaWxlKSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXHRcdFx0XHRyZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0ZmlsZURlZmVyLnJlc29sdmUocmVhZGVyLnJlc3VsdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBUb2dnbGUgaXRlbSBkb25lbmVzc1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmRvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudC50b2dnbGVDbGFzcyhcImRvbmVcIikucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZVwiKTtcblx0XHRcdGxpc3RWaWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJoYXNFZGl0YWJsZUl0ZW1cIik7XG5cdFx0XHRkZXNlbGVjdCgpO1xuXHRcdH0pO1xuXHRcdFxuXHRcdC8vIFJlYXR0YWNoIGxpc3RlbmVyIHRvIGJ1dHRvbnMgb24gc2NyZWVuIHNpemUgY2hhbmdlXG5cdFx0dmFyIGFzc2lnbkJ1dHRvbiA9IGdldEFzc2lnbkJ1dHRvbigpO1xuXHRcdHZhciBwaG90b0J1dHRvbiA9IGdldFBob3RvQnV0dG9uKCk7XG5cdFx0c2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gc2NvcGUuTWFpbi4kbWRNZWRpYSgnbWQnKTsgfSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoYXNzaWduQnV0dG9uKSB7XG5cdFx0XHRcdGFzc2lnbkJ1dHRvbi5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIGVudGVyQXNzaWduTW9kZSk7XG5cdFx0XHR9XG5cdFx0XHRhc3NpZ25CdXR0b24gPSBnZXRBc3NpZ25CdXR0b24oKTtcblx0XHRcdGlmIChhc3NpZ25CdXR0b24pIHtcblx0XHRcdFx0YXNzaWduQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJBc3NpZ25Nb2RlKTtcblx0XHRcdH1cblx0XHRcdGlmIChwaG90b0J1dHRvbikge1xuXHRcdFx0XHRwaG90b0J1dHRvbi5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHBob3RvUHJvbXB0KTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgcGhvdG9Qcm9tcHRDbG9zZSk7XG5cdFx0XHR9XG5cdFx0XHRwaG90b0J1dHRvbiA9IGdldFBob3RvQnV0dG9uKCk7XG5cdFx0XHRpZiAocGhvdG9CdXR0b24pIHtcblx0XHRcdFx0cGhvdG9CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBwaG90b1Byb21wdCk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ2aXNpYmlsaXR5Y2hhbmdlXCIsIHBob3RvUHJvbXB0Q2xvc2UpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gY2xpY2tpbmcgYnV0dG9uXG5cdFx0XHRlbGVtZW50LmZpbmQoJ2J1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdFx0Ly8gaU9TIGZpeCB0byBkZXNlbGVjdCBidXR0b25cblx0XHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gRGVsYXkgcXVlcnlpbmcgZm9yIGlucHV0IHVudGlsIGVsZW1lbnQgY3JlYXRlZFxuXHRcdFx0YXNzaWduSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ21kLWF1dG9jb21wbGV0ZS5hc3NpZ24gaW5wdXQnKTtcblx0XHRcdC8vIFByZXZlbnQgZW5kaW5nIGVkaXQgbW9kZSB3aGVuIHNlbGVjdGluZyBpbnB1dFxuXHRcdFx0ZWxlbWVudC5maW5kKCdtZC1pbnB1dC1jb250YWluZXInKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHR9KTtcblx0XHR9LCAxMDApO1xuXG5cdFx0Ly8gTGVhdmUgY3VzdG9tIGVkaXQgbW9kZVxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0KCkge1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVDbGFzcyhcImVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGdldEFzc2lnbkJ1dHRvbigpIHtcblx0XHRcdHJldHVybiBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5hc3NpZ24nKTtcblx0XHR9XG5cdFx0ZnVuY3Rpb24gZ2V0UGhvdG9CdXR0b24oKSB7XG5cdFx0XHRyZXR1cm4gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24ucGhvdG8nKTtcblx0XHR9XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0SW5mbycsIGJrTGlzdEluZm8pO1xuXG5mdW5jdGlvbiBia0xpc3RJbmZvKGFsbExpc3RzU2VydmljZSkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0dGVtcGxhdGVVcmw6ICcuL3RlbXBsYXRlcy9ia0xpc3RJbmZvLmh0bWwnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7IGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChzY29wZS5saXN0KSB9KTtcblx0XHR9KTtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0VmlldycsIGJrTGlzdFZpZXcpO1xuXG5mdW5jdGlvbiBia0xpc3RWaWV3KCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0Y29udHJvbGxlcjogJ0l0ZW1zQ29udHJvbGxlcicsXG5cdFx0Y29udHJvbGxlckFzOiAnSXRlbXMnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXG5cdFx0dmFyIHN1YmhlYWRlciA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlcicpO1xuXHRcdHZhciB0aXRsZUlucHV0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyIGlucHV0Jyk7XG5cblx0XHQvLyBDbGljayBvdXRzaWRlIG9mIGl0ZW1zIHRvIGV4aXQgZWRpdCBtb2RlXG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0aWYgKGUudGFyZ2V0KSB7XG5cdFx0XHRcdHZhciBia0l0ZW0gPSBpc0JrSXRlbUNoaWxkKGUudGFyZ2V0KTtcblx0XHRcdFx0aWYgKGJrSXRlbSkge1xuXHRcdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUoYmtJdGVtKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gUHJldmVudCBsb3NpbmcgZm9jdXMgb24gYnV0dG9uIGNsaWNrc1xuXHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblxuXHRcdC8vIE1ha2UgdGl0bGUgZWRpdGFibGUgb24gY2xpY2tcblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgLm5hbWUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0bWFrZVRpdGxlRWRpdGFibGUoKTtcblx0XHR9KTtcblxuXHRcdC8vIEV4aXQgdGl0bGUgZWRpdCBtb2RlIG9uIHRpdGxlIGlucHV0IGxvc2luZyBmb2N1c1xuXHRcdHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJykuY2xhc3NMaXN0LnJlbW92ZSgnZWRpdGFibGUnKTtcblx0XHR9KTtcblxuXHRcdC8vIFN3aXRjaCBmb2N1cyB0byBuZXcgaXRlbVxuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLm5ld0l0ZW0nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdHZhciBuZXdJdGVtID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdiay1pdGVtJyk7XG5cdFx0XHRpZiAobmV3SXRlbSkge1xuXHRcdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0XHRtYWtlSXRlbUVkaXRhYmxlKG5ld0l0ZW0pO1xuXHRcdFx0XHR2YXIgdGl0bGUgPSBuZXdJdGVtLnF1ZXJ5U2VsZWN0b3IoJy50aXRsZSBpbnB1dCcpO1xuXHRcdFx0XHQvLyBmb2N1cyB0aXRsZSBmaWVsZCBieSBkZWZhdWx0OyBkZWxheSB0byB3YWl0IGZvciBzdHlsZSB0byB0YWtlIGVmZmVjdFxuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB0aXRsZS5mb2N1cygpOyB9LCAxMDApO1xuXHRcdFx0XHR0aXRsZS5zZWxlY3QoKTsgLy8gaU9TIGZpeFxuXHRcdFx0XHR3aW5kb3cuc2Nyb2xsKDEsMSk7IC8vIGlPUyBmaXhcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGZ1bmN0aW9uIG1ha2VUaXRsZUVkaXRhYmxlKCkge1xuXHRcdFx0c3ViaGVhZGVyLmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlJyk7XG5cdFx0XHR0aXRsZUlucHV0LmZvY3VzKCk7XG5cdFx0fVxuXHRcdHNjb3BlLm1ha2VUaXRsZUVkaXRhYmxlID0gbWFrZVRpdGxlRWRpdGFibGU7XG5cblx0XHRmdW5jdGlvbiBkZXNlbGVjdEFsbCgpIHtcblx0XHRcdGVsZW1lbnQuZmluZCgnYmstaXRlbScpLnJlbW92ZUNsYXNzKFwiZWRpdGFibGUgZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKCdoYXNFZGl0YWJsZUl0ZW0nKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBtYWtlSXRlbUVkaXRhYmxlKGl0ZW0pIHtcblx0XHRcdGl0ZW0uY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGlzQmtJdGVtQ2hpbGQobm9kZSkge1xuXHRcdFx0dmFyIGlzQ2FyZENvbnRlbnQgPSBmYWxzZTtcblx0XHRcdHdoaWxlIChub2RlICYmIG5vZGUgIT09IGVsZW1lbnRbMF0pIHtcblx0XHRcdFx0aWYgKG5vZGUubm9kZU5hbWUgPT09ICdNRC1DQVJELUNPTlRFTlQnKSB7XG5cdFx0XHRcdFx0aXNDYXJkQ29udGVudCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGlzQ2FyZENvbnRlbnQgJiYgbm9kZS5ub2RlTmFtZSA9PT0gJ0JLLUlURU0nKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5vZGU7XG5cdFx0XHRcdH1cblx0XHRcdFx0bm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0l0ZW1PYmplY3QnLCBJdGVtT2JqZWN0KTtcblxuZnVuY3Rpb24gSXRlbU9iamVjdCgpIHtcblxuXHR2YXIgaXRlbU9iamVjdCA9IGZ1bmN0aW9uKGlkKSB7XG5cdFx0dGhpcy5pZCA9IGlkO1xuXHRcdHRoaXMudGl0bGUgPSAnJztcblx0XHR0aGlzLm5vdGUgPSAnJztcblx0XHR0aGlzLmFzc2lnbiA9ICcnO1xuXHRcdHRoaXMuZG9uZSA9IGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIGl0ZW1PYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdMaXN0T2JqZWN0JywgTGlzdE9iamVjdCk7XG5cbmZ1bmN0aW9uIExpc3RPYmplY3QoSXRlbU9iamVjdCkge1xuXG5cdHZhciBsaXN0T2JqZWN0ID0gZnVuY3Rpb24oaWQsIG5hbWUpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLml0ZW1zID0gW107XG5cdFx0dGhpcy5hZGRJdGVtID0gYWRkSXRlbTtcblx0XHR0aGlzLmdldEl0ZW1JbmRleEJ5SWQgPSBnZXRJdGVtSW5kZXhCeUlkO1xuXHRcdHRoaXMuZ2V0RGVzY3JpcHRpb24gPSBnZXREZXNjcmlwdGlvbjtcblx0fVxuXHR2YXIgbmV4dEl0ZW1JZCA9IDA7XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHR0aGlzLml0ZW1zLnVuc2hpZnQobmV3IEl0ZW1PYmplY3QobmV4dEl0ZW1JZCsrKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRJdGVtSW5kZXhCeUlkKGlkKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuaXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICh0aGlzLml0ZW1zW2ldLmlkID09IGlkKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGdldERlc2NyaXB0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLml0ZW1zLm1hcChmdW5jdGlvbihpdGVtKSB7IGlmICghaXRlbS5kb25lKSByZXR1cm4gaXRlbS50aXRsZSB9KVxuXHRcdFx0XHRcdFx0LmZpbHRlcihmdW5jdGlvbih2YWwpIHsgcmV0dXJuIHZhbDsgfSkvLyBnZXQgbm9uLWVtcHR5IGl0ZW1zXG5cdFx0XHRcdFx0XHQuam9pbignLCAnKTtcblx0fVxuXG5cdHJldHVybiBsaXN0T2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnYWxsTGlzdHNTZXJ2aWNlJywgYWxsTGlzdHNTZXJ2aWNlKTtcblxuZnVuY3Rpb24gYWxsTGlzdHNTZXJ2aWNlKExpc3RPYmplY3QsICRxKSB7XG5cblx0dmFyIGxpc3RzID0gW107XG5cdHZhciBjdXJyZW50TGlzdElkID0gdW5kZWZpbmVkO1xuXHR2YXIgZGVsZXRlVGltZXI7XG5cdHZhciBkZWxldGVEZWZlcjtcblx0dmFyIGRlbGV0aW5nTGlzdElkO1xuXHR2YXIgZGVsZXRpbmdJdGVtSWQ7XG5cblx0cmV0dXJuIHtcblx0XHRhZGQ6IGFkZCxcblx0XHRsaXN0czogbGlzdHMsXG5cdFx0c2V0Q3VycmVudExpc3Q6IHNldEN1cnJlbnRMaXN0LFxuXHRcdGdldEN1cnJlbnRMaXN0OiBnZXRDdXJyZW50TGlzdCxcblx0XHRkZWxldGVMaXN0OiBkZWxldGVMaXN0LFxuXHRcdGRlbGV0ZUl0ZW06IGRlbGV0ZUl0ZW0sXG5cdFx0Y2FuY2VsRGVsZXRlOiBjYW5jZWxEZWxldGVcblx0fTtcblxuXHRmdW5jdGlvbiBhZGQoKSB7XG5cdFx0bGlzdHMudW5zaGlmdChcblx0XHRcdG5ldyBMaXN0T2JqZWN0KGdldFVuaXFJZCgpLCBcIk5ldyBMaXN0IFwiKyhsaXN0cy5sZW5ndGgrMSkpXG5cdFx0KTtcblx0XHRyZXR1cm4gbGlzdHNbMF07XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRVbmlxSWQoKSB7XG5cdFx0dmFyIGxlbmd0aCA9IDg7XG5cdFx0cmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqTWF0aC5wb3coMzYsbGVuZ3RoKSkudG9TdHJpbmcoMzYpKS5zbGljZSgtbGVuZ3RoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGZpbmRMaXN0SW5kZXhCeUlkKGlkKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPGxpc3RzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAobGlzdHNbaV0uaWQgPT09IGlkKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGRlbGV0ZUxpc3QoaWQpIHtcblx0XHQvLyBTZXQgbGlzdCBzdGF0dXMgZm9yIGRlbGV0aW9uXG5cdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoaWQpO1xuXHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRsaXN0c1tpbmRleF0uZGVsZXRpbmcgPSB0cnVlO1xuXHRcdFx0Y3VycmVudExpc3RJZCA9ICcnO1xuXHRcdH1cblx0XHQvLyBkZWxldGUgZGVsYXlcblx0XHRkZWxldGluZ0xpc3RJZCA9IGlkO1xuXHRcdGRlbGV0ZURlZmVyID0gJHEuZGVmZXIoKTtcblx0XHRkZWxldGVUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBnZXQgaW5kZXggYWdhaW4sIGFzIGl0IG1heSBoYXZlIGNoYW5nZWRcblx0XHRcdHZhciBpbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGlkKTtcblx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdGxpc3RzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdGRlbGV0ZURlZmVyLnJlc29sdmUoJ2RlbGV0ZWQnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRlbGV0ZURlZmVyLnJlamVjdCgnbGlzdE5vdEZvdW5kJyk7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGluZ0xpc3RJZCA9IHVuZGVmaW5lZDtcblx0XHR9LCA1MDAwKTtcblx0XHRyZXR1cm4gZGVsZXRlRGVmZXIucHJvbWlzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGRlbGV0ZUl0ZW0oaWQpIHtcblx0XHQvLyBTZXQgbGlzdCBzdGF0dXMgZm9yIGRlbGV0aW9uXG5cdFx0dmFyIGluZGV4ID0gZ2V0Q3VycmVudExpc3QoKS5nZXRJdGVtSW5kZXhCeUlkKGlkKTtcblx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0Z2V0Q3VycmVudExpc3QoKS5pdGVtc1tpbmRleF0uZGVsZXRpbmcgPSB0cnVlO1xuXHRcdH1cblx0XHQvLyBkZWxldGUgZGVsYXlcblx0XHRkZWxldGluZ0l0ZW1JZCA9IGlkO1xuXHRcdGRlbGV0aW5nTGlzdElkID0gZ2V0Q3VycmVudExpc3QoKS5pZDsgLy8gc3RvcmUgbGlzdCBpZCBpbiBjYXNlIGN1cnJlbnQgbGlzdCBpcyBjaGFuZ2VkXG5cdFx0ZGVsZXRlRGVmZXIgPSAkcS5kZWZlcigpO1xuXHRcdGRlbGV0ZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdC8vIGdldCBpbmRleCBhZ2FpbiwgYXMgaXQgbWF5IGhhdmUgY2hhbmdlZFxuXHRcdFx0dmFyIGxpc3RJbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGRlbGV0aW5nTGlzdElkKTtcblx0XHRcdGlmIChsaXN0SW5kZXggPj0gMCkge1xuXHRcdFx0XHR2YXIgaW5kZXggPSBsaXN0c1tsaXN0SW5kZXhdLmdldEl0ZW1JbmRleEJ5SWQoaWQpO1xuXHRcdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRcdGxpc3RzW2xpc3RJbmRleF0uaXRlbXMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0XHRkZWxldGVEZWZlci5yZXNvbHZlKCdkZWxldGVkJyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdsaXN0Tm90Rm91bmQnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdJdGVtSWQgPSB1bmRlZmluZWQ7XG5cdFx0fSwgNTAwMCk7XG5cdFx0cmV0dXJuIGRlbGV0ZURlZmVyLnByb21pc2U7XG5cdH1cblxuXHRmdW5jdGlvbiBjYW5jZWxEZWxldGUoKSB7XG5cdFx0Y2xlYXJUaW1lb3V0KGRlbGV0ZVRpbWVyKTtcblx0XHRpZiAoZGVsZXRpbmdJdGVtSWQpIHtcblx0XHRcdHZhciBsaXN0ID0gbGlzdHNbZmluZExpc3RJbmRleEJ5SWQoZGVsZXRpbmdMaXN0SWQpXTtcblx0XHRcdHZhciBpbmRleCA9IGxpc3QuZ2V0SXRlbUluZGV4QnlJZChkZWxldGluZ0lkKTtcblx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLmRlbGV0aW5nID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGluZ0l0ZW1JZCA9IHVuZGVmaW5lZDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoZGVsZXRpbmdJZCk7XG5cdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRsaXN0c1tpbmRleF0uZGVsZXRpbmcgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nTGlzdElkID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRkZWxldGVEZWZlci5yZWplY3QoJ2RlbGV0ZUNhbmNlbGxlZCcpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2V0Q3VycmVudExpc3QobGlzdCkge1xuXHRcdGlmICh0eXBlb2YgbGlzdCA9PT0gJ251bWJlcicpIHtcblx0XHRcdGN1cnJlbnRMaXN0SWQgPSBmaW5kTGlzdEluZGV4QnlJZChsaXN0KTtcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBsaXN0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Y3VycmVudExpc3RJZCA9IGxpc3QuaWQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUud2FybigndW5rbm93biBpbnB1dCBmb3IgbGlzdDogJysgdHlwZW9mIGxpc3QpO1xuXHRcdFx0Y29uc29sZS53YXJuKGxpc3QpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGdldEN1cnJlbnRMaXN0KCkge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gbGlzdHNbZmluZExpc3RJbmRleEJ5SWQoY3VycmVudExpc3RJZCldO1xuXHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0Y29uc29sZS53YXJuKCdMaXN0IG5vdCBmb3VuZC4gSUQ6ICcrY3VycmVudExpc3RJZCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdHMpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==