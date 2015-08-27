var app = angular.module('app', ['ngMaterial']);

angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($mdSidenav) {
	var vm = this;
	vm.toggleListsView = toggleListsView;
	vm.closeListsView = closeListsView;

	function toggleListsView() {
		$mdSidenav('left').toggle();
	}

	function closeListsView() {
		$mdSidenav('left').close();
	}
}
BasketController.$inject = ["$mdSidenav"];

angular
	.module('app')
	.controller('ItemController', ItemController);

function ItemController() {
	var vm = this;
	vm.fabIsOpen = false;

}
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
	
	this.lists = allListsService.lists;

	this.addList = function() {
		allListsService.setCurrentList(allListsService.add());
	};

	this.currentList = allListsService.getCurrentList;

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

		// Enter assign mode
		element[0].querySelector('.actions button.assign').addEventListener('click', function() {
			element.addClass("editable editing assign");
			element[0].querySelector('md-input-container.assign input').focus();
			listView.classList.add("hasEditableItem");
		});

		// Toggle item doneness
		element[0].querySelector('button.done').addEventListener('click', function() {
			element.toggleClass("done").removeClass("editable");
			listView.classList.remove("hasEditableItem");
			deselect();
		});

		// Prevent ending edit mode when selecting input
		element.find('md-input-container').on('click', function(e) {
			e.stopPropagation();
		});
		// Prevent ending edit mode when clicking button
		element.find('button').on('click', function(e) {
			e.stopPropagation();
		});

		// Leave custom edit mode
		function deselect() {
			element.removeClass("editing assign");
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
		scope.$watch('Items.getCurrentList().items[0]', function() {
			// on new item added
			var newItem = element[0].querySelector('bk-item');
			if (newItem) {
				deselectAll();
				makeItemEditable(newItem);
				// focus title field by default; delay to wait for style to take effect
				setTimeout(function() { newItem.querySelector('.title input').focus(); }, 100);
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

function allListsService(ListObject) {

	var lists = [];
	var currentListIndex = undefined;

	return {
		add: add,
		lists: lists,
		currentListIndex: currentListIndex,
		setCurrentList: setCurrentList,
		getCurrentList: getCurrentList
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

	function findListById(id) {
		for (var i=0; i<lists.length; i++) {
			if (lists.id === id) {
				return i;
			}
		}
	}

	function setCurrentList(list) {
		if (typeof list === 'number') {
			currentListIndex = list;
		} else if (typeof list === 'object') {
			currentListIndex = lists.indexOf(list);
		} else {
			console.warn('unknown input for list: '+ typeof list);
			console.warn(list);
		}
	}

	function getCurrentList() {
		try {
			return lists[currentListIndex];
		} catch(e) {
			console.warn('List not found. Index: '+currentListIndex);
			console.warn(lists);
			return false;
		}
	}
}
allListsService.$inject = ["ListObject"];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0l0ZW1zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0xpc3RzQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvYmtJdGVtLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RJbmZvLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RWaWV3LmpzIiwic2VydmljZXMvSXRlbU9iamVjdC5qcyIsInNlcnZpY2VzL0xpc3RPYmplY3QuanMiLCJzZXJ2aWNlcy9hbGxMaXN0c1NlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxNQUFBLFFBQUEsT0FBQSxPQUFBLENBQUE7O0FDQUE7RUFDQSxPQUFBO0VBQ0EsV0FBQSxvQkFBQTs7QUFFQSxTQUFBLGlCQUFBLFlBQUE7Q0FDQSxJQUFBLEtBQUE7Q0FDQSxHQUFBLGtCQUFBO0NBQ0EsR0FBQSxpQkFBQTs7Q0FFQSxTQUFBLGtCQUFBO0VBQ0EsV0FBQSxRQUFBOzs7Q0FHQSxTQUFBLGlCQUFBO0VBQ0EsV0FBQSxRQUFBOzs7OztBQ2RBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsa0JBQUE7O0FBRUEsU0FBQSxpQkFBQTtDQUNBLElBQUEsS0FBQTtDQUNBLEdBQUEsWUFBQTs7O0FDTkE7RUFDQSxPQUFBO0VBQ0EsV0FBQSxtQkFBQTs7QUFFQSxTQUFBLGdCQUFBLGlCQUFBO0NBQ0EsSUFBQSxLQUFBOztDQUVBLEdBQUEsVUFBQTtDQUNBLEdBQUEsaUJBQUEsZ0JBQUE7O0NBRUEsU0FBQSxVQUFBO0VBQ0EsSUFBQSxDQUFBLGdCQUFBLGtCQUFBO0dBQ0EsZ0JBQUEsZUFBQSxnQkFBQTs7RUFFQSxHQUFBLGlCQUFBOzs7OztBQ2RBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxpQkFBQTs7Q0FFQSxLQUFBLFFBQUEsZ0JBQUE7O0NBRUEsS0FBQSxVQUFBLFdBQUE7RUFDQSxnQkFBQSxlQUFBLGdCQUFBOzs7Q0FHQSxLQUFBLGNBQUEsZ0JBQUE7Ozs7QUNaQTtFQUNBLE9BQUE7RUFDQSxVQUFBLFVBQUE7O0FBRUEsU0FBQSxTQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxhQUFBO0VBQ0EsWUFBQTtFQUNBLGNBQUE7OztDQUdBLE9BQUE7O0NBRUEsU0FBQSxLQUFBLE9BQUEsU0FBQSxPQUFBOztFQUVBLFFBQUEsR0FBQSxTQUFBLFVBQUEsR0FBQTtHQUNBOzs7RUFHQSxJQUFBLFdBQUEsU0FBQSxjQUFBOzs7RUFHQSxRQUFBLEdBQUEsY0FBQSwwQkFBQSxpQkFBQSxTQUFBLFdBQUE7R0FDQSxRQUFBLFNBQUE7R0FDQSxRQUFBLEdBQUEsY0FBQSxtQ0FBQTtHQUNBLFNBQUEsVUFBQSxJQUFBOzs7O0VBSUEsUUFBQSxHQUFBLGNBQUEsZUFBQSxpQkFBQSxTQUFBLFdBQUE7R0FDQSxRQUFBLFlBQUEsUUFBQSxZQUFBO0dBQ0EsU0FBQSxVQUFBLE9BQUE7R0FDQTs7OztFQUlBLFFBQUEsS0FBQSxzQkFBQSxHQUFBLFNBQUEsU0FBQSxHQUFBO0dBQ0EsRUFBQTs7O0VBR0EsUUFBQSxLQUFBLFVBQUEsR0FBQSxTQUFBLFNBQUEsR0FBQTtHQUNBLEVBQUE7Ozs7RUFJQSxTQUFBLFdBQUE7R0FDQSxRQUFBLFlBQUE7Ozs7O0FDaERBO0VBQ0EsT0FBQTtFQUNBLFVBQUEsY0FBQTs7QUFFQSxTQUFBLFdBQUEsaUJBQUE7Q0FDQSxJQUFBLFlBQUE7RUFDQSxVQUFBO0VBQ0EsTUFBQTtFQUNBLGFBQUE7OztDQUdBLE9BQUE7O0NBRUEsU0FBQSxLQUFBLE9BQUEsU0FBQSxPQUFBO0VBQ0EsUUFBQSxHQUFBLFNBQUEsV0FBQTtHQUNBLE1BQUEsT0FBQSxXQUFBLEVBQUEsZ0JBQUEsZUFBQSxNQUFBOzs7OztBQ2ZBO0VBQ0EsT0FBQTtFQUNBLFVBQUEsY0FBQTs7QUFFQSxTQUFBLGFBQUE7Q0FDQSxJQUFBLFlBQUE7RUFDQSxVQUFBO0VBQ0EsTUFBQTtFQUNBLFlBQUE7RUFDQSxjQUFBOzs7Q0FHQSxPQUFBOztDQUVBLFNBQUEsS0FBQSxPQUFBLFNBQUEsT0FBQTs7RUFFQSxJQUFBLFlBQUEsUUFBQSxHQUFBLGNBQUE7RUFDQSxJQUFBLGFBQUEsUUFBQSxHQUFBLGNBQUE7OztFQUdBLFFBQUEsR0FBQSxTQUFBLFNBQUEsR0FBQTtHQUNBO0dBQ0EsSUFBQSxFQUFBLFFBQUE7SUFDQSxJQUFBLFNBQUEsY0FBQSxFQUFBO0lBQ0EsSUFBQSxRQUFBO0tBQ0EsaUJBQUE7Ozs7OztFQU1BLFFBQUEsS0FBQSxVQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQSxFQUFBOzs7O0VBSUEsUUFBQSxHQUFBLGNBQUEsdUJBQUEsaUJBQUEsU0FBQSxXQUFBO0dBQ0E7Ozs7RUFJQSxXQUFBLGlCQUFBLFFBQUEsV0FBQTtHQUNBLFFBQUEsR0FBQSxjQUFBLGlCQUFBLFVBQUEsT0FBQTs7OztFQUlBLE1BQUEsT0FBQSxtQ0FBQSxXQUFBOztHQUVBLElBQUEsVUFBQSxRQUFBLEdBQUEsY0FBQTtHQUNBLElBQUEsU0FBQTtJQUNBO0lBQ0EsaUJBQUE7O0lBRUEsV0FBQSxXQUFBLEVBQUEsUUFBQSxjQUFBLGdCQUFBLFlBQUE7Ozs7RUFJQSxTQUFBLG9CQUFBO0dBQ0EsVUFBQSxVQUFBLElBQUE7R0FDQSxXQUFBOztFQUVBLE1BQUEsb0JBQUE7O0VBRUEsU0FBQSxjQUFBO0dBQ0EsUUFBQSxLQUFBLFdBQUEsWUFBQTtHQUNBLFFBQUEsWUFBQTs7O0VBR0EsU0FBQSxpQkFBQSxNQUFBO0dBQ0EsS0FBQSxVQUFBLElBQUE7R0FDQSxRQUFBLFNBQUE7OztFQUdBLFNBQUEsY0FBQSxNQUFBO0dBQ0EsSUFBQSxnQkFBQTtHQUNBLE9BQUEsUUFBQSxTQUFBLFFBQUEsSUFBQTtJQUNBLElBQUEsS0FBQSxhQUFBLG1CQUFBO0tBQ0EsZ0JBQUE7O0lBRUEsSUFBQSxpQkFBQSxLQUFBLGFBQUEsV0FBQTtLQUNBLE9BQUE7O0lBRUEsT0FBQSxLQUFBOztHQUVBLE9BQUE7Ozs7O0FDcEZBO0VBQ0EsT0FBQTtFQUNBLFFBQUEsY0FBQTs7QUFFQSxTQUFBLGFBQUE7O0NBRUEsSUFBQSxhQUFBLFdBQUE7RUFDQSxLQUFBLFFBQUE7RUFDQSxLQUFBLE9BQUE7RUFDQSxLQUFBLFNBQUE7RUFDQSxLQUFBLE9BQUE7OztDQUdBLE9BQUE7OztBQ2JBO0VBQ0EsT0FBQTtFQUNBLFFBQUEsY0FBQTs7QUFFQSxTQUFBLFdBQUEsWUFBQTs7Q0FFQSxJQUFBLGFBQUEsU0FBQSxJQUFBLE1BQUE7RUFDQSxLQUFBLEtBQUE7RUFDQSxLQUFBLE9BQUE7RUFDQSxLQUFBLFFBQUE7RUFDQSxLQUFBLFVBQUE7RUFDQSxLQUFBLGlCQUFBOzs7Q0FHQSxTQUFBLFVBQUE7RUFDQSxLQUFBLE1BQUEsUUFBQSxJQUFBOzs7Q0FHQSxTQUFBLGlCQUFBO0VBQ0EsT0FBQSxLQUFBLE1BQUEsSUFBQSxTQUFBLE1BQUEsRUFBQSxJQUFBLENBQUEsS0FBQSxNQUFBLE9BQUEsS0FBQTtPQUNBLE9BQUEsU0FBQSxLQUFBLEVBQUEsT0FBQTtPQUNBLEtBQUE7OztDQUdBLE9BQUE7Ozs7QUN4QkE7RUFDQSxPQUFBO0VBQ0EsUUFBQSxtQkFBQTs7QUFFQSxTQUFBLGdCQUFBLFlBQUE7O0NBRUEsSUFBQSxRQUFBO0NBQ0EsSUFBQSxtQkFBQTs7Q0FFQSxPQUFBO0VBQ0EsS0FBQTtFQUNBLE9BQUE7RUFDQSxrQkFBQTtFQUNBLGdCQUFBO0VBQ0EsZ0JBQUE7OztDQUdBLFNBQUEsTUFBQTtFQUNBLE1BQUE7R0FDQSxJQUFBLFdBQUEsYUFBQSxhQUFBLE1BQUEsT0FBQTs7RUFFQSxPQUFBLE1BQUE7OztDQUdBLFNBQUEsWUFBQTtFQUNBLElBQUEsU0FBQTtFQUNBLE9BQUEsQ0FBQSxLQUFBLE1BQUEsS0FBQSxTQUFBLEtBQUEsSUFBQSxHQUFBLFNBQUEsU0FBQSxLQUFBLE1BQUEsQ0FBQTs7O0NBR0EsU0FBQSxhQUFBLElBQUE7RUFDQSxLQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsTUFBQSxRQUFBLEtBQUE7R0FDQSxJQUFBLE1BQUEsT0FBQSxJQUFBO0lBQ0EsT0FBQTs7Ozs7Q0FLQSxTQUFBLGVBQUEsTUFBQTtFQUNBLElBQUEsT0FBQSxTQUFBLFVBQUE7R0FDQSxtQkFBQTtTQUNBLElBQUEsT0FBQSxTQUFBLFVBQUE7R0FDQSxtQkFBQSxNQUFBLFFBQUE7U0FDQTtHQUNBLFFBQUEsS0FBQSw0QkFBQSxPQUFBO0dBQ0EsUUFBQSxLQUFBOzs7O0NBSUEsU0FBQSxpQkFBQTtFQUNBLElBQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxNQUFBLEdBQUE7R0FDQSxRQUFBLEtBQUEsMEJBQUE7R0FDQSxRQUFBLEtBQUE7R0FDQSxPQUFBOzs7O3lDQUdBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyduZ01hdGVyaWFsJ10pO1xuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignQmFza2V0Q29udHJvbGxlcicsIEJhc2tldENvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBCYXNrZXRDb250cm9sbGVyKCRtZFNpZGVuYXYpIHtcblx0dmFyIHZtID0gdGhpcztcblx0dm0udG9nZ2xlTGlzdHNWaWV3ID0gdG9nZ2xlTGlzdHNWaWV3O1xuXHR2bS5jbG9zZUxpc3RzVmlldyA9IGNsb3NlTGlzdHNWaWV3O1xuXG5cdGZ1bmN0aW9uIHRvZ2dsZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykudG9nZ2xlKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBjbG9zZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykuY2xvc2UoKTtcblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignSXRlbUNvbnRyb2xsZXInLCBJdGVtQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1Db250cm9sbGVyKCkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXHR2bS5mYWJJc09wZW4gPSBmYWxzZTtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1zQ29udHJvbGxlcicsIEl0ZW1zQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1zQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblx0dmFyIHZtID0gdGhpcztcblxuXHR2bS5hZGRJdGVtID0gYWRkSXRlbTtcblx0dm0uZ2V0Q3VycmVudExpc3QgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3Q7XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHRpZiAoIWFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpKSB7XG5cdFx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0XHR9XG5cdFx0dm0uZ2V0Q3VycmVudExpc3QoKS5hZGRJdGVtKCk7XG5cdH1cblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0xpc3RzQ29udHJvbGxlcicsIExpc3RzQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIExpc3RzQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblx0XG5cdHRoaXMubGlzdHMgPSBhbGxMaXN0c1NlcnZpY2UubGlzdHM7XG5cblx0dGhpcy5hZGRMaXN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdH07XG5cblx0dGhpcy5jdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtJdGVtJywgYmtJdGVtKTtcblxuZnVuY3Rpb24gYmtJdGVtKCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0dGVtcGxhdGVVcmw6ICcuL3RlbXBsYXRlcy9ia0l0ZW0uaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ0l0ZW1Db250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHQvLyBFbmQgY3VzdG9tIGVkaXQgbW9kZSBvbiBjbGlja1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cblx0XHR2YXIgbGlzdFZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbYmstbGlzdC12aWV3XScpO1xuXG5cdFx0Ly8gRW50ZXIgYXNzaWduIG1vZGVcblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5hY3Rpb25zIGJ1dHRvbi5hc3NpZ24nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcyhcImVkaXRhYmxlIGVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdtZC1pbnB1dC1jb250YWluZXIuYXNzaWduIGlucHV0JykuZm9jdXMoKTtcblx0XHRcdGxpc3RWaWV3LmNsYXNzTGlzdC5hZGQoXCJoYXNFZGl0YWJsZUl0ZW1cIik7XG5cdFx0fSk7XG5cblx0XHQvLyBUb2dnbGUgaXRlbSBkb25lbmVzc1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmRvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudC50b2dnbGVDbGFzcyhcImRvbmVcIikucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZVwiKTtcblx0XHRcdGxpc3RWaWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJoYXNFZGl0YWJsZUl0ZW1cIik7XG5cdFx0XHRkZXNlbGVjdCgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gc2VsZWN0aW5nIGlucHV0XG5cdFx0ZWxlbWVudC5maW5kKCdtZC1pbnB1dC1jb250YWluZXInKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXHRcdC8vIFByZXZlbnQgZW5kaW5nIGVkaXQgbW9kZSB3aGVuIGNsaWNraW5nIGJ1dHRvblxuXHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblxuXHRcdC8vIExlYXZlIGN1c3RvbSBlZGl0IG1vZGVcblx0XHRmdW5jdGlvbiBkZXNlbGVjdCgpIHtcblx0XHRcdGVsZW1lbnQucmVtb3ZlQ2xhc3MoXCJlZGl0aW5nIGFzc2lnblwiKTtcblx0XHR9XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0SW5mbycsIGJrTGlzdEluZm8pO1xuXG5mdW5jdGlvbiBia0xpc3RJbmZvKGFsbExpc3RzU2VydmljZSkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0dGVtcGxhdGVVcmw6ICcuL3RlbXBsYXRlcy9ia0xpc3RJbmZvLmh0bWwnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7IGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChzY29wZS5saXN0KSB9KTtcblx0XHR9KTtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0VmlldycsIGJrTGlzdFZpZXcpO1xuXG5mdW5jdGlvbiBia0xpc3RWaWV3KCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0Y29udHJvbGxlcjogJ0l0ZW1zQ29udHJvbGxlcicsXG5cdFx0Y29udHJvbGxlckFzOiAnSXRlbXMnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXG5cdFx0dmFyIHN1YmhlYWRlciA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlcicpO1xuXHRcdHZhciB0aXRsZUlucHV0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyIGlucHV0Jyk7XG5cblx0XHQvLyBDbGljayBvdXRzaWRlIG9mIGl0ZW1zIHRvIGV4aXQgZWRpdCBtb2RlXG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0aWYgKGUudGFyZ2V0KSB7XG5cdFx0XHRcdHZhciBia0l0ZW0gPSBpc0JrSXRlbUNoaWxkKGUudGFyZ2V0KTtcblx0XHRcdFx0aWYgKGJrSXRlbSkge1xuXHRcdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUoYmtJdGVtKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gUHJldmVudCBsb3NpbmcgZm9jdXMgb24gYnV0dG9uIGNsaWNrc1xuXHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblxuXHRcdC8vIE1ha2UgdGl0bGUgZWRpdGFibGUgb24gY2xpY2tcblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgLm5hbWUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0bWFrZVRpdGxlRWRpdGFibGUoKTtcblx0XHR9KTtcblxuXHRcdC8vIEV4aXQgdGl0bGUgZWRpdCBtb2RlIG9uIHRpdGxlIGlucHV0IGxvc2luZyBmb2N1c1xuXHRcdHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJykuY2xhc3NMaXN0LnJlbW92ZSgnZWRpdGFibGUnKTtcblx0XHR9KTtcblxuXHRcdC8vIFN3aXRjaCBmb2N1cyB0byBuZXcgaXRlbVxuXHRcdHNjb3BlLiR3YXRjaCgnSXRlbXMuZ2V0Q3VycmVudExpc3QoKS5pdGVtc1swXScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gb24gbmV3IGl0ZW0gYWRkZWRcblx0XHRcdHZhciBuZXdJdGVtID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdiay1pdGVtJyk7XG5cdFx0XHRpZiAobmV3SXRlbSkge1xuXHRcdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0XHRtYWtlSXRlbUVkaXRhYmxlKG5ld0l0ZW0pO1xuXHRcdFx0XHQvLyBmb2N1cyB0aXRsZSBmaWVsZCBieSBkZWZhdWx0OyBkZWxheSB0byB3YWl0IGZvciBzdHlsZSB0byB0YWtlIGVmZmVjdFxuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBuZXdJdGVtLnF1ZXJ5U2VsZWN0b3IoJy50aXRsZSBpbnB1dCcpLmZvY3VzKCk7IH0sIDEwMCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRmdW5jdGlvbiBtYWtlVGl0bGVFZGl0YWJsZSgpIHtcblx0XHRcdHN1YmhlYWRlci5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0dGl0bGVJbnB1dC5mb2N1cygpO1xuXHRcdH1cblx0XHRzY29wZS5tYWtlVGl0bGVFZGl0YWJsZSA9IG1ha2VUaXRsZUVkaXRhYmxlO1xuXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3RBbGwoKSB7XG5cdFx0XHRlbGVtZW50LmZpbmQoJ2JrLWl0ZW0nKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlIGVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVDbGFzcygnaGFzRWRpdGFibGVJdGVtJyk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gbWFrZUl0ZW1FZGl0YWJsZShpdGVtKSB7XG5cdFx0XHRpdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlJyk7XG5cdFx0XHRlbGVtZW50LmFkZENsYXNzKCdoYXNFZGl0YWJsZUl0ZW0nKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBpc0JrSXRlbUNoaWxkKG5vZGUpIHtcblx0XHRcdHZhciBpc0NhcmRDb250ZW50ID0gZmFsc2U7XG5cdFx0XHR3aGlsZSAobm9kZSAmJiBub2RlICE9PSBlbGVtZW50WzBdKSB7XG5cdFx0XHRcdGlmIChub2RlLm5vZGVOYW1lID09PSAnTUQtQ0FSRC1DT05URU5UJykge1xuXHRcdFx0XHRcdGlzQ2FyZENvbnRlbnQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChpc0NhcmRDb250ZW50ICYmIG5vZGUubm9kZU5hbWUgPT09ICdCSy1JVEVNJykge1xuXHRcdFx0XHRcdHJldHVybiBub2RlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG59XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdJdGVtT2JqZWN0JywgSXRlbU9iamVjdCk7XG5cbmZ1bmN0aW9uIEl0ZW1PYmplY3QoKSB7XG5cblx0dmFyIGl0ZW1PYmplY3QgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRpdGxlID0gJyc7XG5cdFx0dGhpcy5ub3RlID0gJyc7XG5cdFx0dGhpcy5hc3NpZ24gPSAnJztcblx0XHR0aGlzLmRvbmUgPSBmYWxzZTtcblx0fVxuXG5cdHJldHVybiBpdGVtT2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnTGlzdE9iamVjdCcsIExpc3RPYmplY3QpO1xuXG5mdW5jdGlvbiBMaXN0T2JqZWN0KEl0ZW1PYmplY3QpIHtcblxuXHR2YXIgbGlzdE9iamVjdCA9IGZ1bmN0aW9uKGlkLCBuYW1lKSB7XG5cdFx0dGhpcy5pZCA9IGlkO1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0dGhpcy5pdGVtcyA9IFtdO1xuXHRcdHRoaXMuYWRkSXRlbSA9IGFkZEl0ZW07XG5cdFx0dGhpcy5nZXREZXNjcmlwdGlvbiA9IGdldERlc2NyaXB0aW9uO1xuXHR9XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHR0aGlzLml0ZW1zLnVuc2hpZnQobmV3IEl0ZW1PYmplY3QoKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXREZXNjcmlwdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5pdGVtcy5tYXAoZnVuY3Rpb24oaXRlbSkgeyBpZiAoIWl0ZW0uZG9uZSkgcmV0dXJuIGl0ZW0udGl0bGUgfSlcblx0XHRcdFx0XHRcdC5maWx0ZXIoZnVuY3Rpb24odmFsKSB7IHJldHVybiB2YWw7IH0pLy8gZ2V0IG5vbi1lbXB0eSBpdGVtc1xuXHRcdFx0XHRcdFx0LmpvaW4oJywgJyk7XG5cdH1cblxuXHRyZXR1cm4gbGlzdE9iamVjdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ2FsbExpc3RzU2VydmljZScsIGFsbExpc3RzU2VydmljZSk7XG5cbmZ1bmN0aW9uIGFsbExpc3RzU2VydmljZShMaXN0T2JqZWN0KSB7XG5cblx0dmFyIGxpc3RzID0gW107XG5cdHZhciBjdXJyZW50TGlzdEluZGV4ID0gdW5kZWZpbmVkO1xuXG5cdHJldHVybiB7XG5cdFx0YWRkOiBhZGQsXG5cdFx0bGlzdHM6IGxpc3RzLFxuXHRcdGN1cnJlbnRMaXN0SW5kZXg6IGN1cnJlbnRMaXN0SW5kZXgsXG5cdFx0c2V0Q3VycmVudExpc3Q6IHNldEN1cnJlbnRMaXN0LFxuXHRcdGdldEN1cnJlbnRMaXN0OiBnZXRDdXJyZW50TGlzdFxuXHR9O1xuXG5cdGZ1bmN0aW9uIGFkZCgpIHtcblx0XHRsaXN0cy51bnNoaWZ0KFxuXHRcdFx0bmV3IExpc3RPYmplY3QoZ2V0VW5pcUlkKCksIFwiTmV3IExpc3QgXCIrKGxpc3RzLmxlbmd0aCsxKSlcblx0XHQpO1xuXHRcdHJldHVybiBsaXN0c1swXTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFVuaXFJZCgpIHtcblx0XHR2YXIgbGVuZ3RoID0gODtcblx0XHRyZXR1cm4gKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpNYXRoLnBvdygzNixsZW5ndGgpKS50b1N0cmluZygzNikpLnNsaWNlKC1sZW5ndGgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZmluZExpc3RCeUlkKGlkKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPGxpc3RzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAobGlzdHMuaWQgPT09IGlkKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHNldEN1cnJlbnRMaXN0KGxpc3QpIHtcblx0XHRpZiAodHlwZW9mIGxpc3QgPT09ICdudW1iZXInKSB7XG5cdFx0XHRjdXJyZW50TGlzdEluZGV4ID0gbGlzdDtcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBsaXN0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Y3VycmVudExpc3RJbmRleCA9IGxpc3RzLmluZGV4T2YobGlzdCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUud2FybigndW5rbm93biBpbnB1dCBmb3IgbGlzdDogJysgdHlwZW9mIGxpc3QpO1xuXHRcdFx0Y29uc29sZS53YXJuKGxpc3QpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGdldEN1cnJlbnRMaXN0KCkge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gbGlzdHNbY3VycmVudExpc3RJbmRleF07XG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ0xpc3Qgbm90IGZvdW5kLiBJbmRleDogJytjdXJyZW50TGlzdEluZGV4KTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0cyk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9