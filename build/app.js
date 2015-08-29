var app = angular.module('app', ['ngMaterial']);

angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($mdSidenav, $mdMedia, allListsService, $mdToast) {
	var vm = this;
	vm.toggleListsView = toggleListsView;
	vm.closeListsView = closeListsView;
	vm.deleteListById = deleteListById;

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
BasketController.$inject = ["$mdSidenav", "$mdMedia", "allListsService", "$mdToast"];

angular
	.module('app')
	.controller('ItemsController', ItemsController);

function ItemsController(allListsService, $mdToast) {
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

	function getPhoto(index, file) {
		vm.getCurrentList().items[index].photo = file;
	}

}
ItemsController.$inject = ["allListsService", "$mdToast"];
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

function bkItem() {
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
		function photoPrompt() {
			photoInput.click();
		}
		photoInput.addEventListener('change', function(e) {
			var file = e.target.files[0];
			if (file) {
				var reader = new FileReader();
				reader.onloadend = function() {
					scope.Items.getPhoto(attrs.itemId, reader.result);
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
			if (this.items[i].id === id) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9MaXN0c0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2JrSXRlbS5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0SW5mby5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0Vmlldy5qcyIsInNlcnZpY2VzL0l0ZW1PYmplY3QuanMiLCJzZXJ2aWNlcy9MaXN0T2JqZWN0LmpzIiwic2VydmljZXMvYWxsTGlzdHNTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUksTUFBTSxRQUFRLE9BQU8sT0FBTyxDQUFDO0FBQ2pDO0FDREE7RUFDRSxPQUFPO0VBQ1AsV0FBVyxvQkFBb0I7O0FBRWpDLFNBQVMsaUJBQWlCLFlBQVksVUFBVSxpQkFBaUIsVUFBVTtDQUMxRSxJQUFJLEtBQUs7Q0FDVCxHQUFHLGtCQUFrQjtDQUNyQixHQUFHLGlCQUFpQjtDQUNwQixHQUFHLGlCQUFpQjs7Q0FFcEIsR0FBRyxXQUFXO0NBQ2QsSUFBSSxDQUFDLEdBQUcsU0FBUyxPQUFPO0VBQ3ZCLEdBQUcsZ0JBQWdCOzs7Q0FHcEIsU0FBUyxrQkFBa0I7RUFDMUIsV0FBVyxRQUFROzs7Q0FHcEIsU0FBUyxpQkFBaUI7RUFDekIsV0FBVyxRQUFROzs7Q0FHcEIsU0FBUyxlQUFlLElBQUk7O0VBRTNCLElBQUksY0FBYyxTQUFTLFNBQVMsUUFBUSxnQkFBZ0IsT0FBTyxRQUFRLGdCQUFnQjtFQUMzRixTQUFTLEtBQUssYUFBYSxLQUFLLFNBQVMsVUFBVTtHQUNsRCxJQUFJLGFBQWEsTUFBTTtJQUN0Qjs7OztFQUlGLGdCQUFnQixXQUFXLElBQUksS0FBSyxXQUFXO0dBQzlDLFNBQVM7OztFQUdWLFdBQVcsUUFBUTs7O0NBR3BCLFNBQVMsYUFBYTtFQUNyQixnQkFBZ0I7Ozs7QUFHbEI7QUMzQ0E7RUFDRSxPQUFPO0VBQ1As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QUNyQyxZQUFZLFFBQVE7V0FDZDtLQUNOLFlBQVksT0FBTzs7O0dBR3JCLGlCQUFpQjtLQUNmO0VBQ0gsT0FBTyxZQUFZOzs7Q0FHcEIsU0FBUyxlQUFlO0VBQ3ZCLGFBQWE7RUFDYixJQUFJLGdCQUFnQjtHQUNuQixJQUFJLE9BQU8sTUFBTSxrQkFBa0I7R0FDbkMsSUFBSSxRQUFRLEtBQUssaUJBQWlCO0dBQ2xDLElBQUksU0FBUyxHQUFHO0lBQ2YsS0FBSyxNQUFNLE9BQU8sV0FBVzs7R0FFOUIsaUJBQWlCO1NBQ1g7R0FDTixJQUFJLFFBQVEsa0JBQWtCO0dBQzlCLElBQUksU0FBUyxHQUFHO0lBQ2YsTUFBTSxPQUFPLFdBQVc7O0dBRXpCLGlCQUFpQjs7RUFFbEIsWUFBWSxPQUFPOzs7Q0FHcEIsU0FBUyxlQUFlLE1BQU07RUFDN0IsSUFBSSxPQUFPLFNBQVMsVUFBVTtHQUM3QixnQkFBZ0Isa0JBQWtCO1NBQzVCLElBQUksT0FBTyxTQUFTLFVBQVU7R0FDcEMsZ0JBQWdCLEtBQUs7U0FDZjtHQUNOLFFBQVEsS0FBSyw0QkFBNEIsT0FBTztHQUNoRCxRQUFRLEtBQUs7Ozs7Q0FJZixTQUFTLGlCQUFpQjtFQUN6QixJQUFJO0dBQ0gsT0FBTyxNQUFNLGtCQUFrQjtJQUM5QixNQUFNLEdBQUc7R0FDVixRQUFRLEtBQUssdUJBQXVCO0dBQ3BDLFFBQVEsS0FBSztHQUNiLE9BQU87Ozs7K0NBR1QiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nTWF0ZXJpYWwnXSk7XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdCYXNrZXRDb250cm9sbGVyJywgQmFza2V0Q29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEJhc2tldENvbnRyb2xsZXIoJG1kU2lkZW5hdiwgJG1kTWVkaWEsIGFsbExpc3RzU2VydmljZSwgJG1kVG9hc3QpIHtcblx0dmFyIHZtID0gdGhpcztcblx0dm0udG9nZ2xlTGlzdHNWaWV3ID0gdG9nZ2xlTGlzdHNWaWV3O1xuXHR2bS5jbG9zZUxpc3RzVmlldyA9IGNsb3NlTGlzdHNWaWV3O1xuXHR2bS5kZWxldGVMaXN0QnlJZCA9IGRlbGV0ZUxpc3RCeUlkO1xuXG5cdHZtLiRtZE1lZGlhID0gJG1kTWVkaWE7XG5cdGlmICghdm0uJG1kTWVkaWEoJ2xnJykpIHtcblx0XHR2bS5saXN0c1ZpZXdPcGVuID0gdHJ1ZTtcblx0fVxuXG5cdGZ1bmN0aW9uIHRvZ2dsZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykudG9nZ2xlKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBjbG9zZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykuY2xvc2UoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGRlbGV0ZUxpc3RCeUlkKGlkKSB7XG5cdFx0Ly8gc2hvdyB1bmRvIHRvYXN0XG5cdFx0dmFyIGRlbGV0ZVRvYXN0ID0gJG1kVG9hc3Quc2ltcGxlKCkuY29udGVudCgnTGlzdCBEZWxldGVkJykuYWN0aW9uKCdVbmRvJykuaGlnaGxpZ2h0QWN0aW9uKHRydWUpO1xuXHRcdCRtZFRvYXN0LnNob3coZGVsZXRlVG9hc3QpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZSA9PT0gJ29rJykge1xuXHRcdFx0XHR1bmRvRGVsZXRlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcGVyZm9ybSBkZWxldGVcblx0XHRhbGxMaXN0c1NlcnZpY2UuZGVsZXRlTGlzdChpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRtZFRvYXN0LmhpZGUoKTtcblx0XHR9KTtcblx0XHQvLyBoaWRlIGN1cnJlbnRseSBlZGl0aW5nIGxpc3Rcblx0XHQkbWRTaWRlbmF2KCdsZWZ0Jykub3BlbigpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdW5kb0RlbGV0ZSgpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2UuY2FuY2VsRGVsZXRlKCk7XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1zQ29udHJvbGxlcicsIEl0ZW1zQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1zQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UsICRtZFRvYXN0KSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cblx0dm0uYWRkSXRlbSA9IGFkZEl0ZW07XG5cdHZtLmdldEN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXHR2bS5kZWxldGVJdGVtID0gZGVsZXRlSXRlbTtcblx0dm0uc2VhcmNoTmFtZSA9IHNlYXJjaE5hbWU7XG5cdHZtLmdldFBob3RvID0gZ2V0UGhvdG87XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHRpZiAoIWFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpKSB7XG5cdFx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0XHR9XG5cdFx0dm0uZ2V0Q3VycmVudExpc3QoKS5hZGRJdGVtKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWxldGVJdGVtKGlkKSB7XG5cdFx0Ly8gc2hvdyB1bmRvIHRvYXN0XG5cdFx0dmFyIGRlbGV0ZVRvYXN0ID0gJG1kVG9hc3Quc2ltcGxlKCkuY29udGVudCgnSXRlbSBEZWxldGVkJykuYWN0aW9uKCdVbmRvJykuaGlnaGxpZ2h0QWN0aW9uKHRydWUpO1xuXHRcdCRtZFRvYXN0LnNob3coZGVsZXRlVG9hc3QpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZSA9PT0gJ29rJykge1xuXHRcdFx0XHR1bmRvRGVsZXRlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcGVyZm9ybSBkZWxldGVcblx0XHRhbGxMaXN0c1NlcnZpY2UuZGVsZXRlSXRlbShpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRtZFRvYXN0LmhpZGUoKTtcblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVuZG9EZWxldGUoKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmNhbmNlbERlbGV0ZSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2VhcmNoTmFtZShxdWVyeSkge1xuXHRcdHZhciBhbGxJdGVtcyA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpLml0ZW1zO1xuXHRcdHZhciBuYW1lcyA9IFtxdWVyeV07XG5cdFx0Ly8gZ2V0IGxpc3Qgb2YgYWxsIHVuaXF1ZSBuYW1lc1xuXHRcdGZvciAodmFyIGk9MDsgaTxhbGxJdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIG5hbWUgPSBhbGxJdGVtc1tpXS5hc3NpZ247XG5cdFx0XHRpZiAobmFtZSAmJiBuYW1lcy5pbmRleE9mKG5hbWUpIDwgMCkgeyAvLyBpZiBuYW1lIGlzbid0IGFscmVhZHkgaW4gbGlzdFxuXHRcdFx0XHRuYW1lcy5wdXNoKG5hbWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBmaW5kIG1hdGNoZWQgbmFtZXNcblx0XHR2YXIgbWF0Y2hlcyA9IG5hbWVzLmZpbHRlcihmdW5jdGlvbihuYW1lKSB7XG5cdFx0XHRyZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcnkudG9Mb3dlckNhc2UoKSkgPT09IDA7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIG1hdGNoZXM7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRQaG90byhpbmRleCwgZmlsZSkge1xuXHRcdHZtLmdldEN1cnJlbnRMaXN0KCkuaXRlbXNbaW5kZXhdLnBob3RvID0gZmlsZTtcblx0fVxuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignTGlzdHNDb250cm9sbGVyJywgTGlzdHNDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gTGlzdHNDb250cm9sbGVyKGFsbExpc3RzU2VydmljZSkge1xuXG5cdHZhciB2bSA9IHRoaXM7XG5cdFxuXHR2bS5saXN0cyA9IGFsbExpc3RzU2VydmljZS5saXN0cztcblxuXHR2bS5hZGRMaXN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdH07XG5cblx0dm0uY3VycmVudExpc3QgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5kaXJlY3RpdmUoJ2JrSXRlbScsIGJrSXRlbSk7XG5cbmZ1bmN0aW9uIGJrSXRlbSgpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdHRlbXBsYXRlVXJsOiAnLi90ZW1wbGF0ZXMvYmtJdGVtLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdJdGVtc0NvbnRyb2xsZXInLFxuXHRcdGNvbnRyb2xsZXJBczogJ0l0ZW1zJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHQvLyBFbmQgY3VzdG9tIGVkaXQgbW9kZSBvbiBjbGlja1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cblx0XHR2YXIgbGlzdFZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbYmstbGlzdC12aWV3XScpO1xuXHRcdHZhciBhc3NpZ25JbnB1dDtcblxuXHRcdC8vIEVudGVyIGFzc2lnbiBtb2RlXG5cdFx0ZnVuY3Rpb24gZW50ZXJBc3NpZ25Nb2RlKCkge1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcyhcImVkaXRhYmxlIGVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdFx0YXNzaWduSW5wdXQuc2VsZWN0KCk7IC8vIGlPUyBmaXhcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGFzc2lnbklucHV0LmZvY3VzKCk7IH0sIDEwMCk7IC8vIGRlbGF5IHRvIHdhaXQgZm9yIGNsYXNzZXMgdG8gYXBwbHlcblx0XHRcdGxpc3RWaWV3LmNsYXNzTGlzdC5hZGQoXCJoYXNFZGl0YWJsZUl0ZW1cIik7XG5cdFx0fVxuXG5cdFx0dmFyIHBob3RvSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0LnBob3RvJyk7XG5cdFx0ZnVuY3Rpb24gcGhvdG9Qcm9tcHQoKSB7XG5cdFx0XHRwaG90b0lucHV0LmNsaWNrKCk7XG5cdFx0fVxuXHRcdHBob3RvSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIGZpbGUgPSBlLnRhcmdldC5maWxlc1swXTtcblx0XHRcdGlmIChmaWxlKSB7XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXHRcdFx0XHRyZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0c2NvcGUuSXRlbXMuZ2V0UGhvdG8oYXR0cnMuaXRlbUlkLCByZWFkZXIucmVzdWx0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIFRvZ2dsZSBpdGVtIGRvbmVuZXNzXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24uZG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50LnRvZ2dsZUNsYXNzKFwiZG9uZVwiKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlXCIpO1xuXHRcdFx0bGlzdFZpZXcuY2xhc3NMaXN0LnJlbW92ZShcImhhc0VkaXRhYmxlSXRlbVwiKTtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cdFx0XG5cdFx0Ly8gUmVhdHRhY2ggbGlzdGVuZXIgdG8gYnV0dG9ucyBvbiBzY3JlZW4gc2l6ZSBjaGFuZ2Vcblx0XHR2YXIgYXNzaWduQnV0dG9uID0gZ2V0QXNzaWduQnV0dG9uKCk7XG5cdFx0dmFyIHBob3RvQnV0dG9uID0gZ2V0UGhvdG9CdXR0b24oKTtcblx0XHRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBzY29wZS5NYWluLiRtZE1lZGlhKCdtZCcpOyB9LCBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChhc3NpZ25CdXR0b24pIHtcblx0XHRcdFx0YXNzaWduQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJBc3NpZ25Nb2RlKTtcblx0XHRcdH1cblx0XHRcdGFzc2lnbkJ1dHRvbiA9IGdldEFzc2lnbkJ1dHRvbigpO1xuXHRcdFx0aWYgKGFzc2lnbkJ1dHRvbikge1xuXHRcdFx0XHRhc3NpZ25CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlbnRlckFzc2lnbk1vZGUpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHBob3RvQnV0dG9uKSB7XG5cdFx0XHRcdHBob3RvQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcGhvdG9Qcm9tcHQpO1xuXHRcdFx0fVxuXHRcdFx0cGhvdG9CdXR0b24gPSBnZXRQaG90b0J1dHRvbigpO1xuXHRcdFx0aWYgKHBob3RvQnV0dG9uKSB7XG5cdFx0XHRcdHBob3RvQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcGhvdG9Qcm9tcHQpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gY2xpY2tpbmcgYnV0dG9uXG5cdFx0XHRlbGVtZW50LmZpbmQoJ2J1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdFx0Ly8gaU9TIGZpeCB0byBkZXNlbGVjdCBidXR0b25cblx0XHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gRGVsYXkgcXVlcnlpbmcgZm9yIGlucHV0IHVudGlsIGVsZW1lbnQgY3JlYXRlZFxuXHRcdFx0YXNzaWduSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ21kLWF1dG9jb21wbGV0ZS5hc3NpZ24gaW5wdXQnKTtcblx0XHRcdC8vIFByZXZlbnQgZW5kaW5nIGVkaXQgbW9kZSB3aGVuIHNlbGVjdGluZyBpbnB1dFxuXHRcdFx0ZWxlbWVudC5maW5kKCdtZC1pbnB1dC1jb250YWluZXInKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHR9KTtcblx0XHR9LCAxMDApO1xuXG5cdFx0Ly8gTGVhdmUgY3VzdG9tIGVkaXQgbW9kZVxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0KCkge1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVDbGFzcyhcImVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGdldEFzc2lnbkJ1dHRvbigpIHtcblx0XHRcdHJldHVybiBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5hc3NpZ24nKTtcblx0XHR9XG5cdFx0ZnVuY3Rpb24gZ2V0UGhvdG9CdXR0b24oKSB7XG5cdFx0XHRyZXR1cm4gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24ucGhvdG8nKTtcblx0XHR9XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0SW5mbycsIGJrTGlzdEluZm8pO1xuXG5mdW5jdGlvbiBia0xpc3RJbmZvKGFsbExpc3RzU2VydmljZSkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0dGVtcGxhdGVVcmw6ICcuL3RlbXBsYXRlcy9ia0xpc3RJbmZvLmh0bWwnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7IGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChzY29wZS5saXN0KSB9KTtcblx0XHR9KTtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0VmlldycsIGJrTGlzdFZpZXcpO1xuXG5mdW5jdGlvbiBia0xpc3RWaWV3KCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0Y29udHJvbGxlcjogJ0l0ZW1zQ29udHJvbGxlcicsXG5cdFx0Y29udHJvbGxlckFzOiAnSXRlbXMnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXG5cdFx0dmFyIHN1YmhlYWRlciA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlcicpO1xuXHRcdHZhciB0aXRsZUlucHV0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyIGlucHV0Jyk7XG5cblx0XHQvLyBDbGljayBvdXRzaWRlIG9mIGl0ZW1zIHRvIGV4aXQgZWRpdCBtb2RlXG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0aWYgKGUudGFyZ2V0KSB7XG5cdFx0XHRcdHZhciBia0l0ZW0gPSBpc0JrSXRlbUNoaWxkKGUudGFyZ2V0KTtcblx0XHRcdFx0aWYgKGJrSXRlbSkge1xuXHRcdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUoYmtJdGVtKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gUHJldmVudCBsb3NpbmcgZm9jdXMgb24gYnV0dG9uIGNsaWNrc1xuXHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblxuXHRcdC8vIE1ha2UgdGl0bGUgZWRpdGFibGUgb24gY2xpY2tcblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgLm5hbWUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0bWFrZVRpdGxlRWRpdGFibGUoKTtcblx0XHR9KTtcblxuXHRcdC8vIEV4aXQgdGl0bGUgZWRpdCBtb2RlIG9uIHRpdGxlIGlucHV0IGxvc2luZyBmb2N1c1xuXHRcdHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJykuY2xhc3NMaXN0LnJlbW92ZSgnZWRpdGFibGUnKTtcblx0XHR9KTtcblxuXHRcdC8vIFN3aXRjaCBmb2N1cyB0byBuZXcgaXRlbVxuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLm5ld0l0ZW0nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdHZhciBuZXdJdGVtID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdiay1pdGVtJyk7XG5cdFx0XHRpZiAobmV3SXRlbSkge1xuXHRcdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0XHRtYWtlSXRlbUVkaXRhYmxlKG5ld0l0ZW0pO1xuXHRcdFx0XHR2YXIgdGl0bGUgPSBuZXdJdGVtLnF1ZXJ5U2VsZWN0b3IoJy50aXRsZSBpbnB1dCcpO1xuXHRcdFx0XHQvLyBmb2N1cyB0aXRsZSBmaWVsZCBieSBkZWZhdWx0OyBkZWxheSB0byB3YWl0IGZvciBzdHlsZSB0byB0YWtlIGVmZmVjdFxuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB0aXRsZS5mb2N1cygpOyB9LCAxMDApO1xuXHRcdFx0XHR0aXRsZS5zZWxlY3QoKTsgLy8gaU9TIGZpeFxuXHRcdFx0XHR3aW5kb3cuc2Nyb2xsKDEsMSk7IC8vIGlPUyBmaXhcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGZ1bmN0aW9uIG1ha2VUaXRsZUVkaXRhYmxlKCkge1xuXHRcdFx0c3ViaGVhZGVyLmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlJyk7XG5cdFx0XHR0aXRsZUlucHV0LmZvY3VzKCk7XG5cdFx0fVxuXHRcdHNjb3BlLm1ha2VUaXRsZUVkaXRhYmxlID0gbWFrZVRpdGxlRWRpdGFibGU7XG5cblx0XHRmdW5jdGlvbiBkZXNlbGVjdEFsbCgpIHtcblx0XHRcdGVsZW1lbnQuZmluZCgnYmstaXRlbScpLnJlbW92ZUNsYXNzKFwiZWRpdGFibGUgZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKCdoYXNFZGl0YWJsZUl0ZW0nKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBtYWtlSXRlbUVkaXRhYmxlKGl0ZW0pIHtcblx0XHRcdGl0ZW0uY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGlzQmtJdGVtQ2hpbGQobm9kZSkge1xuXHRcdFx0dmFyIGlzQ2FyZENvbnRlbnQgPSBmYWxzZTtcblx0XHRcdHdoaWxlIChub2RlICYmIG5vZGUgIT09IGVsZW1lbnRbMF0pIHtcblx0XHRcdFx0aWYgKG5vZGUubm9kZU5hbWUgPT09ICdNRC1DQVJELUNPTlRFTlQnKSB7XG5cdFx0XHRcdFx0aXNDYXJkQ29udGVudCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGlzQ2FyZENvbnRlbnQgJiYgbm9kZS5ub2RlTmFtZSA9PT0gJ0JLLUlURU0nKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5vZGU7XG5cdFx0XHRcdH1cblx0XHRcdFx0bm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0l0ZW1PYmplY3QnLCBJdGVtT2JqZWN0KTtcblxuZnVuY3Rpb24gSXRlbU9iamVjdCgpIHtcblxuXHR2YXIgaXRlbU9iamVjdCA9IGZ1bmN0aW9uKGlkKSB7XG5cdFx0dGhpcy5pZCA9IGlkO1xuXHRcdHRoaXMudGl0bGUgPSAnJztcblx0XHR0aGlzLm5vdGUgPSAnJztcblx0XHR0aGlzLmFzc2lnbiA9ICcnO1xuXHRcdHRoaXMuZG9uZSA9IGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIGl0ZW1PYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdMaXN0T2JqZWN0JywgTGlzdE9iamVjdCk7XG5cbmZ1bmN0aW9uIExpc3RPYmplY3QoSXRlbU9iamVjdCkge1xuXG5cdHZhciBsaXN0T2JqZWN0ID0gZnVuY3Rpb24oaWQsIG5hbWUpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLml0ZW1zID0gW107XG5cdFx0dGhpcy5hZGRJdGVtID0gYWRkSXRlbTtcblx0XHR0aGlzLmdldEl0ZW1JbmRleEJ5SWQgPSBnZXRJdGVtSW5kZXhCeUlkO1xuXHRcdHRoaXMuZ2V0RGVzY3JpcHRpb24gPSBnZXREZXNjcmlwdGlvbjtcblx0fVxuXHR2YXIgbmV4dEl0ZW1JZCA9IDA7XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHR0aGlzLml0ZW1zLnVuc2hpZnQobmV3IEl0ZW1PYmplY3QobmV4dEl0ZW1JZCsrKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRJdGVtSW5kZXhCeUlkKGlkKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuaXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICh0aGlzLml0ZW1zW2ldLmlkID09PSBpZCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBnZXREZXNjcmlwdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5pdGVtcy5tYXAoZnVuY3Rpb24oaXRlbSkgeyBpZiAoIWl0ZW0uZG9uZSkgcmV0dXJuIGl0ZW0udGl0bGUgfSlcblx0XHRcdFx0XHRcdC5maWx0ZXIoZnVuY3Rpb24odmFsKSB7IHJldHVybiB2YWw7IH0pLy8gZ2V0IG5vbi1lbXB0eSBpdGVtc1xuXHRcdFx0XHRcdFx0LmpvaW4oJywgJyk7XG5cdH1cblxuXHRyZXR1cm4gbGlzdE9iamVjdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ2FsbExpc3RzU2VydmljZScsIGFsbExpc3RzU2VydmljZSk7XG5cbmZ1bmN0aW9uIGFsbExpc3RzU2VydmljZShMaXN0T2JqZWN0LCAkcSkge1xuXG5cdHZhciBsaXN0cyA9IFtdO1xuXHR2YXIgY3VycmVudExpc3RJZCA9IHVuZGVmaW5lZDtcblx0dmFyIGRlbGV0ZVRpbWVyO1xuXHR2YXIgZGVsZXRlRGVmZXI7XG5cdHZhciBkZWxldGluZ0xpc3RJZDtcblx0dmFyIGRlbGV0aW5nSXRlbUlkO1xuXG5cdHJldHVybiB7XG5cdFx0YWRkOiBhZGQsXG5cdFx0bGlzdHM6IGxpc3RzLFxuXHRcdHNldEN1cnJlbnRMaXN0OiBzZXRDdXJyZW50TGlzdCxcblx0XHRnZXRDdXJyZW50TGlzdDogZ2V0Q3VycmVudExpc3QsXG5cdFx0ZGVsZXRlTGlzdDogZGVsZXRlTGlzdCxcblx0XHRkZWxldGVJdGVtOiBkZWxldGVJdGVtLFxuXHRcdGNhbmNlbERlbGV0ZTogY2FuY2VsRGVsZXRlXG5cdH07XG5cblx0ZnVuY3Rpb24gYWRkKCkge1xuXHRcdGxpc3RzLnVuc2hpZnQoXG5cdFx0XHRuZXcgTGlzdE9iamVjdChnZXRVbmlxSWQoKSwgXCJOZXcgTGlzdCBcIisobGlzdHMubGVuZ3RoKzEpKVxuXHRcdCk7XG5cdFx0cmV0dXJuIGxpc3RzWzBdO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0VW5pcUlkKCkge1xuXHRcdHZhciBsZW5ndGggPSA4O1xuXHRcdHJldHVybiAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKk1hdGgucG93KDM2LGxlbmd0aCkpLnRvU3RyaW5nKDM2KSkuc2xpY2UoLWxlbmd0aCk7XG5cdH1cblxuXHRmdW5jdGlvbiBmaW5kTGlzdEluZGV4QnlJZChpZCkge1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKGxpc3RzW2ldLmlkID09PSBpZCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBkZWxldGVMaXN0KGlkKSB7XG5cdFx0Ly8gU2V0IGxpc3Qgc3RhdHVzIGZvciBkZWxldGlvblxuXHRcdHZhciBpbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGlkKTtcblx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0bGlzdHNbaW5kZXhdLmRlbGV0aW5nID0gdHJ1ZTtcblx0XHRcdGN1cnJlbnRMaXN0SWQgPSAnJztcblx0XHR9XG5cdFx0Ly8gZGVsZXRlIGRlbGF5XG5cdFx0ZGVsZXRpbmdMaXN0SWQgPSBpZDtcblx0XHRkZWxldGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0ZGVsZXRlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gZ2V0IGluZGV4IGFnYWluLCBhcyBpdCBtYXkgaGF2ZSBjaGFuZ2VkXG5cdFx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChpZCk7XG5cdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRsaXN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRkZWxldGVEZWZlci5yZXNvbHZlKCdkZWxldGVkJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkZWxldGVEZWZlci5yZWplY3QoJ2xpc3ROb3RGb3VuZCcpO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdMaXN0SWQgPSB1bmRlZmluZWQ7XG5cdFx0fSwgNTAwMCk7XG5cdFx0cmV0dXJuIGRlbGV0ZURlZmVyLnByb21pc2U7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWxldGVJdGVtKGlkKSB7XG5cdFx0Ly8gU2V0IGxpc3Qgc3RhdHVzIGZvciBkZWxldGlvblxuXHRcdHZhciBpbmRleCA9IGdldEN1cnJlbnRMaXN0KCkuZ2V0SXRlbUluZGV4QnlJZChpZCk7XG5cdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdGdldEN1cnJlbnRMaXN0KCkuaXRlbXNbaW5kZXhdLmRlbGV0aW5nID0gdHJ1ZTtcblx0XHR9XG5cdFx0Ly8gZGVsZXRlIGRlbGF5XG5cdFx0ZGVsZXRpbmdJdGVtSWQgPSBpZDtcblx0XHRkZWxldGluZ0xpc3RJZCA9IGdldEN1cnJlbnRMaXN0KCkuaWQ7IC8vIHN0b3JlIGxpc3QgaWQgaW4gY2FzZSBjdXJyZW50IGxpc3QgaXMgY2hhbmdlZFxuXHRcdGRlbGV0ZURlZmVyID0gJHEuZGVmZXIoKTtcblx0XHRkZWxldGVUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBnZXQgaW5kZXggYWdhaW4sIGFzIGl0IG1heSBoYXZlIGNoYW5nZWRcblx0XHRcdHZhciBsaXN0SW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChkZWxldGluZ0xpc3RJZCk7XG5cdFx0XHRpZiAobGlzdEluZGV4ID49IDApIHtcblx0XHRcdFx0dmFyIGluZGV4ID0gbGlzdHNbbGlzdEluZGV4XS5nZXRJdGVtSW5kZXhCeUlkKGlkKTtcblx0XHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0XHRsaXN0c1tsaXN0SW5kZXhdLml0ZW1zLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdFx0ZGVsZXRlRGVmZXIucmVzb2x2ZSgnZGVsZXRlZCcpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGRlbGV0ZURlZmVyLnJlamVjdCgnbGlzdE5vdEZvdW5kJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nSXRlbUlkID0gdW5kZWZpbmVkO1xuXHRcdH0sIDUwMDApO1xuXHRcdHJldHVybiBkZWxldGVEZWZlci5wcm9taXNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2FuY2VsRGVsZXRlKCkge1xuXHRcdGNsZWFyVGltZW91dChkZWxldGVUaW1lcik7XG5cdFx0aWYgKGRlbGV0aW5nSXRlbUlkKSB7XG5cdFx0XHR2YXIgbGlzdCA9IGxpc3RzW2ZpbmRMaXN0SW5kZXhCeUlkKGRlbGV0aW5nTGlzdElkKV07XG5cdFx0XHR2YXIgaW5kZXggPSBsaXN0LmdldEl0ZW1JbmRleEJ5SWQoZGVsZXRpbmdJZCk7XG5cdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRsaXN0Lml0ZW1zW2luZGV4XS5kZWxldGluZyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdJdGVtSWQgPSB1bmRlZmluZWQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBpbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGRlbGV0aW5nSWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdHNbaW5kZXhdLmRlbGV0aW5nID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGluZ0xpc3RJZCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdkZWxldGVDYW5jZWxsZWQnKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNldEN1cnJlbnRMaXN0KGxpc3QpIHtcblx0XHRpZiAodHlwZW9mIGxpc3QgPT09ICdudW1iZXInKSB7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gZmluZExpc3RJbmRleEJ5SWQobGlzdCk7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgbGlzdCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGN1cnJlbnRMaXN0SWQgPSBsaXN0LmlkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ3Vua25vd24gaW5wdXQgZm9yIGxpc3Q6ICcrIHR5cGVvZiBsaXN0KTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRDdXJyZW50TGlzdCgpIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIGxpc3RzW2ZpbmRMaXN0SW5kZXhCeUlkKGN1cnJlbnRMaXN0SWQpXTtcblx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdGNvbnNvbGUud2FybignTGlzdCBub3QgZm91bmQuIElEOiAnK2N1cnJlbnRMaXN0SWQpO1xuXHRcdFx0Y29uc29sZS53YXJuKGxpc3RzKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=