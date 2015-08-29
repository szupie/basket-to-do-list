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

function ItemsController(allListsService) {
	var vm = this;

	vm.addItem = addItem;
	vm.getCurrentList = allListsService.getCurrentList;

	function addItem() {
		if (!allListsService.getCurrentList()) {
			allListsService.setCurrentList(allListsService.add());
		}
		vm.getCurrentList().addItem();
	}

}
ItemsController.$inject = ["allListsService"];
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

	var itemObject = function() {
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
		this.getDescription = getDescription;
	}

	function addItem() {
		this.items.unshift(new ItemObject());
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
	var deletingId;

	return {
		add: add,
		lists: lists,
		setCurrentList: setCurrentList,
		getCurrentList: getCurrentList,
		deleteList: deleteList,
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
		deletingId = id;
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
		}, 5000);
		return deleteDefer.promise;
	}

	function cancelDelete() {
		clearTimeout(deleteTimer);
		var index = findListIndexById(deletingId);
		if (index >= 0) {
			lists[index].deleting = false;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0l0ZW1zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0xpc3RzQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvYmtJdGVtLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RJbmZvLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RWaWV3LmpzIiwic2VydmljZXMvSXRlbU9iamVjdC5qcyIsInNlcnZpY2VzL0xpc3RPYmplY3QuanMiLCJzZXJ2aWNlcy9hbGxMaXN0c1NlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxNQUFNLFFBQVEsT0FBTyxPQUFPLENBQUM7QUFDakM7QUNEQTtFQUNFLE9BQU87RUFDUCxXQUFXLG9CQUFvQjs7QUFFakMsU0FBUyxpQkFBaUIsWUFBWSxVQUFVLGlCQUFpQixVQUFVO0NBQzFFLElBQUksS0FBSztDQUNULEdBQUcsa0JBQWtCO0NBQ3JCLEdBQUcsaUJBQWlCO0NBQ3BCLEdBQUcsaUJBQWlCOztDQUVwQixHQUFHLFdBQVc7Q0FDZCxJQUFJLENBQUMsR0FBRyxTQUFTLE9BQU87RUFDdkIsR0FBRyxnQkFBZ0I7OztDQUdwQixTQUFTLGtCQUFrQjtFQUMxQixXQUFXLFFBQVE7OztDQUdwQixTQUFTLGlCQUFpQjtFQUN6QixXQUFXLFFBQVE7OztDQUdwQixTQUFTLGVBQWUsSUFBSTs7RUFFM0IsSUFBSSxjQUFjLFNBQVMsU0FBUyxRQUFRLGdCQUFnQixPQUFPLFFBQVEsZ0JBQWdCO0VBQzNGLFNBQVMsS0FBSyxhQUFhLEtBQUssU0FBUyxVQUFVO0dBQ2xELElBQUksYUFBYSxNQUFNO0lBQ3RCOzs7O0VBSUYsZ0JBQWdCLFdBQVcsSUFBSSxLQUFLLFdBQVc7R0FDOUMsU0FBUzs7O0VBR1YsV0FBVyxRQUFROzs7Q0FHcEIsU0FBUyxhQUFhO0VBQ3JCLGdCQUFn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LFVBQVU7R0FDcEMsZ0JBQWdCLEtBQUs7U0FDZjtHQUNOLFFBQVEsS0FBSyw0QkFBNEIsT0FBTztHQUNoRCxRQUFRLEtBQUs7Ozs7Q0FJZixTQUFTLGlCQUFpQjtFQUN6QixJQUFJO0dBQ0gsT0FBTyxNQUFNLGtCQUFrQjtJQUM5QixNQUFNLEdBQUc7R0FDVixRQUFRLEtBQUssdUJBQXVCO0dBQ3BDLFFBQVEsS0FBSztHQUNiLE9BQU87Ozs7K0NBR1QiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nTWF0ZXJpYWwnXSk7XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdCYXNrZXRDb250cm9sbGVyJywgQmFza2V0Q29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEJhc2tldENvbnRyb2xsZXIoJG1kU2lkZW5hdiwgJG1kTWVkaWEsIGFsbExpc3RzU2VydmljZSwgJG1kVG9hc3QpIHtcblx0dmFyIHZtID0gdGhpcztcblx0dm0udG9nZ2xlTGlzdHNWaWV3ID0gdG9nZ2xlTGlzdHNWaWV3O1xuXHR2bS5jbG9zZUxpc3RzVmlldyA9IGNsb3NlTGlzdHNWaWV3O1xuXHR2bS5kZWxldGVMaXN0QnlJZCA9IGRlbGV0ZUxpc3RCeUlkO1xuXG5cdHZtLiRtZE1lZGlhID0gJG1kTWVkaWE7XG5cdGlmICghdm0uJG1kTWVkaWEoJ2xnJykpIHtcblx0XHR2bS5saXN0c1ZpZXdPcGVuID0gdHJ1ZTtcblx0fVxuXG5cdGZ1bmN0aW9uIHRvZ2dsZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykudG9nZ2xlKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBjbG9zZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykuY2xvc2UoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGRlbGV0ZUxpc3RCeUlkKGlkKSB7XG5cdFx0Ly8gc2hvdyB1bmRvIHRvYXN0XG5cdFx0dmFyIGRlbGV0ZVRvYXN0ID0gJG1kVG9hc3Quc2ltcGxlKCkuY29udGVudCgnTGlzdCBEZWxldGVkJykuYWN0aW9uKCdVbmRvJykuaGlnaGxpZ2h0QWN0aW9uKHRydWUpO1xuXHRcdCRtZFRvYXN0LnNob3coZGVsZXRlVG9hc3QpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZSA9PT0gJ29rJykge1xuXHRcdFx0XHR1bmRvRGVsZXRlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcGVyZm9ybSBkZWxldGVcblx0XHRhbGxMaXN0c1NlcnZpY2UuZGVsZXRlTGlzdChpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRtZFRvYXN0LmhpZGUoKTtcblx0XHR9KTtcblx0XHQvLyBoaWRlIGN1cnJlbnRseSBlZGl0aW5nIGxpc3Rcblx0XHQkbWRTaWRlbmF2KCdsZWZ0Jykub3BlbigpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdW5kb0RlbGV0ZSgpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2UuY2FuY2VsRGVsZXRlKCk7XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1Db250cm9sbGVyJywgSXRlbUNvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBJdGVtQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblx0dmFyIHZtID0gdGhpcztcblx0dm0uZmFiSXNPcGVuID0gZmFsc2U7XG5cdHZtLnNlYXJjaE5hbWUgPSBzZWFyY2hOYW1lO1xuXG5cdGZ1bmN0aW9uIHNlYXJjaE5hbWUocXVlcnkpIHtcblx0XHR2YXIgYWxsSXRlbXMgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKS5pdGVtcztcblx0XHR2YXIgbmFtZXMgPSBbcXVlcnldO1xuXHRcdC8vIGdldCBsaXN0IG9mIGFsbCB1bmlxdWUgbmFtZXNcblx0XHRmb3IgKHZhciBpPTA7IGk8YWxsSXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBuYW1lID0gYWxsSXRlbXNbaV0uYXNzaWduO1xuXHRcdFx0aWYgKG5hbWUgJiYgbmFtZXMuaW5kZXhPZihuYW1lKSA8IDApIHsgLy8gaWYgbmFtZSBpc24ndCBhbHJlYWR5IGluIGxpc3Rcblx0XHRcdFx0bmFtZXMucHVzaChuYW1lKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gZmluZCBtYXRjaGVkIG5hbWVzXG5cdFx0dmFyIG1hdGNoZXMgPSBuYW1lcy5maWx0ZXIoZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0cmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHF1ZXJ5LnRvTG93ZXJDYXNlKCkpID09PSAwO1xuXHRcdH0pO1xuXHRcdHJldHVybiBtYXRjaGVzO1xuXHR9XG59XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdJdGVtc0NvbnRyb2xsZXInLCBJdGVtc0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBJdGVtc0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cblx0dm0uYWRkSXRlbSA9IGFkZEl0ZW07XG5cdHZtLmdldEN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0aWYgKCFhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKSkge1xuXHRcdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdFx0fVxuXHRcdHZtLmdldEN1cnJlbnRMaXN0KCkuYWRkSXRlbSgpO1xuXHR9XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdMaXN0c0NvbnRyb2xsZXInLCBMaXN0c0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBMaXN0c0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cblx0dmFyIHZtID0gdGhpcztcblx0XG5cdHZtLmxpc3RzID0gYWxsTGlzdHNTZXJ2aWNlLmxpc3RzO1xuXG5cdHZtLmFkZExpc3QgPSBmdW5jdGlvbigpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0fTtcblxuXHR2bS5jdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtJdGVtJywgYmtJdGVtKTtcblxuZnVuY3Rpb24gYmtJdGVtKCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0dGVtcGxhdGVVcmw6ICcuL3RlbXBsYXRlcy9ia0l0ZW0uaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ0l0ZW1Db250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHQvLyBFbmQgY3VzdG9tIGVkaXQgbW9kZSBvbiBjbGlja1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cblx0XHR2YXIgbGlzdFZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbYmstbGlzdC12aWV3XScpO1xuXHRcdHZhciBhc3NpZ25JbnB1dDtcblxuXHRcdC8vIEVudGVyIGFzc2lnbiBtb2RlXG5cdFx0ZnVuY3Rpb24gZW50ZXJBc3NpZ25Nb2RlKCkge1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcyhcImVkaXRhYmxlIGVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdFx0YXNzaWduSW5wdXQuc2VsZWN0KCk7IC8vIGlPUyBmaXhcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGFzc2lnbklucHV0LmZvY3VzKCk7IH0sIDEwMCk7IC8vIGRlbGF5IHRvIHdhaXQgZm9yIGNsYXNzZXMgdG8gYXBwbHlcblx0XHRcdGxpc3RWaWV3LmNsYXNzTGlzdC5hZGQoXCJoYXNFZGl0YWJsZUl0ZW1cIik7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIFJlYXR0YWNoIGxpc3RlbmVyIHRvIGJ1dHRvbnMgb24gc2NyZWVuIHNpemUgY2hhbmdlXG5cdFx0dmFyIGFzc2lnbkJ1dHRvbiA9IGdldEFzc2lnbkJ1dHRvbigpO1xuXHRcdHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuIHNjb3BlLk1haW4uJG1kTWVkaWEoJ21kJyk7IH0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKGFzc2lnbkJ1dHRvbikge1xuXHRcdFx0XHRhc3NpZ25CdXR0b24ucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlbnRlckFzc2lnbk1vZGUpO1xuXHRcdFx0fVxuXHRcdFx0YXNzaWduQnV0dG9uID0gZ2V0QXNzaWduQnV0dG9uKCk7XG5cdFx0XHRpZiAoYXNzaWduQnV0dG9uKSB7XG5cdFx0XHRcdGFzc2lnbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGVudGVyQXNzaWduTW9kZSk7XG5cdFx0XHR9XG5cdFx0XHQvLyBQcmV2ZW50IGVuZGluZyBlZGl0IG1vZGUgd2hlbiBjbGlja2luZyBidXR0b25cblx0XHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSk7XG5cdFx0XHQvLyBpT1MgZml4IHRvIGRlc2VsZWN0IGJ1dHRvblxuXHRcdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbigndG91Y2hzdGFydCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdC8vIFRvZ2dsZSBpdGVtIGRvbmVuZXNzXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24uZG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50LnRvZ2dsZUNsYXNzKFwiZG9uZVwiKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlXCIpO1xuXHRcdFx0bGlzdFZpZXcuY2xhc3NMaXN0LnJlbW92ZShcImhhc0VkaXRhYmxlSXRlbVwiKTtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gRGVsYXkgcXVlcnlpbmcgZm9yIGlucHV0IHVudGlsIGVsZW1lbnQgY3JlYXRlZFxuXHRcdFx0YXNzaWduSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ21kLWF1dG9jb21wbGV0ZS5hc3NpZ24gaW5wdXQnKTtcblx0XHRcdC8vIFByZXZlbnQgZW5kaW5nIGVkaXQgbW9kZSB3aGVuIHNlbGVjdGluZyBpbnB1dFxuXHRcdFx0ZWxlbWVudC5maW5kKCdtZC1pbnB1dC1jb250YWluZXInKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHR9KTtcblx0XHR9LCAxMDApO1xuXG5cdFx0Ly8gTGVhdmUgY3VzdG9tIGVkaXQgbW9kZVxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0KCkge1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVDbGFzcyhcImVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGdldEFzc2lnbkJ1dHRvbigpIHtcblx0XHRcdHJldHVybiBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5hc3NpZ24nKTtcblx0XHR9XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0SW5mbycsIGJrTGlzdEluZm8pO1xuXG5mdW5jdGlvbiBia0xpc3RJbmZvKGFsbExpc3RzU2VydmljZSkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0dGVtcGxhdGVVcmw6ICcuL3RlbXBsYXRlcy9ia0xpc3RJbmZvLmh0bWwnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7IGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChzY29wZS5saXN0KSB9KTtcblx0XHR9KTtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0VmlldycsIGJrTGlzdFZpZXcpO1xuXG5mdW5jdGlvbiBia0xpc3RWaWV3KCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0Y29udHJvbGxlcjogJ0l0ZW1zQ29udHJvbGxlcicsXG5cdFx0Y29udHJvbGxlckFzOiAnSXRlbXMnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXG5cdFx0dmFyIHN1YmhlYWRlciA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlcicpO1xuXHRcdHZhciB0aXRsZUlucHV0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyIGlucHV0Jyk7XG5cblx0XHQvLyBDbGljayBvdXRzaWRlIG9mIGl0ZW1zIHRvIGV4aXQgZWRpdCBtb2RlXG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0aWYgKGUudGFyZ2V0KSB7XG5cdFx0XHRcdHZhciBia0l0ZW0gPSBpc0JrSXRlbUNoaWxkKGUudGFyZ2V0KTtcblx0XHRcdFx0aWYgKGJrSXRlbSkge1xuXHRcdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUoYmtJdGVtKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gUHJldmVudCBsb3NpbmcgZm9jdXMgb24gYnV0dG9uIGNsaWNrc1xuXHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblxuXHRcdC8vIE1ha2UgdGl0bGUgZWRpdGFibGUgb24gY2xpY2tcblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgLm5hbWUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0bWFrZVRpdGxlRWRpdGFibGUoKTtcblx0XHR9KTtcblxuXHRcdC8vIEV4aXQgdGl0bGUgZWRpdCBtb2RlIG9uIHRpdGxlIGlucHV0IGxvc2luZyBmb2N1c1xuXHRcdHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJykuY2xhc3NMaXN0LnJlbW92ZSgnZWRpdGFibGUnKTtcblx0XHR9KTtcblxuXHRcdC8vIFN3aXRjaCBmb2N1cyB0byBuZXcgaXRlbVxuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLm5ld0l0ZW0nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdHZhciBuZXdJdGVtID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdiay1pdGVtJyk7XG5cdFx0XHRpZiAobmV3SXRlbSkge1xuXHRcdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0XHRtYWtlSXRlbUVkaXRhYmxlKG5ld0l0ZW0pO1xuXHRcdFx0XHR2YXIgdGl0bGUgPSBuZXdJdGVtLnF1ZXJ5U2VsZWN0b3IoJy50aXRsZSBpbnB1dCcpO1xuXHRcdFx0XHQvLyBmb2N1cyB0aXRsZSBmaWVsZCBieSBkZWZhdWx0OyBkZWxheSB0byB3YWl0IGZvciBzdHlsZSB0byB0YWtlIGVmZmVjdFxuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB0aXRsZS5mb2N1cygpOyB9LCAxMDApO1xuXHRcdFx0XHR0aXRsZS5zZWxlY3QoKTsgLy8gaU9TIGZpeFxuXHRcdFx0XHR3aW5kb3cuc2Nyb2xsKDEsMSk7IC8vIGlPUyBmaXhcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGZ1bmN0aW9uIG1ha2VUaXRsZUVkaXRhYmxlKCkge1xuXHRcdFx0c3ViaGVhZGVyLmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlJyk7XG5cdFx0XHR0aXRsZUlucHV0LmZvY3VzKCk7XG5cdFx0fVxuXHRcdHNjb3BlLm1ha2VUaXRsZUVkaXRhYmxlID0gbWFrZVRpdGxlRWRpdGFibGU7XG5cblx0XHRmdW5jdGlvbiBkZXNlbGVjdEFsbCgpIHtcblx0XHRcdGVsZW1lbnQuZmluZCgnYmstaXRlbScpLnJlbW92ZUNsYXNzKFwiZWRpdGFibGUgZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKCdoYXNFZGl0YWJsZUl0ZW0nKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBtYWtlSXRlbUVkaXRhYmxlKGl0ZW0pIHtcblx0XHRcdGl0ZW0uY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGlzQmtJdGVtQ2hpbGQobm9kZSkge1xuXHRcdFx0dmFyIGlzQ2FyZENvbnRlbnQgPSBmYWxzZTtcblx0XHRcdHdoaWxlIChub2RlICYmIG5vZGUgIT09IGVsZW1lbnRbMF0pIHtcblx0XHRcdFx0aWYgKG5vZGUubm9kZU5hbWUgPT09ICdNRC1DQVJELUNPTlRFTlQnKSB7XG5cdFx0XHRcdFx0aXNDYXJkQ29udGVudCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGlzQ2FyZENvbnRlbnQgJiYgbm9kZS5ub2RlTmFtZSA9PT0gJ0JLLUlURU0nKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5vZGU7XG5cdFx0XHRcdH1cblx0XHRcdFx0bm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0l0ZW1PYmplY3QnLCBJdGVtT2JqZWN0KTtcblxuZnVuY3Rpb24gSXRlbU9iamVjdCgpIHtcblxuXHR2YXIgaXRlbU9iamVjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudGl0bGUgPSAnJztcblx0XHR0aGlzLm5vdGUgPSAnJztcblx0XHR0aGlzLmFzc2lnbiA9ICcnO1xuXHRcdHRoaXMuZG9uZSA9IGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIGl0ZW1PYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdMaXN0T2JqZWN0JywgTGlzdE9iamVjdCk7XG5cbmZ1bmN0aW9uIExpc3RPYmplY3QoSXRlbU9iamVjdCkge1xuXG5cdHZhciBsaXN0T2JqZWN0ID0gZnVuY3Rpb24oaWQsIG5hbWUpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLml0ZW1zID0gW107XG5cdFx0dGhpcy5hZGRJdGVtID0gYWRkSXRlbTtcblx0XHR0aGlzLmdldERlc2NyaXB0aW9uID0gZ2V0RGVzY3JpcHRpb247XG5cdH1cblxuXHRmdW5jdGlvbiBhZGRJdGVtKCkge1xuXHRcdHRoaXMuaXRlbXMudW5zaGlmdChuZXcgSXRlbU9iamVjdCgpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldERlc2NyaXB0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLml0ZW1zLm1hcChmdW5jdGlvbihpdGVtKSB7IGlmICghaXRlbS5kb25lKSByZXR1cm4gaXRlbS50aXRsZSB9KVxuXHRcdFx0XHRcdFx0LmZpbHRlcihmdW5jdGlvbih2YWwpIHsgcmV0dXJuIHZhbDsgfSkvLyBnZXQgbm9uLWVtcHR5IGl0ZW1zXG5cdFx0XHRcdFx0XHQuam9pbignLCAnKTtcblx0fVxuXG5cdHJldHVybiBsaXN0T2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnYWxsTGlzdHNTZXJ2aWNlJywgYWxsTGlzdHNTZXJ2aWNlKTtcblxuZnVuY3Rpb24gYWxsTGlzdHNTZXJ2aWNlKExpc3RPYmplY3QsICRxKSB7XG5cblx0dmFyIGxpc3RzID0gW107XG5cdHZhciBjdXJyZW50TGlzdElkID0gdW5kZWZpbmVkO1xuXHR2YXIgZGVsZXRlVGltZXI7XG5cdHZhciBkZWxldGVEZWZlcjtcblx0dmFyIGRlbGV0aW5nSWQ7XG5cblx0cmV0dXJuIHtcblx0XHRhZGQ6IGFkZCxcblx0XHRsaXN0czogbGlzdHMsXG5cdFx0c2V0Q3VycmVudExpc3Q6IHNldEN1cnJlbnRMaXN0LFxuXHRcdGdldEN1cnJlbnRMaXN0OiBnZXRDdXJyZW50TGlzdCxcblx0XHRkZWxldGVMaXN0OiBkZWxldGVMaXN0LFxuXHRcdGNhbmNlbERlbGV0ZTogY2FuY2VsRGVsZXRlXG5cdH07XG5cblx0ZnVuY3Rpb24gYWRkKCkge1xuXHRcdGxpc3RzLnVuc2hpZnQoXG5cdFx0XHRuZXcgTGlzdE9iamVjdChnZXRVbmlxSWQoKSwgXCJOZXcgTGlzdCBcIisobGlzdHMubGVuZ3RoKzEpKVxuXHRcdCk7XG5cdFx0cmV0dXJuIGxpc3RzWzBdO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0VW5pcUlkKCkge1xuXHRcdHZhciBsZW5ndGggPSA4O1xuXHRcdHJldHVybiAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKk1hdGgucG93KDM2LGxlbmd0aCkpLnRvU3RyaW5nKDM2KSkuc2xpY2UoLWxlbmd0aCk7XG5cdH1cblxuXHRmdW5jdGlvbiBmaW5kTGlzdEluZGV4QnlJZChpZCkge1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKGxpc3RzW2ldLmlkID09PSBpZCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBkZWxldGVMaXN0KGlkKSB7XG5cdFx0Ly8gU2V0IGxpc3Qgc3RhdHVzIGZvciBkZWxldGlvblxuXHRcdHZhciBpbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGlkKTtcblx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0bGlzdHNbaW5kZXhdLmRlbGV0aW5nID0gdHJ1ZTtcblx0XHRcdGN1cnJlbnRMaXN0SWQgPSAnJztcblx0XHR9XG5cdFx0Ly8gZGVsZXRlIGRlbGF5XG5cdFx0ZGVsZXRpbmdJZCA9IGlkO1xuXHRcdGRlbGV0ZURlZmVyID0gJHEuZGVmZXIoKTtcblx0XHRkZWxldGVUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBnZXQgaW5kZXggYWdhaW4sIGFzIGl0IG1heSBoYXZlIGNoYW5nZWRcblx0XHRcdHZhciBpbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGlkKTtcblx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdGxpc3RzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdGRlbGV0ZURlZmVyLnJlc29sdmUoJ2RlbGV0ZWQnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRlbGV0ZURlZmVyLnJlamVjdCgnbGlzdE5vdEZvdW5kJyk7XG5cdFx0XHR9XG5cdFx0fSwgNTAwMCk7XG5cdFx0cmV0dXJuIGRlbGV0ZURlZmVyLnByb21pc2U7XG5cdH1cblxuXHRmdW5jdGlvbiBjYW5jZWxEZWxldGUoKSB7XG5cdFx0Y2xlYXJUaW1lb3V0KGRlbGV0ZVRpbWVyKTtcblx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChkZWxldGluZ0lkKTtcblx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0bGlzdHNbaW5kZXhdLmRlbGV0aW5nID0gZmFsc2U7XG5cdFx0fVxuXHRcdGRlbGV0ZURlZmVyLnJlamVjdCgnZGVsZXRlQ2FuY2VsbGVkJyk7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDdXJyZW50TGlzdChsaXN0KSB7XG5cdFx0aWYgKHR5cGVvZiBsaXN0ID09PSAnbnVtYmVyJykge1xuXHRcdFx0Y3VycmVudExpc3RJZCA9IGZpbmRMaXN0SW5kZXhCeUlkKGxpc3QpO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gbGlzdC5pZDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc29sZS53YXJuKCd1bmtub3duIGlucHV0IGZvciBsaXN0OiAnKyB0eXBlb2YgbGlzdCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Q3VycmVudExpc3QoKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBsaXN0c1tmaW5kTGlzdEluZGV4QnlJZChjdXJyZW50TGlzdElkKV07XG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ0xpc3Qgbm90IGZvdW5kLiBJRDogJytjdXJyZW50TGlzdElkKTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0cyk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9