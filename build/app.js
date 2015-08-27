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

		// Enter assign mode
		element[0].querySelector('.actions button.assign').addEventListener('click', function() {
			element.addClass("editable editing assign");
			element[0].querySelector('md-input-container.assign input').focus();
		});

		// Toggle item doneness
		element[0].querySelector('button.done').addEventListener('click', function() {
			element.toggleClass("done").removeClass("editable");
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
					bkItem.classList.add('editable');
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
				newItem.classList.add('editable');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0l0ZW1zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0xpc3RzQ29udHJvbGxlci5qcyIsInNlcnZpY2VzL0l0ZW1PYmplY3QuanMiLCJzZXJ2aWNlcy9MaXN0T2JqZWN0LmpzIiwic2VydmljZXMvYWxsTGlzdHNTZXJ2aWNlLmpzIiwiZGlyZWN0aXZlcy9ia0l0ZW0uanMiLCJkaXJlY3RpdmVzL2JrTGlzdEluZm8uanMiLCJkaXJlY3RpdmVzL2JrTGlzdFZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxNQUFBLFFBQUEsT0FBQSxPQUFBLENBQUE7O0FDQUE7RUFDQSxPQUFBO0VBQ0EsV0FBQSxvQkFBQTs7QUFFQSxTQUFBLGlCQUFBLFlBQUE7Q0FDQSxJQUFBLEtBQUE7Q0FDQSxHQUFBLGtCQUFBO0NBQ0EsR0FBQSxpQkFBQTs7Q0FFQSxTQUFBLGtCQUFBO0VBQ0EsV0FBQSxRQUFBOzs7Q0FHQSxTQUFBLGlCQUFBO0VBQ0EsV0FBQSxRQUFBOzs7OztBQ2RBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsa0JBQUE7O0FBRUEsU0FBQSxpQkFBQTtDQUNBLElBQUEsS0FBQTtDQUNBLEdBQUEsWUFBQTs7O0FDTkE7RUFDQSxPQUFBO0VBQ0EsV0FBQSxtQkFBQTs7QUFFQSxTQUFBLGdCQUFBLGlCQUFBO0NBQ0EsSUFBQSxLQUFBOztDQUVBLEdBQUEsVUFBQTtDQUNBLEdBQUEsaUJBQUEsZ0JBQUE7O0NBRUEsU0FBQSxVQUFBO0VBQ0EsSUFBQSxDQUFBLGdCQUFBLGtCQUFBO0dBQ0EsZ0JBQUEsZUFBQSxnQkFBQTs7RUFFQSxHQUFBLGlCQUFBOzs7OztBQ2RBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxpQkFBQTs7Q0FFQSxLQUFBLFFBQUEsZ0JBQUE7O0NBRUEsS0FBQSxVQUFBLFdBQUE7RUFDQSxnQkFBQSxlQUFBLGdCQUFBOzs7Q0FHQSxLQUFBLGNBQUEsZ0JBQUE7Ozs7QUNaQTtFQUNBLE9BQUE7RUFDQSxRQUFBLGNBQUE7O0FBRUEsU0FBQSxhQUFBOztDQUVBLElBQUEsYUFBQSxXQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsS0FBQSxPQUFBO0VBQ0EsS0FBQSxTQUFBO0VBQ0EsS0FBQSxPQUFBOzs7Q0FHQSxPQUFBOzs7QUNiQTtFQUNBLE9BQUE7RUFDQSxRQUFBLGNBQUE7O0FBRUEsU0FBQSxXQUFBLFlBQUE7O0NBRUEsSUFBQSxhQUFBLFNBQUEsSUFBQSxNQUFBO0VBQ0EsS0FBQSxLQUFBO0VBQ0EsS0FBQSxPQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsS0FBQSxVQUFBO0VBQ0EsS0FBQSxpQkFBQTs7O0NBR0EsU0FBQSxVQUFBO0VBQ0EsS0FBQSxNQUFBLFFBQUEsSUFBQTs7O0NBR0EsU0FBQSxpQkFBQTtFQUNBLE9BQUEsS0FBQSxNQUFBLElBQUEsU0FBQSxNQUFBLEVBQUEsSUFBQSxDQUFBLEtBQUEsTUFBQSxPQUFBLEtBQUE7T0FDQSxPQUFBLFNBQUEsS0FBQSxFQUFBLE9BQUE7T0FDQSxLQUFBOzs7Q0FHQSxPQUFBOzs7O0FDeEJBO0VBQ0EsT0FBQTtFQUNBLFFBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxZQUFBOztDQUVBLElBQUEsUUFBQTtDQUNBLElBQUEsbUJBQUE7O0NBRUEsT0FBQTtFQUNBLEtBQUE7RUFDQSxPQUFBO0VBQ0Esa0JBQUE7RUFDQSxnQkFBQTtFQUNBLGdCQUFBOzs7Q0FHQSxTQUFBLE1BQUE7RUFDQSxNQUFBO0dBQ0EsSUFBQSxXQUFBLGFBQUEsYUFBQSxNQUFBLE9BQUE7O0VBRUEsT0FBQSxNQUFBOzs7Q0FHQSxTQUFBLFlBQUE7RUFDQSxJQUFBLFNBQUE7RUFDQSxPQUFBLENBQUEsS0FBQSxNQUFBLEtBQUEsU0FBQSxLQUFBLElBQUEsR0FBQSxTQUFBLFNBQUEsS0FBQSxNQUFBLENBQUE7OztDQUdBLFNBQUEsYUFBQSxJQUFBO0VBQ0EsS0FBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsUUFBQSxLQUFBO0dBQ0EsSUFBQSxNQUFBLE9BQUEsSUFBQTtJQUNBLE9BQUE7Ozs7O0NBS0EsU0FBQSxlQUFBLE1BQUE7RUFDQSxJQUFBLE9BQUEsU0FBQSxVQUFBO0dBQ0EsbUJBQUE7U0FDQSxJQUFBLE9BQUEsU0FBQSxVQUFBO0dBQ0EsbUJBQUEsTUFBQSxRQUFBO1NBQ0E7R0FDQSxRQUFBLEtBQUEsNEJBQUEsT0FBQTtHQUNBLFFBQUEsS0FBQTs7OztDQUlBLFNBQUEsaUJBQUE7RUFDQSxJQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsTUFBQSxHQUFBO0dBQ0EsUUFBQSxLQUFBLDBCQUFBO0dBQ0EsUUFBQSxLQUFBO0dBQ0EsT0FBQTs7Ozs7QUN0REE7RUFDQSxPQUFBO0VBQ0EsVUFBQSxVQUFBOztBQUVBLFNBQUEsU0FBQTtDQUNBLElBQUEsWUFBQTtFQUNBLFVBQUE7RUFDQSxNQUFBO0VBQ0EsYUFBQTtFQUNBLFlBQUE7RUFDQSxjQUFBOzs7Q0FHQSxPQUFBOztDQUVBLFNBQUEsS0FBQSxPQUFBLFNBQUEsT0FBQTs7RUFFQSxRQUFBLEdBQUEsU0FBQSxVQUFBLEdBQUE7R0FDQTs7OztFQUlBLFFBQUEsR0FBQSxjQUFBLDBCQUFBLGlCQUFBLFNBQUEsV0FBQTtHQUNBLFFBQUEsU0FBQTtHQUNBLFFBQUEsR0FBQSxjQUFBLG1DQUFBOzs7O0VBSUEsUUFBQSxHQUFBLGNBQUEsZUFBQSxpQkFBQSxTQUFBLFdBQUE7R0FDQSxRQUFBLFlBQUEsUUFBQSxZQUFBO0dBQ0E7Ozs7RUFJQSxRQUFBLEtBQUEsc0JBQUEsR0FBQSxTQUFBLFNBQUEsR0FBQTtHQUNBLEVBQUE7OztFQUdBLFFBQUEsS0FBQSxVQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQSxFQUFBOzs7O0VBSUEsU0FBQSxXQUFBO0dBQ0EsUUFBQSxZQUFBOzs7OztBQzVDQTtFQUNBLE9BQUE7RUFDQSxVQUFBLGNBQUE7O0FBRUEsU0FBQSxXQUFBLGlCQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxhQUFBOzs7Q0FHQSxPQUFBOztDQUVBLFNBQUEsS0FBQSxPQUFBLFNBQUEsT0FBQTtFQUNBLFFBQUEsR0FBQSxTQUFBLFdBQUE7R0FDQSxNQUFBLE9BQUEsV0FBQSxFQUFBLGdCQUFBLGVBQUEsTUFBQTs7Ozs7QUNmQTtFQUNBLE9BQUE7RUFDQSxVQUFBLGNBQUE7O0FBRUEsU0FBQSxhQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxZQUFBO0VBQ0EsY0FBQTs7O0NBR0EsT0FBQTs7Q0FFQSxTQUFBLEtBQUEsT0FBQSxTQUFBLE9BQUE7O0VBRUEsSUFBQSxZQUFBLFFBQUEsR0FBQSxjQUFBO0VBQ0EsSUFBQSxhQUFBLFFBQUEsR0FBQSxjQUFBOzs7RUFHQSxRQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQTtHQUNBLElBQUEsRUFBQSxRQUFBO0lBQ0EsSUFBQSxTQUFBLGNBQUEsRUFBQTtJQUNBLElBQUEsUUFBQTtLQUNBLE9BQUEsVUFBQSxJQUFBOzs7Ozs7RUFNQSxRQUFBLEtBQUEsVUFBQSxHQUFBLFNBQUEsU0FBQSxHQUFBO0dBQ0EsRUFBQTs7OztFQUlBLFFBQUEsR0FBQSxjQUFBLHVCQUFBLGlCQUFBLFNBQUEsV0FBQTtHQUNBOzs7O0VBSUEsV0FBQSxpQkFBQSxRQUFBLFdBQUE7R0FDQSxRQUFBLEdBQUEsY0FBQSxpQkFBQSxVQUFBLE9BQUE7Ozs7RUFJQSxNQUFBLE9BQUEsbUNBQUEsV0FBQTs7R0FFQSxJQUFBLFVBQUEsUUFBQSxHQUFBLGNBQUE7R0FDQSxJQUFBLFNBQUE7SUFDQTtJQUNBLFFBQUEsVUFBQSxJQUFBOztJQUVBLFdBQUEsV0FBQSxFQUFBLFFBQUEsY0FBQSxnQkFBQSxZQUFBOzs7O0VBSUEsU0FBQSxvQkFBQTtHQUNBLFVBQUEsVUFBQSxJQUFBO0dBQ0EsV0FBQTs7RUFFQSxNQUFBLG9CQUFBOztFQUVBLFNBQUEsY0FBQTtHQUNBLFFBQUEsS0FBQSxXQUFBLFlBQUE7OztFQUdBLFNBQUEsY0FBQSxNQUFBO0dBQ0EsSUFBQSxnQkFBQTtHQUNBLE9BQUEsUUFBQSxTQUFBLFFBQUEsSUFBQTtJQUNBLElBQUEsS0FBQSxhQUFBLG1CQUFBO0tBQ0EsZ0JBQUE7O0lBRUEsSUFBQSxpQkFBQSxLQUFBLGFBQUEsV0FBQTtLQUNBLE9BQUE7O0lBRUEsT0FBQSxLQUFBOztHQUVBLE9BQUE7Ozs7QUFJQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFsnbmdNYXRlcmlhbCddKTtcbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0Jhc2tldENvbnRyb2xsZXInLCBCYXNrZXRDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gQmFza2V0Q29udHJvbGxlcigkbWRTaWRlbmF2KSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cdHZtLnRvZ2dsZUxpc3RzVmlldyA9IHRvZ2dsZUxpc3RzVmlldztcblx0dm0uY2xvc2VMaXN0c1ZpZXcgPSBjbG9zZUxpc3RzVmlldztcblxuXHRmdW5jdGlvbiB0b2dnbGVMaXN0c1ZpZXcoKSB7XG5cdFx0JG1kU2lkZW5hdignbGVmdCcpLnRvZ2dsZSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2xvc2VMaXN0c1ZpZXcoKSB7XG5cdFx0JG1kU2lkZW5hdignbGVmdCcpLmNsb3NlKCk7XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1Db250cm9sbGVyJywgSXRlbUNvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBJdGVtQ29udHJvbGxlcigpIHtcblx0dmFyIHZtID0gdGhpcztcblx0dm0uZmFiSXNPcGVuID0gZmFsc2U7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdJdGVtc0NvbnRyb2xsZXInLCBJdGVtc0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBJdGVtc0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cblx0dm0uYWRkSXRlbSA9IGFkZEl0ZW07XG5cdHZtLmdldEN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0aWYgKCFhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKSkge1xuXHRcdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdFx0fVxuXHRcdHZtLmdldEN1cnJlbnRMaXN0KCkuYWRkSXRlbSgpO1xuXHR9XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdMaXN0c0NvbnRyb2xsZXInLCBMaXN0c0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBMaXN0c0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdFxuXHR0aGlzLmxpc3RzID0gYWxsTGlzdHNTZXJ2aWNlLmxpc3RzO1xuXG5cdHRoaXMuYWRkTGlzdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChhbGxMaXN0c1NlcnZpY2UuYWRkKCkpO1xuXHR9O1xuXG5cdHRoaXMuY3VycmVudExpc3QgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdJdGVtT2JqZWN0JywgSXRlbU9iamVjdCk7XG5cbmZ1bmN0aW9uIEl0ZW1PYmplY3QoKSB7XG5cblx0dmFyIGl0ZW1PYmplY3QgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRpdGxlID0gJyc7XG5cdFx0dGhpcy5ub3RlID0gJyc7XG5cdFx0dGhpcy5hc3NpZ24gPSAnJztcblx0XHR0aGlzLmRvbmUgPSBmYWxzZTtcblx0fVxuXG5cdHJldHVybiBpdGVtT2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnTGlzdE9iamVjdCcsIExpc3RPYmplY3QpO1xuXG5mdW5jdGlvbiBMaXN0T2JqZWN0KEl0ZW1PYmplY3QpIHtcblxuXHR2YXIgbGlzdE9iamVjdCA9IGZ1bmN0aW9uKGlkLCBuYW1lKSB7XG5cdFx0dGhpcy5pZCA9IGlkO1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0dGhpcy5pdGVtcyA9IFtdO1xuXHRcdHRoaXMuYWRkSXRlbSA9IGFkZEl0ZW07XG5cdFx0dGhpcy5nZXREZXNjcmlwdGlvbiA9IGdldERlc2NyaXB0aW9uO1xuXHR9XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHR0aGlzLml0ZW1zLnVuc2hpZnQobmV3IEl0ZW1PYmplY3QoKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXREZXNjcmlwdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5pdGVtcy5tYXAoZnVuY3Rpb24oaXRlbSkgeyBpZiAoIWl0ZW0uZG9uZSkgcmV0dXJuIGl0ZW0udGl0bGUgfSlcblx0XHRcdFx0XHRcdC5maWx0ZXIoZnVuY3Rpb24odmFsKSB7IHJldHVybiB2YWw7IH0pLy8gZ2V0IG5vbi1lbXB0eSBpdGVtc1xuXHRcdFx0XHRcdFx0LmpvaW4oJywgJyk7XG5cdH1cblxuXHRyZXR1cm4gbGlzdE9iamVjdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ2FsbExpc3RzU2VydmljZScsIGFsbExpc3RzU2VydmljZSk7XG5cbmZ1bmN0aW9uIGFsbExpc3RzU2VydmljZShMaXN0T2JqZWN0KSB7XG5cblx0dmFyIGxpc3RzID0gW107XG5cdHZhciBjdXJyZW50TGlzdEluZGV4ID0gdW5kZWZpbmVkO1xuXG5cdHJldHVybiB7XG5cdFx0YWRkOiBhZGQsXG5cdFx0bGlzdHM6IGxpc3RzLFxuXHRcdGN1cnJlbnRMaXN0SW5kZXg6IGN1cnJlbnRMaXN0SW5kZXgsXG5cdFx0c2V0Q3VycmVudExpc3Q6IHNldEN1cnJlbnRMaXN0LFxuXHRcdGdldEN1cnJlbnRMaXN0OiBnZXRDdXJyZW50TGlzdFxuXHR9O1xuXG5cdGZ1bmN0aW9uIGFkZCgpIHtcblx0XHRsaXN0cy51bnNoaWZ0KFxuXHRcdFx0bmV3IExpc3RPYmplY3QoZ2V0VW5pcUlkKCksIFwiTmV3IExpc3QgXCIrKGxpc3RzLmxlbmd0aCsxKSlcblx0XHQpO1xuXHRcdHJldHVybiBsaXN0c1swXTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFVuaXFJZCgpIHtcblx0XHR2YXIgbGVuZ3RoID0gODtcblx0XHRyZXR1cm4gKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpNYXRoLnBvdygzNixsZW5ndGgpKS50b1N0cmluZygzNikpLnNsaWNlKC1sZW5ndGgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZmluZExpc3RCeUlkKGlkKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPGxpc3RzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAobGlzdHMuaWQgPT09IGlkKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHNldEN1cnJlbnRMaXN0KGxpc3QpIHtcblx0XHRpZiAodHlwZW9mIGxpc3QgPT09ICdudW1iZXInKSB7XG5cdFx0XHRjdXJyZW50TGlzdEluZGV4ID0gbGlzdDtcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBsaXN0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Y3VycmVudExpc3RJbmRleCA9IGxpc3RzLmluZGV4T2YobGlzdCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUud2FybigndW5rbm93biBpbnB1dCBmb3IgbGlzdDogJysgdHlwZW9mIGxpc3QpO1xuXHRcdFx0Y29uc29sZS53YXJuKGxpc3QpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGdldEN1cnJlbnRMaXN0KCkge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gbGlzdHNbY3VycmVudExpc3RJbmRleF07XG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ0xpc3Qgbm90IGZvdW5kLiBJbmRleDogJytjdXJyZW50TGlzdEluZGV4KTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0cyk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0l0ZW0nLCBia0l0ZW0pO1xuXG5mdW5jdGlvbiBia0l0ZW0oKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrSXRlbS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnSXRlbUNvbnRyb2xsZXInLFxuXHRcdGNvbnRyb2xsZXJBczogJ0l0ZW0nXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdC8vIEVuZCBjdXN0b20gZWRpdCBtb2RlIG9uIGNsaWNrXG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0ZGVzZWxlY3QoKTtcblx0XHR9KTtcblxuXHRcdC8vIEVudGVyIGFzc2lnbiBtb2RlXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcuYWN0aW9ucyBidXR0b24uYXNzaWduJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignbWQtaW5wdXQtY29udGFpbmVyLmFzc2lnbiBpbnB1dCcpLmZvY3VzKCk7XG5cdFx0fSk7XG5cblx0XHQvLyBUb2dnbGUgaXRlbSBkb25lbmVzc1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmRvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudC50b2dnbGVDbGFzcyhcImRvbmVcIikucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZVwiKTtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cblx0XHQvLyBQcmV2ZW50IGVuZGluZyBlZGl0IG1vZGUgd2hlbiBzZWxlY3RpbmcgaW5wdXRcblx0XHRlbGVtZW50LmZpbmQoJ21kLWlucHV0LWNvbnRhaW5lcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fSk7XG5cdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gY2xpY2tpbmcgYnV0dG9uXG5cdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gTGVhdmUgY3VzdG9tIGVkaXQgbW9kZVxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0KCkge1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVDbGFzcyhcImVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RJbmZvJywgYmtMaXN0SW5mbyk7XG5cbmZ1bmN0aW9uIGJrTGlzdEluZm8oYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrTGlzdEluZm8uaHRtbCdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHsgYWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KHNjb3BlLmxpc3QpIH0pO1xuXHRcdH0pO1xuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RWaWV3JywgYmtMaXN0Vmlldyk7XG5cbmZ1bmN0aW9uIGJrTGlzdFZpZXcoKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cblx0XHR2YXIgc3ViaGVhZGVyID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJyk7XG5cdFx0dmFyIHRpdGxlSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgaW5wdXQnKTtcblxuXHRcdC8vIENsaWNrIG91dHNpZGUgb2YgaXRlbXMgdG8gZXhpdCBlZGl0IG1vZGVcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRpZiAoZS50YXJnZXQpIHtcblx0XHRcdFx0dmFyIGJrSXRlbSA9IGlzQmtJdGVtQ2hpbGQoZS50YXJnZXQpO1xuXHRcdFx0XHRpZiAoYmtJdGVtKSB7XG5cdFx0XHRcdFx0YmtJdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIFByZXZlbnQgbG9zaW5nIGZvY3VzIG9uIGJ1dHRvbiBjbGlja3Ncblx0XHRlbGVtZW50LmZpbmQoJ2J1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fSk7XG5cblx0XHQvLyBNYWtlIHRpdGxlIGVkaXRhYmxlIG9uIGNsaWNrXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyIC5uYW1lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdG1ha2VUaXRsZUVkaXRhYmxlKCk7XG5cdFx0fSk7XG5cblx0XHQvLyBFeGl0IHRpdGxlIGVkaXQgbW9kZSBvbiB0aXRsZSBpbnB1dCBsb3NpbmcgZm9jdXNcblx0XHR0aXRsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlcicpLmNsYXNzTGlzdC5yZW1vdmUoJ2VkaXRhYmxlJyk7XG5cdFx0fSk7XG5cblx0XHQvLyBTd2l0Y2ggZm9jdXMgdG8gbmV3IGl0ZW1cblx0XHRzY29wZS4kd2F0Y2goJ0l0ZW1zLmdldEN1cnJlbnRMaXN0KCkuaXRlbXNbMF0nLCBmdW5jdGlvbigpIHtcblx0XHRcdC8vIG9uIG5ldyBpdGVtIGFkZGVkXG5cdFx0XHR2YXIgbmV3SXRlbSA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYmstaXRlbScpO1xuXHRcdFx0aWYgKG5ld0l0ZW0pIHtcblx0XHRcdFx0ZGVzZWxlY3RBbGwoKTtcblx0XHRcdFx0bmV3SXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0XHQvLyBmb2N1cyB0aXRsZSBmaWVsZCBieSBkZWZhdWx0OyBkZWxheSB0byB3YWl0IGZvciBzdHlsZSB0byB0YWtlIGVmZmVjdFxuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBuZXdJdGVtLnF1ZXJ5U2VsZWN0b3IoJy50aXRsZSBpbnB1dCcpLmZvY3VzKCk7IH0sIDEwMCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRmdW5jdGlvbiBtYWtlVGl0bGVFZGl0YWJsZSgpIHtcblx0XHRcdHN1YmhlYWRlci5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0dGl0bGVJbnB1dC5mb2N1cygpO1xuXHRcdH1cblx0XHRzY29wZS5tYWtlVGl0bGVFZGl0YWJsZSA9IG1ha2VUaXRsZUVkaXRhYmxlO1xuXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3RBbGwoKSB7XG5cdFx0XHRlbGVtZW50LmZpbmQoJ2JrLWl0ZW0nKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlIGVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGlzQmtJdGVtQ2hpbGQobm9kZSkge1xuXHRcdFx0dmFyIGlzQ2FyZENvbnRlbnQgPSBmYWxzZTtcblx0XHRcdHdoaWxlIChub2RlICYmIG5vZGUgIT09IGVsZW1lbnRbMF0pIHtcblx0XHRcdFx0aWYgKG5vZGUubm9kZU5hbWUgPT09ICdNRC1DQVJELUNPTlRFTlQnKSB7XG5cdFx0XHRcdFx0aXNDYXJkQ29udGVudCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGlzQ2FyZENvbnRlbnQgJiYgbm9kZS5ub2RlTmFtZSA9PT0gJ0JLLUlURU0nKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5vZGU7XG5cdFx0XHRcdH1cblx0XHRcdFx0bm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==