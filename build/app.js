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
				newItem.querySelector('.title input').focus(); // focus title field by default
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0l0ZW1zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0xpc3RzQ29udHJvbGxlci5qcyIsInNlcnZpY2VzL0l0ZW1PYmplY3QuanMiLCJzZXJ2aWNlcy9MaXN0T2JqZWN0LmpzIiwic2VydmljZXMvYWxsTGlzdHNTZXJ2aWNlLmpzIiwiZGlyZWN0aXZlcy9ia0l0ZW0uanMiLCJkaXJlY3RpdmVzL2JrTGlzdEluZm8uanMiLCJkaXJlY3RpdmVzL2JrTGlzdFZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxNQUFBLFFBQUEsT0FBQSxPQUFBLENBQUE7O0FDQUE7RUFDQSxPQUFBO0VBQ0EsV0FBQSxvQkFBQTs7QUFFQSxTQUFBLGlCQUFBLFlBQUE7Q0FDQSxJQUFBLEtBQUE7Q0FDQSxHQUFBLGtCQUFBO0NBQ0EsR0FBQSxpQkFBQTs7Q0FFQSxTQUFBLGtCQUFBO0VBQ0EsV0FBQSxRQUFBOzs7Q0FHQSxTQUFBLGlCQUFBO0VBQ0EsV0FBQSxRQUFBOzs7OztBQ2RBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsa0JBQUE7O0FBRUEsU0FBQSxpQkFBQTtDQUNBLElBQUEsS0FBQTs7O0FDTEE7RUFDQSxPQUFBO0VBQ0EsV0FBQSxtQkFBQTs7QUFFQSxTQUFBLGdCQUFBLGlCQUFBO0NBQ0EsSUFBQSxLQUFBOztDQUVBLEdBQUEsVUFBQTtDQUNBLEdBQUEsaUJBQUEsZ0JBQUE7O0NBRUEsU0FBQSxVQUFBO0VBQ0EsSUFBQSxDQUFBLGdCQUFBLGtCQUFBO0dBQ0EsZ0JBQUEsZUFBQSxnQkFBQTs7RUFFQSxHQUFBLGlCQUFBOzs7OztBQ2RBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxpQkFBQTs7Q0FFQSxLQUFBLFFBQUEsZ0JBQUE7O0NBRUEsS0FBQSxVQUFBLFdBQUE7RUFDQSxnQkFBQSxlQUFBLGdCQUFBOzs7Q0FHQSxLQUFBLGNBQUEsZ0JBQUE7Ozs7QUNaQTtFQUNBLE9BQUE7RUFDQSxRQUFBLGNBQUE7O0FBRUEsU0FBQSxhQUFBOztDQUVBLElBQUEsYUFBQSxXQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsS0FBQSxPQUFBO0VBQ0EsS0FBQSxTQUFBO0VBQ0EsS0FBQSxPQUFBOzs7Q0FHQSxPQUFBOzs7QUNiQTtFQUNBLE9BQUE7RUFDQSxRQUFBLGNBQUE7O0FBRUEsU0FBQSxXQUFBLFlBQUE7O0NBRUEsSUFBQSxhQUFBLFNBQUEsSUFBQSxNQUFBO0VBQ0EsS0FBQSxLQUFBO0VBQ0EsS0FBQSxPQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsS0FBQSxVQUFBO0VBQ0EsS0FBQSxpQkFBQTs7O0NBR0EsU0FBQSxVQUFBO0VBQ0EsS0FBQSxNQUFBLFFBQUEsSUFBQTs7O0NBR0EsU0FBQSxpQkFBQTtFQUNBLE9BQUEsS0FBQSxNQUFBLElBQUEsU0FBQSxNQUFBLEVBQUEsSUFBQSxDQUFBLEtBQUEsTUFBQSxPQUFBLEtBQUE7T0FDQSxPQUFBLFNBQUEsS0FBQSxFQUFBLE9BQUE7T0FDQSxLQUFBOzs7Q0FHQSxPQUFBOzs7O0FDeEJBO0VBQ0EsT0FBQTtFQUNBLFFBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxZQUFBOztDQUVBLElBQUEsUUFBQTtDQUNBLElBQUEsbUJBQUE7O0NBRUEsT0FBQTtFQUNBLEtBQUE7RUFDQSxPQUFBO0VBQ0Esa0JBQUE7RUFDQSxnQkFBQTtFQUNBLGdCQUFBOzs7Q0FHQSxTQUFBLE1BQUE7RUFDQSxNQUFBO0dBQ0EsSUFBQSxXQUFBLGFBQUEsYUFBQSxNQUFBLE9BQUE7O0VBRUEsT0FBQSxNQUFBOzs7Q0FHQSxTQUFBLFlBQUE7RUFDQSxJQUFBLFNBQUE7RUFDQSxPQUFBLENBQUEsS0FBQSxNQUFBLEtBQUEsU0FBQSxLQUFBLElBQUEsR0FBQSxTQUFBLFNBQUEsS0FBQSxNQUFBLENBQUE7OztDQUdBLFNBQUEsYUFBQSxJQUFBO0VBQ0EsS0FBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsUUFBQSxLQUFBO0dBQ0EsSUFBQSxNQUFBLE9BQUEsSUFBQTtJQUNBLE9BQUE7Ozs7O0NBS0EsU0FBQSxlQUFBLE1BQUE7RUFDQSxJQUFBLE9BQUEsU0FBQSxVQUFBO0dBQ0EsbUJBQUE7U0FDQSxJQUFBLE9BQUEsU0FBQSxVQUFBO0dBQ0EsbUJBQUEsTUFBQSxRQUFBO1NBQ0E7R0FDQSxRQUFBLEtBQUEsNEJBQUEsT0FBQTtHQUNBLFFBQUEsS0FBQTs7OztDQUlBLFNBQUEsaUJBQUE7RUFDQSxJQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsTUFBQSxHQUFBO0dBQ0EsUUFBQSxLQUFBLDBCQUFBO0dBQ0EsUUFBQSxLQUFBO0dBQ0EsT0FBQTs7Ozs7QUN0REE7RUFDQSxPQUFBO0VBQ0EsVUFBQSxVQUFBOztBQUVBLFNBQUEsU0FBQTtDQUNBLElBQUEsWUFBQTtFQUNBLFVBQUE7RUFDQSxNQUFBO0VBQ0EsYUFBQTtFQUNBLFlBQUE7RUFDQSxjQUFBOzs7Q0FHQSxPQUFBOztDQUVBLFNBQUEsS0FBQSxPQUFBLFNBQUEsT0FBQTs7RUFFQSxRQUFBLEdBQUEsU0FBQSxVQUFBLEdBQUE7R0FDQTs7OztFQUlBLFFBQUEsR0FBQSxjQUFBLDBCQUFBLGlCQUFBLFNBQUEsV0FBQTtHQUNBLFFBQUEsU0FBQTtHQUNBLFFBQUEsR0FBQSxjQUFBLG1DQUFBOzs7O0VBSUEsUUFBQSxHQUFBLGNBQUEsZUFBQSxpQkFBQSxTQUFBLFdBQUE7R0FDQSxRQUFBLFlBQUEsUUFBQSxZQUFBO0dBQ0E7Ozs7RUFJQSxRQUFBLEtBQUEsc0JBQUEsR0FBQSxTQUFBLFNBQUEsR0FBQTtHQUNBLEVBQUE7OztFQUdBLFFBQUEsS0FBQSxVQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQSxFQUFBOzs7O0VBSUEsU0FBQSxXQUFBO0dBQ0EsUUFBQSxZQUFBOzs7OztBQzVDQTtFQUNBLE9BQUE7RUFDQSxVQUFBLGNBQUE7O0FBRUEsU0FBQSxXQUFBLGlCQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxhQUFBOzs7Q0FHQSxPQUFBOztDQUVBLFNBQUEsS0FBQSxPQUFBLFNBQUEsT0FBQTtFQUNBLFFBQUEsR0FBQSxTQUFBLFdBQUE7R0FDQSxNQUFBLE9BQUEsV0FBQSxFQUFBLGdCQUFBLGVBQUEsTUFBQTs7Ozs7QUNmQTtFQUNBLE9BQUE7RUFDQSxVQUFBLGNBQUE7O0FBRUEsU0FBQSxhQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxZQUFBO0VBQ0EsY0FBQTs7O0NBR0EsT0FBQTs7Q0FFQSxTQUFBLEtBQUEsT0FBQSxTQUFBLE9BQUE7O0VBRUEsSUFBQSxZQUFBLFFBQUEsR0FBQSxjQUFBO0VBQ0EsSUFBQSxhQUFBLFFBQUEsR0FBQSxjQUFBOzs7RUFHQSxRQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQTtHQUNBLElBQUEsRUFBQSxRQUFBO0lBQ0EsSUFBQSxTQUFBLGNBQUEsRUFBQTtJQUNBLElBQUEsUUFBQTtLQUNBLE9BQUEsVUFBQSxJQUFBOzs7Ozs7RUFNQSxRQUFBLEtBQUEsVUFBQSxHQUFBLFNBQUEsU0FBQSxHQUFBO0dBQ0EsRUFBQTs7OztFQUlBLFFBQUEsR0FBQSxjQUFBLHVCQUFBLGlCQUFBLFNBQUEsV0FBQTtHQUNBOzs7O0VBSUEsV0FBQSxpQkFBQSxRQUFBLFdBQUE7R0FDQSxRQUFBLEdBQUEsY0FBQSxpQkFBQSxVQUFBLE9BQUE7Ozs7RUFJQSxNQUFBLE9BQUEsbUNBQUEsV0FBQTs7R0FFQSxJQUFBLFVBQUEsUUFBQSxHQUFBLGNBQUE7R0FDQSxJQUFBLFNBQUE7SUFDQTtJQUNBLFFBQUEsVUFBQSxJQUFBO0lBQ0EsUUFBQSxjQUFBLGdCQUFBOzs7O0VBSUEsU0FBQSxvQkFBQTtHQUNBLFVBQUEsVUFBQSxJQUFBO0dBQ0EsV0FBQTs7RUFFQSxNQUFBLG9CQUFBOztFQUVBLFNBQUEsY0FBQTtHQUNBLFFBQUEsS0FBQSxXQUFBLFlBQUE7OztFQUdBLFNBQUEsY0FBQSxNQUFBO0dBQ0EsSUFBQSxnQkFBQTtHQUNBLE9BQUEsUUFBQSxTQUFBLFFBQUEsSUFBQTtJQUNBLElBQUEsS0FBQSxhQUFBLG1CQUFBO0tBQ0EsZ0JBQUE7O0lBRUEsSUFBQSxpQkFBQSxLQUFBLGFBQUEsV0FBQTtLQUNBLE9BQUE7O0lBRUEsT0FBQSxLQUFBOztHQUVBLE9BQUE7Ozs7QUFJQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFsnbmdNYXRlcmlhbCddKTtcbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0Jhc2tldENvbnRyb2xsZXInLCBCYXNrZXRDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gQmFza2V0Q29udHJvbGxlcigkbWRTaWRlbmF2KSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cdHZtLnRvZ2dsZUxpc3RzVmlldyA9IHRvZ2dsZUxpc3RzVmlldztcblx0dm0uY2xvc2VMaXN0c1ZpZXcgPSBjbG9zZUxpc3RzVmlldztcblxuXHRmdW5jdGlvbiB0b2dnbGVMaXN0c1ZpZXcoKSB7XG5cdFx0JG1kU2lkZW5hdignbGVmdCcpLnRvZ2dsZSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2xvc2VMaXN0c1ZpZXcoKSB7XG5cdFx0JG1kU2lkZW5hdignbGVmdCcpLmNsb3NlKCk7XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1Db250cm9sbGVyJywgSXRlbUNvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBJdGVtQ29udHJvbGxlcigpIHtcblx0dmFyIHZtID0gdGhpcztcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1zQ29udHJvbGxlcicsIEl0ZW1zQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1zQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblx0dmFyIHZtID0gdGhpcztcblxuXHR2bS5hZGRJdGVtID0gYWRkSXRlbTtcblx0dm0uZ2V0Q3VycmVudExpc3QgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3Q7XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHRpZiAoIWFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpKSB7XG5cdFx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0XHR9XG5cdFx0dm0uZ2V0Q3VycmVudExpc3QoKS5hZGRJdGVtKCk7XG5cdH1cblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0xpc3RzQ29udHJvbGxlcicsIExpc3RzQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIExpc3RzQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblx0XG5cdHRoaXMubGlzdHMgPSBhbGxMaXN0c1NlcnZpY2UubGlzdHM7XG5cblx0dGhpcy5hZGRMaXN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdH07XG5cblx0dGhpcy5jdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0l0ZW1PYmplY3QnLCBJdGVtT2JqZWN0KTtcblxuZnVuY3Rpb24gSXRlbU9iamVjdCgpIHtcblxuXHR2YXIgaXRlbU9iamVjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudGl0bGUgPSAnJztcblx0XHR0aGlzLm5vdGUgPSAnJztcblx0XHR0aGlzLmFzc2lnbiA9ICcnO1xuXHRcdHRoaXMuZG9uZSA9IGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIGl0ZW1PYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdMaXN0T2JqZWN0JywgTGlzdE9iamVjdCk7XG5cbmZ1bmN0aW9uIExpc3RPYmplY3QoSXRlbU9iamVjdCkge1xuXG5cdHZhciBsaXN0T2JqZWN0ID0gZnVuY3Rpb24oaWQsIG5hbWUpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLml0ZW1zID0gW107XG5cdFx0dGhpcy5hZGRJdGVtID0gYWRkSXRlbTtcblx0XHR0aGlzLmdldERlc2NyaXB0aW9uID0gZ2V0RGVzY3JpcHRpb247XG5cdH1cblxuXHRmdW5jdGlvbiBhZGRJdGVtKCkge1xuXHRcdHRoaXMuaXRlbXMudW5zaGlmdChuZXcgSXRlbU9iamVjdCgpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldERlc2NyaXB0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLml0ZW1zLm1hcChmdW5jdGlvbihpdGVtKSB7IGlmICghaXRlbS5kb25lKSByZXR1cm4gaXRlbS50aXRsZSB9KVxuXHRcdFx0XHRcdFx0LmZpbHRlcihmdW5jdGlvbih2YWwpIHsgcmV0dXJuIHZhbDsgfSkvLyBnZXQgbm9uLWVtcHR5IGl0ZW1zXG5cdFx0XHRcdFx0XHQuam9pbignLCAnKTtcblx0fVxuXG5cdHJldHVybiBsaXN0T2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnYWxsTGlzdHNTZXJ2aWNlJywgYWxsTGlzdHNTZXJ2aWNlKTtcblxuZnVuY3Rpb24gYWxsTGlzdHNTZXJ2aWNlKExpc3RPYmplY3QpIHtcblxuXHR2YXIgbGlzdHMgPSBbXTtcblx0dmFyIGN1cnJlbnRMaXN0SW5kZXggPSB1bmRlZmluZWQ7XG5cblx0cmV0dXJuIHtcblx0XHRhZGQ6IGFkZCxcblx0XHRsaXN0czogbGlzdHMsXG5cdFx0Y3VycmVudExpc3RJbmRleDogY3VycmVudExpc3RJbmRleCxcblx0XHRzZXRDdXJyZW50TGlzdDogc2V0Q3VycmVudExpc3QsXG5cdFx0Z2V0Q3VycmVudExpc3Q6IGdldEN1cnJlbnRMaXN0XG5cdH07XG5cblx0ZnVuY3Rpb24gYWRkKCkge1xuXHRcdGxpc3RzLnVuc2hpZnQoXG5cdFx0XHRuZXcgTGlzdE9iamVjdChnZXRVbmlxSWQoKSwgXCJOZXcgTGlzdCBcIisobGlzdHMubGVuZ3RoKzEpKVxuXHRcdCk7XG5cdFx0cmV0dXJuIGxpc3RzWzBdO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0VW5pcUlkKCkge1xuXHRcdHZhciBsZW5ndGggPSA4O1xuXHRcdHJldHVybiAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKk1hdGgucG93KDM2LGxlbmd0aCkpLnRvU3RyaW5nKDM2KSkuc2xpY2UoLWxlbmd0aCk7XG5cdH1cblxuXHRmdW5jdGlvbiBmaW5kTGlzdEJ5SWQoaWQpIHtcblx0XHRmb3IgKHZhciBpPTA7IGk8bGlzdHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChsaXN0cy5pZCA9PT0gaWQpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gc2V0Q3VycmVudExpc3QobGlzdCkge1xuXHRcdGlmICh0eXBlb2YgbGlzdCA9PT0gJ251bWJlcicpIHtcblx0XHRcdGN1cnJlbnRMaXN0SW5kZXggPSBsaXN0O1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRjdXJyZW50TGlzdEluZGV4ID0gbGlzdHMuaW5kZXhPZihsaXN0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc29sZS53YXJuKCd1bmtub3duIGlucHV0IGZvciBsaXN0OiAnKyB0eXBlb2YgbGlzdCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Q3VycmVudExpc3QoKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBsaXN0c1tjdXJyZW50TGlzdEluZGV4XTtcblx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdGNvbnNvbGUud2FybignTGlzdCBub3QgZm91bmQuIEluZGV4OiAnK2N1cnJlbnRMaXN0SW5kZXgpO1xuXHRcdFx0Y29uc29sZS53YXJuKGxpc3RzKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5kaXJlY3RpdmUoJ2JrSXRlbScsIGJrSXRlbSk7XG5cbmZ1bmN0aW9uIGJrSXRlbSgpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdHRlbXBsYXRlVXJsOiAnLi90ZW1wbGF0ZXMvYmtJdGVtLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdJdGVtQ29udHJvbGxlcicsXG5cdFx0Y29udHJvbGxlckFzOiAnSXRlbSdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0Ly8gRW5kIGN1c3RvbSBlZGl0IG1vZGUgb24gY2xpY2tcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRkZXNlbGVjdCgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gRW50ZXIgYXNzaWduIG1vZGVcblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5hY3Rpb25zIGJ1dHRvbi5hc3NpZ24nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcyhcImVkaXRhYmxlIGVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdtZC1pbnB1dC1jb250YWluZXIuYXNzaWduIGlucHV0JykuZm9jdXMoKTtcblx0XHR9KTtcblxuXHRcdC8vIFRvZ2dsZSBpdGVtIGRvbmVuZXNzXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24uZG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50LnRvZ2dsZUNsYXNzKFwiZG9uZVwiKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlXCIpO1xuXHRcdFx0ZGVzZWxlY3QoKTtcblx0XHR9KTtcblxuXHRcdC8vIFByZXZlbnQgZW5kaW5nIGVkaXQgbW9kZSB3aGVuIHNlbGVjdGluZyBpbnB1dFxuXHRcdGVsZW1lbnQuZmluZCgnbWQtaW5wdXQtY29udGFpbmVyJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblx0XHQvLyBQcmV2ZW50IGVuZGluZyBlZGl0IG1vZGUgd2hlbiBjbGlja2luZyBidXR0b25cblx0XHRlbGVtZW50LmZpbmQoJ2J1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fSk7XG5cblx0XHQvLyBMZWF2ZSBjdXN0b20gZWRpdCBtb2RlXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3QoKSB7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKFwiZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0fVxuXHR9XG59XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5kaXJlY3RpdmUoJ2JrTGlzdEluZm8nLCBia0xpc3RJbmZvKTtcblxuZnVuY3Rpb24gYmtMaXN0SW5mbyhhbGxMaXN0c1NlcnZpY2UpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdHRlbXBsYXRlVXJsOiAnLi90ZW1wbGF0ZXMvYmtMaXN0SW5mby5odG1sJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkgeyBhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3Qoc2NvcGUubGlzdCkgfSk7XG5cdFx0fSk7XG5cdH1cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5kaXJlY3RpdmUoJ2JrTGlzdFZpZXcnLCBia0xpc3RWaWV3KTtcblxuZnVuY3Rpb24gYmtMaXN0VmlldygpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdGNvbnRyb2xsZXI6ICdJdGVtc0NvbnRyb2xsZXInLFxuXHRcdGNvbnRyb2xsZXJBczogJ0l0ZW1zJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblxuXHRcdHZhciBzdWJoZWFkZXIgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXInKTtcblx0XHR2YXIgdGl0bGVJbnB1dCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlciBpbnB1dCcpO1xuXG5cdFx0Ly8gQ2xpY2sgb3V0c2lkZSBvZiBpdGVtcyB0byBleGl0IGVkaXQgbW9kZVxuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZGVzZWxlY3RBbGwoKTtcblx0XHRcdGlmIChlLnRhcmdldCkge1xuXHRcdFx0XHR2YXIgYmtJdGVtID0gaXNCa0l0ZW1DaGlsZChlLnRhcmdldCk7XG5cdFx0XHRcdGlmIChia0l0ZW0pIHtcblx0XHRcdFx0XHRia0l0ZW0uY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gUHJldmVudCBsb3NpbmcgZm9jdXMgb24gYnV0dG9uIGNsaWNrc1xuXHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblxuXHRcdC8vIE1ha2UgdGl0bGUgZWRpdGFibGUgb24gY2xpY2tcblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgLm5hbWUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0bWFrZVRpdGxlRWRpdGFibGUoKTtcblx0XHR9KTtcblxuXHRcdC8vIEV4aXQgdGl0bGUgZWRpdCBtb2RlIG9uIHRpdGxlIGlucHV0IGxvc2luZyBmb2N1c1xuXHRcdHRpdGxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJykuY2xhc3NMaXN0LnJlbW92ZSgnZWRpdGFibGUnKTtcblx0XHR9KTtcblxuXHRcdC8vIFN3aXRjaCBmb2N1cyB0byBuZXcgaXRlbVxuXHRcdHNjb3BlLiR3YXRjaCgnSXRlbXMuZ2V0Q3VycmVudExpc3QoKS5pdGVtc1swXScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gb24gbmV3IGl0ZW0gYWRkZWRcblx0XHRcdHZhciBuZXdJdGVtID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdiay1pdGVtJyk7XG5cdFx0XHRpZiAobmV3SXRlbSkge1xuXHRcdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0XHRuZXdJdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlJyk7XG5cdFx0XHRcdG5ld0l0ZW0ucXVlcnlTZWxlY3RvcignLnRpdGxlIGlucHV0JykuZm9jdXMoKTsgLy8gZm9jdXMgdGl0bGUgZmllbGQgYnkgZGVmYXVsdFxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gbWFrZVRpdGxlRWRpdGFibGUoKSB7XG5cdFx0XHRzdWJoZWFkZXIuY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdHRpdGxlSW5wdXQuZm9jdXMoKTtcblx0XHR9XG5cdFx0c2NvcGUubWFrZVRpdGxlRWRpdGFibGUgPSBtYWtlVGl0bGVFZGl0YWJsZTtcblxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuXHRcdFx0ZWxlbWVudC5maW5kKCdiay1pdGVtJykucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBpc0JrSXRlbUNoaWxkKG5vZGUpIHtcblx0XHRcdHZhciBpc0NhcmRDb250ZW50ID0gZmFsc2U7XG5cdFx0XHR3aGlsZSAobm9kZSAmJiBub2RlICE9PSBlbGVtZW50WzBdKSB7XG5cdFx0XHRcdGlmIChub2RlLm5vZGVOYW1lID09PSAnTUQtQ0FSRC1DT05URU5UJykge1xuXHRcdFx0XHRcdGlzQ2FyZENvbnRlbnQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChpc0NhcmRDb250ZW50ICYmIG5vZGUubm9kZU5hbWUgPT09ICdCSy1JVEVNJykge1xuXHRcdFx0XHRcdHJldHVybiBub2RlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=