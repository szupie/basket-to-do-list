var app = angular.module('app', ['ngMaterial']);

angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController() {
	var vm = this;
}

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
		})

		// Make title editable on click
		element[0].querySelector('.md-subheader .name').addEventListener('click', function() {
			element[0].querySelector('.md-subheader').classList.add('editable');
			element[0].querySelector('.md-subheader input').focus();
		})

		// Exit title edit mode on title input losing focus
		element[0].querySelector('.md-subheader input').addEventListener('blur', function() {
			element[0].querySelector('.md-subheader').classList.remove('editable');
		})

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
		return this.items.map(function(item) { return item.title })
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0l0ZW1zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0xpc3RzQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvYmtJdGVtLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RJbmZvLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RWaWV3LmpzIiwic2VydmljZXMvSXRlbU9iamVjdC5qcyIsInNlcnZpY2VzL0xpc3RPYmplY3QuanMiLCJzZXJ2aWNlcy9hbGxMaXN0c1NlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxNQUFBLFFBQUEsT0FBQSxPQUFBLENBQUE7O0FDQUE7RUFDQSxPQUFBO0VBQ0EsV0FBQSxvQkFBQTs7QUFFQSxTQUFBLG1CQUFBO0NBQ0EsSUFBQSxLQUFBOzs7QUNMQTtFQUNBLE9BQUE7RUFDQSxXQUFBLGtCQUFBOztBQUVBLFNBQUEsaUJBQUE7Q0FDQSxJQUFBLEtBQUE7OztBQ0xBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxpQkFBQTtDQUNBLElBQUEsS0FBQTs7Q0FFQSxHQUFBLFVBQUE7Q0FDQSxHQUFBLGlCQUFBLGdCQUFBOztDQUVBLFNBQUEsVUFBQTtFQUNBLElBQUEsQ0FBQSxnQkFBQSxrQkFBQTtHQUNBLGdCQUFBLGVBQUEsZ0JBQUE7O0VBRUEsR0FBQSxpQkFBQTs7Ozs7QUNkQTtFQUNBLE9BQUE7RUFDQSxXQUFBLG1CQUFBOztBQUVBLFNBQUEsZ0JBQUEsaUJBQUE7O0NBRUEsS0FBQSxRQUFBLGdCQUFBOztDQUVBLEtBQUEsVUFBQSxXQUFBO0VBQ0EsZ0JBQUEsZUFBQSxnQkFBQTs7O0NBR0EsS0FBQSxjQUFBLGdCQUFBOzs7O0FDWkE7RUFDQSxPQUFBO0VBQ0EsVUFBQSxVQUFBOztBQUVBLFNBQUEsU0FBQTtDQUNBLElBQUEsWUFBQTtFQUNBLFVBQUE7RUFDQSxNQUFBO0VBQ0EsYUFBQTtFQUNBLFlBQUE7RUFDQSxjQUFBOzs7Q0FHQSxPQUFBOztDQUVBLFNBQUEsS0FBQSxPQUFBLFNBQUEsT0FBQTs7RUFFQSxRQUFBLEdBQUEsU0FBQSxVQUFBLEdBQUE7R0FDQTs7OztFQUlBLFFBQUEsR0FBQSxjQUFBLDBCQUFBLGlCQUFBLFNBQUEsV0FBQTtHQUNBLFFBQUEsU0FBQTtHQUNBLFFBQUEsR0FBQSxjQUFBLG1DQUFBOzs7O0VBSUEsUUFBQSxHQUFBLGNBQUEsZUFBQSxpQkFBQSxTQUFBLFdBQUE7R0FDQSxRQUFBLFlBQUEsUUFBQSxZQUFBO0dBQ0E7Ozs7RUFJQSxRQUFBLEtBQUEsc0JBQUEsR0FBQSxTQUFBLFNBQUEsR0FBQTtHQUNBLEVBQUE7OztFQUdBLFFBQUEsS0FBQSxVQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQSxFQUFBOzs7O0VBSUEsU0FBQSxXQUFBO0dBQ0EsUUFBQSxZQUFBOzs7OztBQzVDQTtFQUNBLE9BQUE7RUFDQSxVQUFBLGNBQUE7O0FBRUEsU0FBQSxXQUFBLGlCQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxhQUFBOzs7Q0FHQSxPQUFBOztDQUVBLFNBQUEsS0FBQSxPQUFBLFNBQUEsT0FBQTtFQUNBLFFBQUEsR0FBQSxTQUFBLFdBQUE7R0FDQSxNQUFBLE9BQUEsV0FBQSxFQUFBLGdCQUFBLGVBQUEsTUFBQTs7Ozs7QUNmQTtFQUNBLE9BQUE7RUFDQSxVQUFBLGNBQUE7O0FBRUEsU0FBQSxhQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxZQUFBO0VBQ0EsY0FBQTs7O0NBR0EsT0FBQTs7Q0FFQSxTQUFBLEtBQUEsT0FBQSxTQUFBLE9BQUE7OztFQUdBLFFBQUEsR0FBQSxTQUFBLFNBQUEsR0FBQTtHQUNBO0dBQ0EsSUFBQSxFQUFBLFFBQUE7SUFDQSxJQUFBLFNBQUEsY0FBQSxFQUFBO0lBQ0EsSUFBQSxRQUFBO0tBQ0EsT0FBQSxVQUFBLElBQUE7Ozs7OztFQU1BLFFBQUEsS0FBQSxVQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQSxFQUFBOzs7O0VBSUEsUUFBQSxHQUFBLGNBQUEsdUJBQUEsaUJBQUEsU0FBQSxXQUFBO0dBQ0EsUUFBQSxHQUFBLGNBQUEsaUJBQUEsVUFBQSxJQUFBO0dBQ0EsUUFBQSxHQUFBLGNBQUEsdUJBQUE7Ozs7RUFJQSxRQUFBLEdBQUEsY0FBQSx1QkFBQSxpQkFBQSxRQUFBLFdBQUE7R0FDQSxRQUFBLEdBQUEsY0FBQSxpQkFBQSxVQUFBLE9BQUE7Ozs7RUFJQSxNQUFBLE9BQUEsbUNBQUEsV0FBQTs7R0FFQSxJQUFBLFVBQUEsUUFBQSxHQUFBLGNBQUE7R0FDQSxJQUFBLFNBQUE7SUFDQTtJQUNBLFFBQUEsVUFBQSxJQUFBO0lBQ0EsUUFBQSxjQUFBLGdCQUFBOzs7O0VBSUEsU0FBQSxjQUFBO0dBQ0EsUUFBQSxLQUFBLFdBQUEsWUFBQTs7O0VBR0EsU0FBQSxjQUFBLE1BQUE7R0FDQSxJQUFBLGdCQUFBO0dBQ0EsT0FBQSxRQUFBLFNBQUEsUUFBQSxJQUFBO0lBQ0EsSUFBQSxLQUFBLGFBQUEsbUJBQUE7S0FDQSxnQkFBQTs7SUFFQSxJQUFBLGlCQUFBLEtBQUEsYUFBQSxXQUFBO0tBQ0EsT0FBQTs7SUFFQSxPQUFBLEtBQUE7O0dBRUEsT0FBQTs7Ozs7QUNyRUE7RUFDQSxPQUFBO0VBQ0EsUUFBQSxjQUFBOztBQUVBLFNBQUEsYUFBQTs7Q0FFQSxJQUFBLGFBQUEsV0FBQTtFQUNBLEtBQUEsUUFBQTtFQUNBLEtBQUEsT0FBQTtFQUNBLEtBQUEsU0FBQTtFQUNBLEtBQUEsT0FBQTs7O0NBR0EsT0FBQTs7O0FDYkE7RUFDQSxPQUFBO0VBQ0EsUUFBQSxjQUFBOztBQUVBLFNBQUEsV0FBQSxZQUFBOztDQUVBLElBQUEsYUFBQSxTQUFBLElBQUEsTUFBQTtFQUNBLEtBQUEsS0FBQTtFQUNBLEtBQUEsT0FBQTtFQUNBLEtBQUEsUUFBQTtFQUNBLEtBQUEsVUFBQTtFQUNBLEtBQUEsaUJBQUE7OztDQUdBLFNBQUEsVUFBQTtFQUNBLEtBQUEsTUFBQSxRQUFBLElBQUE7OztDQUdBLFNBQUEsaUJBQUE7RUFDQSxPQUFBLEtBQUEsTUFBQSxJQUFBLFNBQUEsTUFBQSxFQUFBLE9BQUEsS0FBQTtPQUNBLE9BQUEsU0FBQSxLQUFBLEVBQUEsT0FBQTtPQUNBLEtBQUE7OztDQUdBLE9BQUE7Ozs7QUN4QkE7RUFDQSxPQUFBO0VBQ0EsUUFBQSxtQkFBQTs7QUFFQSxTQUFBLGdCQUFBLFlBQUE7O0NBRUEsSUFBQSxRQUFBO0NBQ0EsSUFBQSxtQkFBQTs7Q0FFQSxPQUFBO0VBQ0EsS0FBQTtFQUNBLE9BQUE7RUFDQSxrQkFBQTtFQUNBLGdCQUFBO0VBQ0EsZ0JBQUE7OztDQUdBLFNBQUEsTUFBQTtFQUNBLE1BQUE7R0FDQSxJQUFBLFdBQUEsYUFBQSxhQUFBLE1BQUEsT0FBQTs7RUFFQSxPQUFBLE1BQUE7OztDQUdBLFNBQUEsWUFBQTtFQUNBLElBQUEsU0FBQTtFQUNBLE9BQUEsQ0FBQSxLQUFBLE1BQUEsS0FBQSxTQUFBLEtBQUEsSUFBQSxHQUFBLFNBQUEsU0FBQSxLQUFBLE1BQUEsQ0FBQTs7O0NBR0EsU0FBQSxhQUFBLElBQUE7RUFDQSxLQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsTUFBQSxRQUFBLEtBQUE7R0FDQSxJQUFBLE1BQUEsT0FBQSxJQUFBO0lBQ0EsT0FBQTs7Ozs7Q0FLQSxTQUFBLGVBQUEsTUFBQTtFQUNBLElBQUEsT0FBQSxTQUFBLFVBQUE7R0FDQSxtQkFBQTtTQUNBLElBQUEsT0FBQSxTQUFBLFVBQUE7R0FDQSxtQkFBQSxNQUFBLFFBQUE7U0FDQTtHQUNBLFFBQUEsS0FBQSw0QkFBQSxPQUFBO0dBQ0EsUUFBQSxLQUFBOzs7O0NBSUEsU0FBQSxpQkFBQTtFQUNBLElBQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxNQUFBLEdBQUE7R0FDQSxRQUFBLEtBQUEsMEJBQUE7R0FDQSxRQUFBLEtBQUE7R0FDQSxPQUFBOzs7O3lDQUdBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyduZ01hdGVyaWFsJ10pO1xuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignQmFza2V0Q29udHJvbGxlcicsIEJhc2tldENvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBCYXNrZXRDb250cm9sbGVyKCkge1xuXHR2YXIgdm0gPSB0aGlzO1xufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignSXRlbUNvbnRyb2xsZXInLCBJdGVtQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1Db250cm9sbGVyKCkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignSXRlbXNDb250cm9sbGVyJywgSXRlbXNDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gSXRlbXNDb250cm9sbGVyKGFsbExpc3RzU2VydmljZSkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXG5cdHZtLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHR2bS5nZXRDdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblxuXHRmdW5jdGlvbiBhZGRJdGVtKCkge1xuXHRcdGlmICghYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0KCkpIHtcblx0XHRcdGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChhbGxMaXN0c1NlcnZpY2UuYWRkKCkpO1xuXHRcdH1cblx0XHR2bS5nZXRDdXJyZW50TGlzdCgpLmFkZEl0ZW0oKTtcblx0fVxuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignTGlzdHNDb250cm9sbGVyJywgTGlzdHNDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gTGlzdHNDb250cm9sbGVyKGFsbExpc3RzU2VydmljZSkge1xuXHRcblx0dGhpcy5saXN0cyA9IGFsbExpc3RzU2VydmljZS5saXN0cztcblxuXHR0aGlzLmFkZExpc3QgPSBmdW5jdGlvbigpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0fTtcblxuXHR0aGlzLmN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0l0ZW0nLCBia0l0ZW0pO1xuXG5mdW5jdGlvbiBia0l0ZW0oKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrSXRlbS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnSXRlbUNvbnRyb2xsZXInLFxuXHRcdGNvbnRyb2xsZXJBczogJ0l0ZW0nXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdC8vIEVuZCBjdXN0b20gZWRpdCBtb2RlIG9uIGNsaWNrXG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0ZGVzZWxlY3QoKTtcblx0XHR9KTtcblxuXHRcdC8vIEVudGVyIGFzc2lnbiBtb2RlXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcuYWN0aW9ucyBidXR0b24uYXNzaWduJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignbWQtaW5wdXQtY29udGFpbmVyLmFzc2lnbiBpbnB1dCcpLmZvY3VzKCk7XG5cdFx0fSk7XG5cblx0XHQvLyBUb2dnbGUgaXRlbSBkb25lbmVzc1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmRvbmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWxlbWVudC50b2dnbGVDbGFzcyhcImRvbmVcIikucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZVwiKTtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cblx0XHQvLyBQcmV2ZW50IGVuZGluZyBlZGl0IG1vZGUgd2hlbiBzZWxlY3RpbmcgaW5wdXRcblx0XHRlbGVtZW50LmZpbmQoJ21kLWlucHV0LWNvbnRhaW5lcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fSk7XG5cdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gY2xpY2tpbmcgYnV0dG9uXG5cdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gTGVhdmUgY3VzdG9tIGVkaXQgbW9kZVxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0KCkge1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVDbGFzcyhcImVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RJbmZvJywgYmtMaXN0SW5mbyk7XG5cbmZ1bmN0aW9uIGJrTGlzdEluZm8oYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrTGlzdEluZm8uaHRtbCdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHsgYWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KHNjb3BlLmxpc3QpIH0pO1xuXHRcdH0pO1xuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RWaWV3JywgYmtMaXN0Vmlldyk7XG5cbmZ1bmN0aW9uIGJrTGlzdFZpZXcoKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cblx0XHQvLyBDbGljayBvdXRzaWRlIG9mIGl0ZW1zIHRvIGV4aXQgZWRpdCBtb2RlXG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0aWYgKGUudGFyZ2V0KSB7XG5cdFx0XHRcdHZhciBia0l0ZW0gPSBpc0JrSXRlbUNoaWxkKGUudGFyZ2V0KTtcblx0XHRcdFx0aWYgKGJrSXRlbSkge1xuXHRcdFx0XHRcdGJrSXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBQcmV2ZW50IGxvc2luZyBmb2N1cyBvbiBidXR0b24gY2xpY2tzXG5cdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pXG5cblx0XHQvLyBNYWtlIHRpdGxlIGVkaXRhYmxlIG9uIGNsaWNrXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyIC5uYW1lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlcicpLmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlJyk7XG5cdFx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgaW5wdXQnKS5mb2N1cygpO1xuXHRcdH0pXG5cblx0XHQvLyBFeGl0IHRpdGxlIGVkaXQgbW9kZSBvbiB0aXRsZSBpbnB1dCBsb3NpbmcgZm9jdXNcblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgaW5wdXQnKS5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXInKS5jbGFzc0xpc3QucmVtb3ZlKCdlZGl0YWJsZScpO1xuXHRcdH0pXG5cblx0XHQvLyBTd2l0Y2ggZm9jdXMgdG8gbmV3IGl0ZW1cblx0XHRzY29wZS4kd2F0Y2goJ0l0ZW1zLmdldEN1cnJlbnRMaXN0KCkuaXRlbXNbMF0nLCBmdW5jdGlvbigpIHtcblx0XHRcdC8vIG9uIG5ldyBpdGVtIGFkZGVkXG5cdFx0XHR2YXIgbmV3SXRlbSA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYmstaXRlbScpO1xuXHRcdFx0aWYgKG5ld0l0ZW0pIHtcblx0XHRcdFx0ZGVzZWxlY3RBbGwoKTtcblx0XHRcdFx0bmV3SXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0XHRuZXdJdGVtLnF1ZXJ5U2VsZWN0b3IoJy50aXRsZSBpbnB1dCcpLmZvY3VzKCk7IC8vIGZvY3VzIHRpdGxlIGZpZWxkIGJ5IGRlZmF1bHRcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuXHRcdFx0ZWxlbWVudC5maW5kKCdiay1pdGVtJykucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBpc0JrSXRlbUNoaWxkKG5vZGUpIHtcblx0XHRcdHZhciBpc0NhcmRDb250ZW50ID0gZmFsc2U7XG5cdFx0XHR3aGlsZSAobm9kZSAmJiBub2RlICE9PSBlbGVtZW50WzBdKSB7XG5cdFx0XHRcdGlmIChub2RlLm5vZGVOYW1lID09PSAnTUQtQ0FSRC1DT05URU5UJykge1xuXHRcdFx0XHRcdGlzQ2FyZENvbnRlbnQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChpc0NhcmRDb250ZW50ICYmIG5vZGUubm9kZU5hbWUgPT09ICdCSy1JVEVNJykge1xuXHRcdFx0XHRcdHJldHVybiBub2RlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG59XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdJdGVtT2JqZWN0JywgSXRlbU9iamVjdCk7XG5cbmZ1bmN0aW9uIEl0ZW1PYmplY3QoKSB7XG5cblx0dmFyIGl0ZW1PYmplY3QgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRpdGxlID0gJyc7XG5cdFx0dGhpcy5ub3RlID0gJyc7XG5cdFx0dGhpcy5hc3NpZ24gPSAnJztcblx0XHR0aGlzLmRvbmUgPSBmYWxzZTtcblx0fVxuXG5cdHJldHVybiBpdGVtT2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnTGlzdE9iamVjdCcsIExpc3RPYmplY3QpO1xuXG5mdW5jdGlvbiBMaXN0T2JqZWN0KEl0ZW1PYmplY3QpIHtcblxuXHR2YXIgbGlzdE9iamVjdCA9IGZ1bmN0aW9uKGlkLCBuYW1lKSB7XG5cdFx0dGhpcy5pZCA9IGlkO1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0dGhpcy5pdGVtcyA9IFtdO1xuXHRcdHRoaXMuYWRkSXRlbSA9IGFkZEl0ZW07XG5cdFx0dGhpcy5nZXREZXNjcmlwdGlvbiA9IGdldERlc2NyaXB0aW9uO1xuXHR9XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHR0aGlzLml0ZW1zLnVuc2hpZnQobmV3IEl0ZW1PYmplY3QoKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXREZXNjcmlwdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5pdGVtcy5tYXAoZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS50aXRsZSB9KVxuXHRcdFx0XHRcdFx0LmZpbHRlcihmdW5jdGlvbih2YWwpIHsgcmV0dXJuIHZhbDsgfSkvLyBnZXQgbm9uLWVtcHR5IGl0ZW1zXG5cdFx0XHRcdFx0XHQuam9pbignLCAnKTtcblx0fVxuXG5cdHJldHVybiBsaXN0T2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnYWxsTGlzdHNTZXJ2aWNlJywgYWxsTGlzdHNTZXJ2aWNlKTtcblxuZnVuY3Rpb24gYWxsTGlzdHNTZXJ2aWNlKExpc3RPYmplY3QpIHtcblxuXHR2YXIgbGlzdHMgPSBbXTtcblx0dmFyIGN1cnJlbnRMaXN0SW5kZXggPSB1bmRlZmluZWQ7XG5cblx0cmV0dXJuIHtcblx0XHRhZGQ6IGFkZCxcblx0XHRsaXN0czogbGlzdHMsXG5cdFx0Y3VycmVudExpc3RJbmRleDogY3VycmVudExpc3RJbmRleCxcblx0XHRzZXRDdXJyZW50TGlzdDogc2V0Q3VycmVudExpc3QsXG5cdFx0Z2V0Q3VycmVudExpc3Q6IGdldEN1cnJlbnRMaXN0XG5cdH07XG5cblx0ZnVuY3Rpb24gYWRkKCkge1xuXHRcdGxpc3RzLnVuc2hpZnQoXG5cdFx0XHRuZXcgTGlzdE9iamVjdChnZXRVbmlxSWQoKSwgXCJOZXcgTGlzdCBcIisobGlzdHMubGVuZ3RoKzEpKVxuXHRcdCk7XG5cdFx0cmV0dXJuIGxpc3RzWzBdO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0VW5pcUlkKCkge1xuXHRcdHZhciBsZW5ndGggPSA4O1xuXHRcdHJldHVybiAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKk1hdGgucG93KDM2LGxlbmd0aCkpLnRvU3RyaW5nKDM2KSkuc2xpY2UoLWxlbmd0aCk7XG5cdH1cblxuXHRmdW5jdGlvbiBmaW5kTGlzdEJ5SWQoaWQpIHtcblx0XHRmb3IgKHZhciBpPTA7IGk8bGlzdHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChsaXN0cy5pZCA9PT0gaWQpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gc2V0Q3VycmVudExpc3QobGlzdCkge1xuXHRcdGlmICh0eXBlb2YgbGlzdCA9PT0gJ251bWJlcicpIHtcblx0XHRcdGN1cnJlbnRMaXN0SW5kZXggPSBsaXN0O1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRjdXJyZW50TGlzdEluZGV4ID0gbGlzdHMuaW5kZXhPZihsaXN0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc29sZS53YXJuKCd1bmtub3duIGlucHV0IGZvciBsaXN0OiAnKyB0eXBlb2YgbGlzdCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Q3VycmVudExpc3QoKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBsaXN0c1tjdXJyZW50TGlzdEluZGV4XTtcblx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdGNvbnNvbGUud2FybignTGlzdCBub3QgZm91bmQuIEluZGV4OiAnK2N1cnJlbnRMaXN0SW5kZXgpO1xuXHRcdFx0Y29uc29sZS53YXJuKGxpc3RzKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=