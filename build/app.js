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
	.controller('ItemController', ItemController);

function ItemController(allListsService) {
	var vm = this;
	vm.fabIsOpen = false;
	vm.searchName = searchName;

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
}
ItemController.$inject = ["allListsService"];

angular
	.module('app')
	.controller('ItemsController', ItemsController);

function ItemsController(allListsService, $mdToast) {
	var vm = this;

	vm.addItem = addItem;
	vm.getCurrentList = allListsService.getCurrentList;
	vm.deleteItem = deleteItem;

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
		controller: 'ItemController',
		controllerAs: 'Item'
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
		
		// Reattach listener to buttons on screen size change
		var assignButton = getAssignButton();
		scope.$watch(function() { return scope.Main.$mdMedia('md'); }, function() {
			if (assignButton) {
				assignButton.removeEventListener('click', enterAssignMode);
			}
			assignButton = getAssignButton();
			if (assignButton) {
				assignButton.addEventListener('click', enterAssignMode);
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

		// Toggle item doneness
		element[0].querySelector('button.done').addEventListener('click', function() {
			element.toggleClass("done").removeClass("editable");
			listView.classList.remove("hasEditableItem");
			deselect();
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
			var index = getCurrentList().getItemIndexById(id);
			if (index >= 0) {
				getCurrentList().items.splice(index, 1);
				deleteDefer.resolve('deleted');
			} else {
				deleteDefer.reject('listNotFound');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0l0ZW1zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0xpc3RzQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvYmtJdGVtLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RJbmZvLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RWaWV3LmpzIiwic2VydmljZXMvSXRlbU9iamVjdC5qcyIsInNlcnZpY2VzL0xpc3RPYmplY3QuanMiLCJzZXJ2aWNlcy9hbGxMaXN0c1NlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxNQUFNLFFBQVEsT0FBTyxPQUFPLENBQUM7QUFDakM7QUNEQTtFQUNFLE9BQU87RUFDUCxXQUFXLG9CQUFvQjs7QUFFakMsU0FBUyxpQkFBaUIsWUFBWSxVQUFVLGlCQUFpQixVQUFVO0NBQzFFLElBQUksS0FBSztDQUNULEdBQUcsa0JBQWtCO0NBQ3JCLEdBQUcsaUJBQWlCO0NBQ3BCLEdBQUcsaUJBQWlCOztDQUVwQixHQUFHLFdBQVc7Q0FDZCxJQUFJLENBQUMsR0FBRyxTQUFTLE9BQU87RUFDdkIsR0FBRyxnQkFBZ0I7OztDQUdwQixTQUFTLGtCQUFrQjtFQUMxQixXQUFXLFFBQVE7OztDQUdwQixTQUFTLGlCQUFpQjtFQUN6QixXQUFXLFFBQVE7OztDQUdwQixTQUFTLGVBQWUsSUFBSTs7RUFFM0IsSUFBSSxjQUFjLFNBQVMsU0FBUyxRQUFRLGdCQUFnQixPQUFPLFFBQVEsZ0JBQWdCO0VBQzNGLFNBQVMsS0FBSyxhQUFhLEtBQUssU0FBUyxVQUFVO0dBQ2xELElBQUksYUFBYSxNQUFNO0lBQ3RCOzs7O0VBSUYsZ0JBQWdCLFdBQVcsSUFBSSxLQUFLLFdBQVc7R0FDOUMsU0FBUzs7O0VBR1YsV0FBVyxRQUFROzs7Q0FHcEIsU0FBUyxhQUFhO0VBQ3JCLGdCQUFn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Z0JBQWdCLGtCQUFrQjtTQUM1QixJQUFJLE9BQU8sU0FBUyxVQUFVO0dBQ3BDLGdCQUFnQixLQUFLO1NBQ2Y7R0FDTixRQUFRLEtBQUssNEJBQTRCLE9BQU87R0FDaEQsUUFBUSxLQUFLOzs7O0NBSWYsU0FBUyxpQkFBaUI7RUFDekIsSUFBSTtHQUNILE9BQU8sTUFBTSxrQkFBa0I7SUFDOUIsTUFBTSxHQUFHO0dBQ1YsUUFBUSxLQUFLLHVCQUF1QjtHQUNwQyxRQUFRLEtBQUs7R0FDYixPQUFPOzs7OytDQUdUIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyduZ01hdGVyaWFsJ10pO1xuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignQmFza2V0Q29udHJvbGxlcicsIEJhc2tldENvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBCYXNrZXRDb250cm9sbGVyKCRtZFNpZGVuYXYsICRtZE1lZGlhLCBhbGxMaXN0c1NlcnZpY2UsICRtZFRvYXN0KSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cdHZtLnRvZ2dsZUxpc3RzVmlldyA9IHRvZ2dsZUxpc3RzVmlldztcblx0dm0uY2xvc2VMaXN0c1ZpZXcgPSBjbG9zZUxpc3RzVmlldztcblx0dm0uZGVsZXRlTGlzdEJ5SWQgPSBkZWxldGVMaXN0QnlJZDtcblxuXHR2bS4kbWRNZWRpYSA9ICRtZE1lZGlhO1xuXHRpZiAoIXZtLiRtZE1lZGlhKCdsZycpKSB7XG5cdFx0dm0ubGlzdHNWaWV3T3BlbiA9IHRydWU7XG5cdH1cblxuXHRmdW5jdGlvbiB0b2dnbGVMaXN0c1ZpZXcoKSB7XG5cdFx0JG1kU2lkZW5hdignbGVmdCcpLnRvZ2dsZSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2xvc2VMaXN0c1ZpZXcoKSB7XG5cdFx0JG1kU2lkZW5hdignbGVmdCcpLmNsb3NlKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWxldGVMaXN0QnlJZChpZCkge1xuXHRcdC8vIHNob3cgdW5kbyB0b2FzdFxuXHRcdHZhciBkZWxldGVUb2FzdCA9ICRtZFRvYXN0LnNpbXBsZSgpLmNvbnRlbnQoJ0xpc3QgRGVsZXRlZCcpLmFjdGlvbignVW5kbycpLmhpZ2hsaWdodEFjdGlvbih0cnVlKTtcblx0XHQkbWRUb2FzdC5zaG93KGRlbGV0ZVRvYXN0KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2UgPT09ICdvaycpIHtcblx0XHRcdFx0dW5kb0RlbGV0ZSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdC8vIHBlcmZvcm0gZGVsZXRlXG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmRlbGV0ZUxpc3QoaWQpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkbWRUb2FzdC5oaWRlKCk7XG5cdFx0fSk7XG5cdFx0Ly8gaGlkZSBjdXJyZW50bHkgZWRpdGluZyBsaXN0XG5cdFx0JG1kU2lkZW5hdignbGVmdCcpLm9wZW4oKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVuZG9EZWxldGUoKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmNhbmNlbERlbGV0ZSgpO1xuXHR9XG59XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdJdGVtQ29udHJvbGxlcicsIEl0ZW1Db250cm9sbGVyKTtcblxuZnVuY3Rpb24gSXRlbUNvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cdHZtLmZhYklzT3BlbiA9IGZhbHNlO1xuXHR2bS5zZWFyY2hOYW1lID0gc2VhcmNoTmFtZTtcblxuXHRmdW5jdGlvbiBzZWFyY2hOYW1lKHF1ZXJ5KSB7XG5cdFx0dmFyIGFsbEl0ZW1zID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0KCkuaXRlbXM7XG5cdFx0dmFyIG5hbWVzID0gW3F1ZXJ5XTtcblx0XHQvLyBnZXQgbGlzdCBvZiBhbGwgdW5pcXVlIG5hbWVzXG5cdFx0Zm9yICh2YXIgaT0wOyBpPGFsbEl0ZW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgbmFtZSA9IGFsbEl0ZW1zW2ldLmFzc2lnbjtcblx0XHRcdGlmIChuYW1lICYmIG5hbWVzLmluZGV4T2YobmFtZSkgPCAwKSB7IC8vIGlmIG5hbWUgaXNuJ3QgYWxyZWFkeSBpbiBsaXN0XG5cdFx0XHRcdG5hbWVzLnB1c2gobmFtZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIGZpbmQgbWF0Y2hlZCBuYW1lc1xuXHRcdHZhciBtYXRjaGVzID0gbmFtZXMuZmlsdGVyKGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRcdHJldHVybiBuYW1lLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihxdWVyeS50b0xvd2VyQ2FzZSgpKSA9PT0gMDtcblx0XHR9KTtcblx0XHRyZXR1cm4gbWF0Y2hlcztcblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignSXRlbXNDb250cm9sbGVyJywgSXRlbXNDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gSXRlbXNDb250cm9sbGVyKGFsbExpc3RzU2VydmljZSwgJG1kVG9hc3QpIHtcblx0dmFyIHZtID0gdGhpcztcblxuXHR2bS5hZGRJdGVtID0gYWRkSXRlbTtcblx0dm0uZ2V0Q3VycmVudExpc3QgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3Q7XG5cdHZtLmRlbGV0ZUl0ZW0gPSBkZWxldGVJdGVtO1xuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0aWYgKCFhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKSkge1xuXHRcdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdFx0fVxuXHRcdHZtLmdldEN1cnJlbnRMaXN0KCkuYWRkSXRlbSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlSXRlbShpZCkge1xuXHRcdC8vIHNob3cgdW5kbyB0b2FzdFxuXHRcdHZhciBkZWxldGVUb2FzdCA9ICRtZFRvYXN0LnNpbXBsZSgpLmNvbnRlbnQoJ0l0ZW0gRGVsZXRlZCcpLmFjdGlvbignVW5kbycpLmhpZ2hsaWdodEFjdGlvbih0cnVlKTtcblx0XHQkbWRUb2FzdC5zaG93KGRlbGV0ZVRvYXN0KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2UgPT09ICdvaycpIHtcblx0XHRcdFx0dW5kb0RlbGV0ZSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdC8vIHBlcmZvcm0gZGVsZXRlXG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmRlbGV0ZUl0ZW0oaWQpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkbWRUb2FzdC5oaWRlKCk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiB1bmRvRGVsZXRlKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5jYW5jZWxEZWxldGUoKTtcblx0fVxuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignTGlzdHNDb250cm9sbGVyJywgTGlzdHNDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gTGlzdHNDb250cm9sbGVyKGFsbExpc3RzU2VydmljZSkge1xuXG5cdHZhciB2bSA9IHRoaXM7XG5cdFxuXHR2bS5saXN0cyA9IGFsbExpc3RzU2VydmljZS5saXN0cztcblxuXHR2bS5hZGRMaXN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdH07XG5cblx0dm0uY3VycmVudExpc3QgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5kaXJlY3RpdmUoJ2JrSXRlbScsIGJrSXRlbSk7XG5cbmZ1bmN0aW9uIGJrSXRlbSgpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdHRlbXBsYXRlVXJsOiAnLi90ZW1wbGF0ZXMvYmtJdGVtLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdJdGVtQ29udHJvbGxlcicsXG5cdFx0Y29udHJvbGxlckFzOiAnSXRlbSdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0Ly8gRW5kIGN1c3RvbSBlZGl0IG1vZGUgb24gY2xpY2tcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRkZXNlbGVjdCgpO1xuXHRcdH0pO1xuXG5cdFx0dmFyIGxpc3RWaWV3ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2JrLWxpc3Qtdmlld10nKTtcblx0XHR2YXIgYXNzaWduSW5wdXQ7XG5cblx0XHQvLyBFbnRlciBhc3NpZ24gbW9kZVxuXHRcdGZ1bmN0aW9uIGVudGVyQXNzaWduTW9kZSgpIHtcblx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGFzc2lnbklucHV0LnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBhc3NpZ25JbnB1dC5mb2N1cygpOyB9LCAxMDApOyAvLyBkZWxheSB0byB3YWl0IGZvciBjbGFzc2VzIHRvIGFwcGx5XG5cdFx0XHRsaXN0Vmlldy5jbGFzc0xpc3QuYWRkKFwiaGFzRWRpdGFibGVJdGVtXCIpO1xuXHRcdH1cblx0XHRcblx0XHQvLyBSZWF0dGFjaCBsaXN0ZW5lciB0byBidXR0b25zIG9uIHNjcmVlbiBzaXplIGNoYW5nZVxuXHRcdHZhciBhc3NpZ25CdXR0b24gPSBnZXRBc3NpZ25CdXR0b24oKTtcblx0XHRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBzY29wZS5NYWluLiRtZE1lZGlhKCdtZCcpOyB9LCBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChhc3NpZ25CdXR0b24pIHtcblx0XHRcdFx0YXNzaWduQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJBc3NpZ25Nb2RlKTtcblx0XHRcdH1cblx0XHRcdGFzc2lnbkJ1dHRvbiA9IGdldEFzc2lnbkJ1dHRvbigpO1xuXHRcdFx0aWYgKGFzc2lnbkJ1dHRvbikge1xuXHRcdFx0XHRhc3NpZ25CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlbnRlckFzc2lnbk1vZGUpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gY2xpY2tpbmcgYnV0dG9uXG5cdFx0XHRlbGVtZW50LmZpbmQoJ2J1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdFx0Ly8gaU9TIGZpeCB0byBkZXNlbGVjdCBidXR0b25cblx0XHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvLyBUb2dnbGUgaXRlbSBkb25lbmVzc1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmRvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudC50b2dnbGVDbGFzcyhcImRvbmVcIikucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZVwiKTtcblx0XHRcdGxpc3RWaWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJoYXNFZGl0YWJsZUl0ZW1cIik7XG5cdFx0XHRkZXNlbGVjdCgpO1xuXHRcdH0pO1xuXG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdC8vIERlbGF5IHF1ZXJ5aW5nIGZvciBpbnB1dCB1bnRpbCBlbGVtZW50IGNyZWF0ZWRcblx0XHRcdGFzc2lnbklucHV0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdtZC1hdXRvY29tcGxldGUuYXNzaWduIGlucHV0Jyk7XG5cdFx0XHQvLyBQcmV2ZW50IGVuZGluZyBlZGl0IG1vZGUgd2hlbiBzZWxlY3RpbmcgaW5wdXRcblx0XHRcdGVsZW1lbnQuZmluZCgnbWQtaW5wdXQtY29udGFpbmVyJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSk7XG5cdFx0fSwgMTAwKTtcblxuXHRcdC8vIExlYXZlIGN1c3RvbSBlZGl0IG1vZGVcblx0XHRmdW5jdGlvbiBkZXNlbGVjdCgpIHtcblx0XHRcdGVsZW1lbnQucmVtb3ZlQ2xhc3MoXCJlZGl0aW5nIGFzc2lnblwiKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBnZXRBc3NpZ25CdXR0b24oKSB7XG5cdFx0XHRyZXR1cm4gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24uYXNzaWduJyk7XG5cdFx0fVxuXHR9XG59XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5kaXJlY3RpdmUoJ2JrTGlzdEluZm8nLCBia0xpc3RJbmZvKTtcblxuZnVuY3Rpb24gYmtMaXN0SW5mbyhhbGxMaXN0c1NlcnZpY2UpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdHRlbXBsYXRlVXJsOiAnLi90ZW1wbGF0ZXMvYmtMaXN0SW5mby5odG1sJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkgeyBhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3Qoc2NvcGUubGlzdCkgfSk7XG5cdFx0fSk7XG5cdH1cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5kaXJlY3RpdmUoJ2JrTGlzdFZpZXcnLCBia0xpc3RWaWV3KTtcblxuZnVuY3Rpb24gYmtMaXN0VmlldygpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdGNvbnRyb2xsZXI6ICdJdGVtc0NvbnRyb2xsZXInLFxuXHRcdGNvbnRyb2xsZXJBczogJ0l0ZW1zJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblxuXHRcdHZhciBzdWJoZWFkZXIgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXInKTtcblx0XHR2YXIgdGl0bGVJbnB1dCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlciBpbnB1dCcpO1xuXG5cdFx0Ly8gQ2xpY2sgb3V0c2lkZSBvZiBpdGVtcyB0byBleGl0IGVkaXQgbW9kZVxuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZGVzZWxlY3RBbGwoKTtcblx0XHRcdGlmIChlLnRhcmdldCkge1xuXHRcdFx0XHR2YXIgYmtJdGVtID0gaXNCa0l0ZW1DaGlsZChlLnRhcmdldCk7XG5cdFx0XHRcdGlmIChia0l0ZW0pIHtcblx0XHRcdFx0XHRtYWtlSXRlbUVkaXRhYmxlKGJrSXRlbSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIFByZXZlbnQgbG9zaW5nIGZvY3VzIG9uIGJ1dHRvbiBjbGlja3Ncblx0XHRlbGVtZW50LmZpbmQoJ2J1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fSk7XG5cblx0XHQvLyBNYWtlIHRpdGxlIGVkaXRhYmxlIG9uIGNsaWNrXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyIC5uYW1lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdG1ha2VUaXRsZUVkaXRhYmxlKCk7XG5cdFx0fSk7XG5cblx0XHQvLyBFeGl0IHRpdGxlIGVkaXQgbW9kZSBvbiB0aXRsZSBpbnB1dCBsb3NpbmcgZm9jdXNcblx0XHR0aXRsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlcicpLmNsYXNzTGlzdC5yZW1vdmUoJ2VkaXRhYmxlJyk7XG5cdFx0fSk7XG5cblx0XHQvLyBTd2l0Y2ggZm9jdXMgdG8gbmV3IGl0ZW1cblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5uZXdJdGVtJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHR2YXIgbmV3SXRlbSA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYmstaXRlbScpO1xuXHRcdFx0aWYgKG5ld0l0ZW0pIHtcblx0XHRcdFx0ZGVzZWxlY3RBbGwoKTtcblx0XHRcdFx0bWFrZUl0ZW1FZGl0YWJsZShuZXdJdGVtKTtcblx0XHRcdFx0dmFyIHRpdGxlID0gbmV3SXRlbS5xdWVyeVNlbGVjdG9yKCcudGl0bGUgaW5wdXQnKTtcblx0XHRcdFx0Ly8gZm9jdXMgdGl0bGUgZmllbGQgYnkgZGVmYXVsdDsgZGVsYXkgdG8gd2FpdCBmb3Igc3R5bGUgdG8gdGFrZSBlZmZlY3Rcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHsgdGl0bGUuZm9jdXMoKTsgfSwgMTAwKTtcblx0XHRcdFx0dGl0bGUuc2VsZWN0KCk7IC8vIGlPUyBmaXhcblx0XHRcdFx0d2luZG93LnNjcm9sbCgxLDEpOyAvLyBpT1MgZml4XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRmdW5jdGlvbiBtYWtlVGl0bGVFZGl0YWJsZSgpIHtcblx0XHRcdHN1YmhlYWRlci5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0dGl0bGVJbnB1dC5mb2N1cygpO1xuXHRcdH1cblx0XHRzY29wZS5tYWtlVGl0bGVFZGl0YWJsZSA9IG1ha2VUaXRsZUVkaXRhYmxlO1xuXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3RBbGwoKSB7XG5cdFx0XHRlbGVtZW50LmZpbmQoJ2JrLWl0ZW0nKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlIGVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVDbGFzcygnaGFzRWRpdGFibGVJdGVtJyk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gbWFrZUl0ZW1FZGl0YWJsZShpdGVtKSB7XG5cdFx0XHRpdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlJyk7XG5cdFx0XHRlbGVtZW50LmFkZENsYXNzKCdoYXNFZGl0YWJsZUl0ZW0nKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBpc0JrSXRlbUNoaWxkKG5vZGUpIHtcblx0XHRcdHZhciBpc0NhcmRDb250ZW50ID0gZmFsc2U7XG5cdFx0XHR3aGlsZSAobm9kZSAmJiBub2RlICE9PSBlbGVtZW50WzBdKSB7XG5cdFx0XHRcdGlmIChub2RlLm5vZGVOYW1lID09PSAnTUQtQ0FSRC1DT05URU5UJykge1xuXHRcdFx0XHRcdGlzQ2FyZENvbnRlbnQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChpc0NhcmRDb250ZW50ICYmIG5vZGUubm9kZU5hbWUgPT09ICdCSy1JVEVNJykge1xuXHRcdFx0XHRcdHJldHVybiBub2RlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG59XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdJdGVtT2JqZWN0JywgSXRlbU9iamVjdCk7XG5cbmZ1bmN0aW9uIEl0ZW1PYmplY3QoKSB7XG5cblx0dmFyIGl0ZW1PYmplY3QgPSBmdW5jdGlvbihpZCkge1xuXHRcdHRoaXMuaWQgPSBpZDtcblx0XHR0aGlzLnRpdGxlID0gJyc7XG5cdFx0dGhpcy5ub3RlID0gJyc7XG5cdFx0dGhpcy5hc3NpZ24gPSAnJztcblx0XHR0aGlzLmRvbmUgPSBmYWxzZTtcblx0fVxuXG5cdHJldHVybiBpdGVtT2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnTGlzdE9iamVjdCcsIExpc3RPYmplY3QpO1xuXG5mdW5jdGlvbiBMaXN0T2JqZWN0KEl0ZW1PYmplY3QpIHtcblxuXHR2YXIgbGlzdE9iamVjdCA9IGZ1bmN0aW9uKGlkLCBuYW1lKSB7XG5cdFx0dGhpcy5pZCA9IGlkO1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0dGhpcy5pdGVtcyA9IFtdO1xuXHRcdHRoaXMuYWRkSXRlbSA9IGFkZEl0ZW07XG5cdFx0dGhpcy5nZXRJdGVtSW5kZXhCeUlkID0gZ2V0SXRlbUluZGV4QnlJZDtcblx0XHR0aGlzLmdldERlc2NyaXB0aW9uID0gZ2V0RGVzY3JpcHRpb247XG5cdH1cblx0dmFyIG5leHRJdGVtSWQgPSAwO1xuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0dGhpcy5pdGVtcy51bnNoaWZ0KG5ldyBJdGVtT2JqZWN0KG5leHRJdGVtSWQrKykpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0SXRlbUluZGV4QnlJZChpZCkge1xuXHRcdGZvciAodmFyIGk9MDsgaTx0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAodGhpcy5pdGVtc1tpXS5pZCA9PT0gaWQpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGVzY3JpcHRpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKCFpdGVtLmRvbmUpIHJldHVybiBpdGVtLnRpdGxlIH0pXG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9KS8vIGdldCBub24tZW1wdHkgaXRlbXNcblx0XHRcdFx0XHRcdC5qb2luKCcsICcpO1xuXHR9XG5cblx0cmV0dXJuIGxpc3RPYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdhbGxMaXN0c1NlcnZpY2UnLCBhbGxMaXN0c1NlcnZpY2UpO1xuXG5mdW5jdGlvbiBhbGxMaXN0c1NlcnZpY2UoTGlzdE9iamVjdCwgJHEpIHtcblxuXHR2YXIgbGlzdHMgPSBbXTtcblx0dmFyIGN1cnJlbnRMaXN0SWQgPSB1bmRlZmluZWQ7XG5cdHZhciBkZWxldGVUaW1lcjtcblx0dmFyIGRlbGV0ZURlZmVyO1xuXHR2YXIgZGVsZXRpbmdMaXN0SWQ7XG5cdHZhciBkZWxldGluZ0l0ZW1JZDtcblxuXHRyZXR1cm4ge1xuXHRcdGFkZDogYWRkLFxuXHRcdGxpc3RzOiBsaXN0cyxcblx0XHRzZXRDdXJyZW50TGlzdDogc2V0Q3VycmVudExpc3QsXG5cdFx0Z2V0Q3VycmVudExpc3Q6IGdldEN1cnJlbnRMaXN0LFxuXHRcdGRlbGV0ZUxpc3Q6IGRlbGV0ZUxpc3QsXG5cdFx0ZGVsZXRlSXRlbTogZGVsZXRlSXRlbSxcblx0XHRjYW5jZWxEZWxldGU6IGNhbmNlbERlbGV0ZVxuXHR9O1xuXG5cdGZ1bmN0aW9uIGFkZCgpIHtcblx0XHRsaXN0cy51bnNoaWZ0KFxuXHRcdFx0bmV3IExpc3RPYmplY3QoZ2V0VW5pcUlkKCksIFwiTmV3IExpc3QgXCIrKGxpc3RzLmxlbmd0aCsxKSlcblx0XHQpO1xuXHRcdHJldHVybiBsaXN0c1swXTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFVuaXFJZCgpIHtcblx0XHR2YXIgbGVuZ3RoID0gODtcblx0XHRyZXR1cm4gKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpNYXRoLnBvdygzNixsZW5ndGgpKS50b1N0cmluZygzNikpLnNsaWNlKC1sZW5ndGgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZmluZExpc3RJbmRleEJ5SWQoaWQpIHtcblx0XHRmb3IgKHZhciBpPTA7IGk8bGlzdHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChsaXN0c1tpXS5pZCA9PT0gaWQpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlTGlzdChpZCkge1xuXHRcdC8vIFNldCBsaXN0IHN0YXR1cyBmb3IgZGVsZXRpb25cblx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChpZCk7XG5cdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdGxpc3RzW2luZGV4XS5kZWxldGluZyA9IHRydWU7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gJyc7XG5cdFx0fVxuXHRcdC8vIGRlbGV0ZSBkZWxheVxuXHRcdGRlbGV0aW5nTGlzdElkID0gaWQ7XG5cdFx0ZGVsZXRlRGVmZXIgPSAkcS5kZWZlcigpO1xuXHRcdGRlbGV0ZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdC8vIGdldCBpbmRleCBhZ2FpbiwgYXMgaXQgbWF5IGhhdmUgY2hhbmdlZFxuXHRcdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoaWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVzb2x2ZSgnZGVsZXRlZCcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdsaXN0Tm90Rm91bmQnKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nTGlzdElkID0gdW5kZWZpbmVkO1xuXHRcdH0sIDUwMDApO1xuXHRcdHJldHVybiBkZWxldGVEZWZlci5wcm9taXNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlSXRlbShpZCkge1xuXHRcdC8vIFNldCBsaXN0IHN0YXR1cyBmb3IgZGVsZXRpb25cblx0XHR2YXIgaW5kZXggPSBnZXRDdXJyZW50TGlzdCgpLmdldEl0ZW1JbmRleEJ5SWQoaWQpO1xuXHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRnZXRDdXJyZW50TGlzdCgpLml0ZW1zW2luZGV4XS5kZWxldGluZyA9IHRydWU7XG5cdFx0fVxuXHRcdC8vIGRlbGV0ZSBkZWxheVxuXHRcdGRlbGV0aW5nSXRlbUlkID0gaWQ7XG5cdFx0ZGVsZXRpbmdMaXN0SWQgPSBnZXRDdXJyZW50TGlzdCgpLmlkOyAvLyBzdG9yZSBsaXN0IGlkIGluIGNhc2UgY3VycmVudCBsaXN0IGlzIGNoYW5nZWRcblx0XHRkZWxldGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0ZGVsZXRlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gZ2V0IGluZGV4IGFnYWluLCBhcyBpdCBtYXkgaGF2ZSBjaGFuZ2VkXG5cdFx0XHR2YXIgaW5kZXggPSBnZXRDdXJyZW50TGlzdCgpLmdldEl0ZW1JbmRleEJ5SWQoaWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0Z2V0Q3VycmVudExpc3QoKS5pdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRkZWxldGVEZWZlci5yZXNvbHZlKCdkZWxldGVkJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkZWxldGVEZWZlci5yZWplY3QoJ2xpc3ROb3RGb3VuZCcpO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdJdGVtSWQgPSB1bmRlZmluZWQ7XG5cdFx0fSwgNTAwMCk7XG5cdFx0cmV0dXJuIGRlbGV0ZURlZmVyLnByb21pc2U7XG5cdH1cblxuXHRmdW5jdGlvbiBjYW5jZWxEZWxldGUoKSB7XG5cdFx0Y2xlYXJUaW1lb3V0KGRlbGV0ZVRpbWVyKTtcblx0XHRpZiAoZGVsZXRpbmdJdGVtSWQpIHtcblx0XHRcdHZhciBsaXN0ID0gbGlzdHNbZmluZExpc3RJbmRleEJ5SWQoZGVsZXRpbmdMaXN0SWQpXTtcblx0XHRcdHZhciBpbmRleCA9IGxpc3QuZ2V0SXRlbUluZGV4QnlJZChkZWxldGluZ0lkKTtcblx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLmRlbGV0aW5nID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGluZ0l0ZW1JZCA9IHVuZGVmaW5lZDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoZGVsZXRpbmdJZCk7XG5cdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRsaXN0c1tpbmRleF0uZGVsZXRpbmcgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nTGlzdElkID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRkZWxldGVEZWZlci5yZWplY3QoJ2RlbGV0ZUNhbmNlbGxlZCcpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2V0Q3VycmVudExpc3QobGlzdCkge1xuXHRcdGlmICh0eXBlb2YgbGlzdCA9PT0gJ251bWJlcicpIHtcblx0XHRcdGN1cnJlbnRMaXN0SWQgPSBmaW5kTGlzdEluZGV4QnlJZChsaXN0KTtcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBsaXN0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Y3VycmVudExpc3RJZCA9IGxpc3QuaWQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUud2FybigndW5rbm93biBpbnB1dCBmb3IgbGlzdDogJysgdHlwZW9mIGxpc3QpO1xuXHRcdFx0Y29uc29sZS53YXJuKGxpc3QpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGdldEN1cnJlbnRMaXN0KCkge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gbGlzdHNbZmluZExpc3RJbmRleEJ5SWQoY3VycmVudExpc3RJZCldO1xuXHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0Y29uc29sZS53YXJuKCdMaXN0IG5vdCBmb3VuZC4gSUQ6ICcrY3VycmVudExpc3RJZCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdHMpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==