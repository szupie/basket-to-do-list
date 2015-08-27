var app = angular.module('app', ['ngMaterial']);

angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($mdSidenav, $mdMedia, $scope) {
	var vm = this;
	vm.toggleListsView = toggleListsView;
	vm.closeListsView = closeListsView;

	vm.$mdMedia = $mdMedia;

	function toggleListsView() {
		$mdSidenav('left').toggle();
	}

	function closeListsView() {
		$mdSidenav('left').close();
	}
}
BasketController.$inject = ["$mdSidenav", "$mdMedia", "$scope"];

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
		var assignInput = element[0].querySelector('md-input-container.assign input');

		// Enter assign mode
		function enterAssignMode() {
			element.addClass("editable editing assign");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0l0ZW1zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0xpc3RzQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvYmtJdGVtLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RJbmZvLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RWaWV3LmpzIiwic2VydmljZXMvSXRlbU9iamVjdC5qcyIsInNlcnZpY2VzL0xpc3RPYmplY3QuanMiLCJzZXJ2aWNlcy9hbGxMaXN0c1NlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxNQUFBLFFBQUEsT0FBQSxPQUFBLENBQUE7O0FDQUE7RUFDQSxPQUFBO0VBQ0EsV0FBQSxvQkFBQTs7QUFFQSxTQUFBLGlCQUFBLFlBQUEsVUFBQSxRQUFBO0NBQ0EsSUFBQSxLQUFBO0NBQ0EsR0FBQSxrQkFBQTtDQUNBLEdBQUEsaUJBQUE7O0NBRUEsR0FBQSxXQUFBOztDQUVBLFNBQUEsa0JBQUE7RUFDQSxXQUFBLFFBQUE7OztDQUdBLFNBQUEsaUJBQUE7RUFDQSxXQUFBLFFBQUE7Ozs7O0FDaEJBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsa0JBQUE7O0FBRUEsU0FBQSxpQkFBQTtDQUNBLElBQUEsS0FBQTtDQUNBLEdBQUEsWUFBQTs7O0FDTkE7RUFDQSxPQUFBO0VBQ0EsV0FBQSxtQkFBQTs7QUFFQSxTQUFBLGdCQUFBLGlCQUFBO0NBQ0EsSUFBQSxLQUFBOztDQUVBLEdBQUEsVUFBQTtDQUNBLEdBQUEsaUJBQUEsZ0JBQUE7O0NBRUEsU0FBQSxVQUFBO0VBQ0EsSUFBQSxDQUFBLGdCQUFBLGtCQUFBO0dBQ0EsZ0JBQUEsZUFBQSxnQkFBQTs7RUFFQSxHQUFBLGlCQUFBOzs7OztBQ2RBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxpQkFBQTs7Q0FFQSxLQUFBLFFBQUEsZ0JBQUE7O0NBRUEsS0FBQSxVQUFBLFdBQUE7RUFDQSxnQkFBQSxlQUFBLGdCQUFBOzs7Q0FHQSxLQUFBLGNBQUEsZ0JBQUE7Ozs7QUNaQTtFQUNBLE9BQUE7RUFDQSxVQUFBLFVBQUE7O0FBRUEsU0FBQSxTQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxhQUFBO0VBQ0EsWUFBQTtFQUNBLGNBQUE7OztDQUdBLE9BQUE7O0NBRUEsU0FBQSxLQUFBLE9BQUEsU0FBQSxPQUFBOztFQUVBLFFBQUEsR0FBQSxTQUFBLFVBQUEsR0FBQTtHQUNBOzs7RUFHQSxJQUFBLFdBQUEsU0FBQSxjQUFBO0VBQ0EsSUFBQSxjQUFBLFFBQUEsR0FBQSxjQUFBOzs7RUFHQSxTQUFBLGtCQUFBO0dBQ0EsUUFBQSxTQUFBO0dBQ0EsV0FBQSxXQUFBLEVBQUEsWUFBQSxZQUFBO0dBQ0EsU0FBQSxVQUFBLElBQUE7Ozs7RUFJQSxJQUFBLGVBQUE7RUFDQSxNQUFBLE9BQUEsV0FBQSxFQUFBLE9BQUEsTUFBQSxLQUFBLFNBQUEsVUFBQSxXQUFBO0dBQ0EsSUFBQSxjQUFBO0lBQ0EsYUFBQSxvQkFBQSxTQUFBOztHQUVBLGVBQUE7R0FDQSxJQUFBLGNBQUE7SUFDQSxhQUFBLGlCQUFBLFNBQUE7OztHQUdBLFFBQUEsS0FBQSxVQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7SUFDQSxFQUFBOzs7OztFQUtBLFFBQUEsR0FBQSxjQUFBLGVBQUEsaUJBQUEsU0FBQSxXQUFBO0dBQ0EsUUFBQSxZQUFBLFFBQUEsWUFBQTtHQUNBLFNBQUEsVUFBQSxPQUFBO0dBQ0E7Ozs7RUFJQSxRQUFBLEtBQUEsc0JBQUEsR0FBQSxTQUFBLFNBQUEsR0FBQTtHQUNBLEVBQUE7Ozs7RUFJQSxTQUFBLFdBQUE7R0FDQSxRQUFBLFlBQUE7OztFQUdBLFNBQUEsa0JBQUE7R0FDQSxPQUFBLFFBQUEsR0FBQSxjQUFBOzs7OztBQ2pFQTtFQUNBLE9BQUE7RUFDQSxVQUFBLGNBQUE7O0FBRUEsU0FBQSxXQUFBLGlCQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxhQUFBOzs7Q0FHQSxPQUFBOztDQUVBLFNBQUEsS0FBQSxPQUFBLFNBQUEsT0FBQTtFQUNBLFFBQUEsR0FBQSxTQUFBLFdBQUE7R0FDQSxNQUFBLE9BQUEsV0FBQSxFQUFBLGdCQUFBLGVBQUEsTUFBQTs7Ozs7QUNmQTtFQUNBLE9BQUE7RUFDQSxVQUFBLGNBQUE7O0FBRUEsU0FBQSxhQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxZQUFBO0VBQ0EsY0FBQTs7O0NBR0EsT0FBQTs7Q0FFQSxTQUFBLEtBQUEsT0FBQSxTQUFBLE9BQUE7O0VBRUEsSUFBQSxZQUFBLFFBQUEsR0FBQSxjQUFBO0VBQ0EsSUFBQSxhQUFBLFFBQUEsR0FBQSxjQUFBOzs7RUFHQSxRQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQTtHQUNBLElBQUEsRUFBQSxRQUFBO0lBQ0EsSUFBQSxTQUFBLGNBQUEsRUFBQTtJQUNBLElBQUEsUUFBQTtLQUNBLGlCQUFBOzs7Ozs7RUFNQSxRQUFBLEtBQUEsVUFBQSxHQUFBLFNBQUEsU0FBQSxHQUFBO0dBQ0EsRUFBQTs7OztFQUlBLFFBQUEsR0FBQSxjQUFBLHVCQUFBLGlCQUFBLFNBQUEsV0FBQTtHQUNBOzs7O0VBSUEsV0FBQSxpQkFBQSxRQUFBLFdBQUE7R0FDQSxRQUFBLEdBQUEsY0FBQSxpQkFBQSxVQUFBLE9BQUE7Ozs7RUFJQSxNQUFBLE9BQUEsbUNBQUEsV0FBQTs7R0FFQSxJQUFBLFVBQUEsUUFBQSxHQUFBLGNBQUE7R0FDQSxJQUFBLFNBQUE7SUFDQTtJQUNBLGlCQUFBOztJQUVBLFdBQUEsV0FBQSxFQUFBLFFBQUEsY0FBQSxnQkFBQSxZQUFBOzs7O0VBSUEsU0FBQSxvQkFBQTtHQUNBLFVBQUEsVUFBQSxJQUFBO0dBQ0EsV0FBQTs7RUFFQSxNQUFBLG9CQUFBOztFQUVBLFNBQUEsY0FBQTtHQUNBLFFBQUEsS0FBQSxXQUFBLFlBQUE7R0FDQSxRQUFBLFlBQUE7OztFQUdBLFNBQUEsaUJBQUEsTUFBQTtHQUNBLEtBQUEsVUFBQSxJQUFBO0dBQ0EsUUFBQSxTQUFBOzs7RUFHQSxTQUFBLGNBQUEsTUFBQTtHQUNBLElBQUEsZ0JBQUE7R0FDQSxPQUFBLFFBQUEsU0FBQSxRQUFBLElBQUE7SUFDQSxJQUFBLEtBQUEsYUFBQSxtQkFBQTtLQUNBLGdCQUFBOztJQUVBLElBQUEsaUJBQUEsS0FBQSxhQUFBLFdBQUE7S0FDQSxPQUFBOztJQUVBLE9BQUEsS0FBQTs7R0FFQSxPQUFBOzs7OztBQ3BGQTtFQUNBLE9BQUE7RUFDQSxRQUFBLGNBQUE7O0FBRUEsU0FBQSxhQUFBOztDQUVBLElBQUEsYUFBQSxXQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsS0FBQSxPQUFBO0VBQ0EsS0FBQSxTQUFBO0VBQ0EsS0FBQSxPQUFBOzs7Q0FHQSxPQUFBOzs7QUNiQTtFQUNBLE9BQUE7RUFDQSxRQUFBLGNBQUE7O0FBRUEsU0FBQSxXQUFBLFlBQUE7O0NBRUEsSUFBQSxhQUFBLFNBQUEsSUFBQSxNQUFBO0VBQ0EsS0FBQSxLQUFBO0VBQ0EsS0FBQSxPQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsS0FBQSxVQUFBO0VBQ0EsS0FBQSxpQkFBQTs7O0NBR0EsU0FBQSxVQUFBO0VBQ0EsS0FBQSxNQUFBLFFBQUEsSUFBQTs7O0NBR0EsU0FBQSxpQkFBQTtFQUNBLE9BQUEsS0FBQSxNQUFBLElBQUEsU0FBQSxNQUFBLEVBQUEsSUFBQSxDQUFBLEtBQUEsTUFBQSxPQUFBLEtBQUE7T0FDQSxPQUFBLFNBQUEsS0FBQSxFQUFBLE9BQUE7T0FDQSxLQUFBOzs7Q0FHQSxPQUFBOzs7O0FDeEJBO0VBQ0EsT0FBQTtFQUNBLFFBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxZQUFBOztDQUVBLElBQUEsUUFBQTtDQUNBLElBQUEsbUJBQUE7O0NBRUEsT0FBQTtFQUNBLEtBQUE7RUFDQSxPQUFBO0VBQ0Esa0JBQUE7RUFDQSxnQkFBQTtFQUNBLGdCQUFBOzs7Q0FHQSxTQUFBLE1BQUE7RUFDQSxNQUFBO0dBQ0EsSUFBQSxXQUFBLGFBQUEsYUFBQSxNQUFBLE9BQUE7O0VBRUEsT0FBQSxNQUFBOzs7Q0FHQSxTQUFBLFlBQUE7RUFDQSxJQUFBLFNBQUE7RUFDQSxPQUFBLENBQUEsS0FBQSxNQUFBLEtBQUEsU0FBQSxLQUFBLElBQUEsR0FBQSxTQUFBLFNBQUEsS0FBQSxNQUFBLENBQUE7OztDQUdBLFNBQUEsYUFBQSxJQUFBO0VBQ0EsS0FBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsUUFBQSxLQUFBO0dBQ0EsSUFBQSxNQUFBLE9BQUEsSUFBQTtJQUNBLE9BQUE7Ozs7O0NBS0EsU0FBQSxlQUFBLE1BQUE7RUFDQSxJQUFBLE9BQUEsU0FBQSxVQUFBO0dBQ0EsbUJBQUE7U0FDQSxJQUFBLE9BQUEsU0FBQSxVQUFBO0dBQ0EsbUJBQUEsTUFBQSxRQUFBO1NBQ0E7R0FDQSxRQUFBLEtBQUEsNEJBQUEsT0FBQTtHQUNBLFFBQUEsS0FBQTs7OztDQUlBLFNBQUEsaUJBQUE7RUFDQSxJQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsTUFBQSxHQUFBO0dBQ0EsUUFBQSxLQUFBLDBCQUFBO0dBQ0EsUUFBQSxLQUFBO0dBQ0EsT0FBQTs7Ozt5Q0FHQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFsnbmdNYXRlcmlhbCddKTtcbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0Jhc2tldENvbnRyb2xsZXInLCBCYXNrZXRDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gQmFza2V0Q29udHJvbGxlcigkbWRTaWRlbmF2LCAkbWRNZWRpYSwgJHNjb3BlKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cdHZtLnRvZ2dsZUxpc3RzVmlldyA9IHRvZ2dsZUxpc3RzVmlldztcblx0dm0uY2xvc2VMaXN0c1ZpZXcgPSBjbG9zZUxpc3RzVmlldztcblxuXHR2bS4kbWRNZWRpYSA9ICRtZE1lZGlhO1xuXG5cdGZ1bmN0aW9uIHRvZ2dsZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykudG9nZ2xlKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBjbG9zZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykuY2xvc2UoKTtcblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignSXRlbUNvbnRyb2xsZXInLCBJdGVtQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1Db250cm9sbGVyKCkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXHR2bS5mYWJJc09wZW4gPSBmYWxzZTtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1zQ29udHJvbGxlcicsIEl0ZW1zQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1zQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblx0dmFyIHZtID0gdGhpcztcblxuXHR2bS5hZGRJdGVtID0gYWRkSXRlbTtcblx0dm0uZ2V0Q3VycmVudExpc3QgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3Q7XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHRpZiAoIWFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpKSB7XG5cdFx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0XHR9XG5cdFx0dm0uZ2V0Q3VycmVudExpc3QoKS5hZGRJdGVtKCk7XG5cdH1cblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0xpc3RzQ29udHJvbGxlcicsIExpc3RzQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIExpc3RzQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblx0XG5cdHRoaXMubGlzdHMgPSBhbGxMaXN0c1NlcnZpY2UubGlzdHM7XG5cblx0dGhpcy5hZGRMaXN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdH07XG5cblx0dGhpcy5jdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtJdGVtJywgYmtJdGVtKTtcblxuZnVuY3Rpb24gYmtJdGVtKCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0dGVtcGxhdGVVcmw6ICcuL3RlbXBsYXRlcy9ia0l0ZW0uaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ0l0ZW1Db250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHQvLyBFbmQgY3VzdG9tIGVkaXQgbW9kZSBvbiBjbGlja1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cblx0XHR2YXIgbGlzdFZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbYmstbGlzdC12aWV3XScpO1xuXHRcdHZhciBhc3NpZ25JbnB1dCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignbWQtaW5wdXQtY29udGFpbmVyLmFzc2lnbiBpbnB1dCcpO1xuXG5cdFx0Ly8gRW50ZXIgYXNzaWduIG1vZGVcblx0XHRmdW5jdGlvbiBlbnRlckFzc2lnbk1vZGUoKSB7XG5cdFx0XHRlbGVtZW50LmFkZENsYXNzKFwiZWRpdGFibGUgZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBhc3NpZ25JbnB1dC5mb2N1cygpOyB9LCAxMDApOyAvLyBkZWxheSB0byB3YWl0IGZvciBjbGFzc2VzIHRvIGFwcGx5XG5cdFx0XHRsaXN0Vmlldy5jbGFzc0xpc3QuYWRkKFwiaGFzRWRpdGFibGVJdGVtXCIpO1xuXHRcdH1cblx0XHRcblx0XHQvLyBSZWF0dGFjaCBsaXN0ZW5lciB0byBidXR0b25zIG9uIHNjcmVlbiBzaXplIGNoYW5nZVxuXHRcdHZhciBhc3NpZ25CdXR0b24gPSBnZXRBc3NpZ25CdXR0b24oKTtcblx0XHRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBzY29wZS5NYWluLiRtZE1lZGlhKCdtZCcpOyB9LCBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChhc3NpZ25CdXR0b24pIHtcblx0XHRcdFx0YXNzaWduQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJBc3NpZ25Nb2RlKTtcblx0XHRcdH1cblx0XHRcdGFzc2lnbkJ1dHRvbiA9IGdldEFzc2lnbkJ1dHRvbigpO1xuXHRcdFx0aWYgKGFzc2lnbkJ1dHRvbikge1xuXHRcdFx0XHRhc3NpZ25CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlbnRlckFzc2lnbk1vZGUpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gY2xpY2tpbmcgYnV0dG9uXG5cdFx0XHRlbGVtZW50LmZpbmQoJ2J1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Ly8gVG9nZ2xlIGl0ZW0gZG9uZW5lc3Ncblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5kb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnQudG9nZ2xlQ2xhc3MoXCJkb25lXCIpLnJlbW92ZUNsYXNzKFwiZWRpdGFibGVcIik7XG5cdFx0XHRsaXN0Vmlldy5jbGFzc0xpc3QucmVtb3ZlKFwiaGFzRWRpdGFibGVJdGVtXCIpO1xuXHRcdFx0ZGVzZWxlY3QoKTtcblx0XHR9KTtcblxuXHRcdC8vIFByZXZlbnQgZW5kaW5nIGVkaXQgbW9kZSB3aGVuIHNlbGVjdGluZyBpbnB1dFxuXHRcdGVsZW1lbnQuZmluZCgnbWQtaW5wdXQtY29udGFpbmVyJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblxuXHRcdC8vIExlYXZlIGN1c3RvbSBlZGl0IG1vZGVcblx0XHRmdW5jdGlvbiBkZXNlbGVjdCgpIHtcblx0XHRcdGVsZW1lbnQucmVtb3ZlQ2xhc3MoXCJlZGl0aW5nIGFzc2lnblwiKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBnZXRBc3NpZ25CdXR0b24oKSB7XG5cdFx0XHRyZXR1cm4gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24uYXNzaWduJyk7XG5cdFx0fVxuXHR9XG59XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5kaXJlY3RpdmUoJ2JrTGlzdEluZm8nLCBia0xpc3RJbmZvKTtcblxuZnVuY3Rpb24gYmtMaXN0SW5mbyhhbGxMaXN0c1NlcnZpY2UpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdHRlbXBsYXRlVXJsOiAnLi90ZW1wbGF0ZXMvYmtMaXN0SW5mby5odG1sJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkgeyBhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3Qoc2NvcGUubGlzdCkgfSk7XG5cdFx0fSk7XG5cdH1cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5kaXJlY3RpdmUoJ2JrTGlzdFZpZXcnLCBia0xpc3RWaWV3KTtcblxuZnVuY3Rpb24gYmtMaXN0VmlldygpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdGNvbnRyb2xsZXI6ICdJdGVtc0NvbnRyb2xsZXInLFxuXHRcdGNvbnRyb2xsZXJBczogJ0l0ZW1zJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblxuXHRcdHZhciBzdWJoZWFkZXIgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXInKTtcblx0XHR2YXIgdGl0bGVJbnB1dCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlciBpbnB1dCcpO1xuXG5cdFx0Ly8gQ2xpY2sgb3V0c2lkZSBvZiBpdGVtcyB0byBleGl0IGVkaXQgbW9kZVxuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZGVzZWxlY3RBbGwoKTtcblx0XHRcdGlmIChlLnRhcmdldCkge1xuXHRcdFx0XHR2YXIgYmtJdGVtID0gaXNCa0l0ZW1DaGlsZChlLnRhcmdldCk7XG5cdFx0XHRcdGlmIChia0l0ZW0pIHtcblx0XHRcdFx0XHRtYWtlSXRlbUVkaXRhYmxlKGJrSXRlbSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIFByZXZlbnQgbG9zaW5nIGZvY3VzIG9uIGJ1dHRvbiBjbGlja3Ncblx0XHRlbGVtZW50LmZpbmQoJ2J1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fSk7XG5cblx0XHQvLyBNYWtlIHRpdGxlIGVkaXRhYmxlIG9uIGNsaWNrXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyIC5uYW1lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdG1ha2VUaXRsZUVkaXRhYmxlKCk7XG5cdFx0fSk7XG5cblx0XHQvLyBFeGl0IHRpdGxlIGVkaXQgbW9kZSBvbiB0aXRsZSBpbnB1dCBsb3NpbmcgZm9jdXNcblx0XHR0aXRsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlcicpLmNsYXNzTGlzdC5yZW1vdmUoJ2VkaXRhYmxlJyk7XG5cdFx0fSk7XG5cblx0XHQvLyBTd2l0Y2ggZm9jdXMgdG8gbmV3IGl0ZW1cblx0XHRzY29wZS4kd2F0Y2goJ0l0ZW1zLmdldEN1cnJlbnRMaXN0KCkuaXRlbXNbMF0nLCBmdW5jdGlvbigpIHtcblx0XHRcdC8vIG9uIG5ldyBpdGVtIGFkZGVkXG5cdFx0XHR2YXIgbmV3SXRlbSA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYmstaXRlbScpO1xuXHRcdFx0aWYgKG5ld0l0ZW0pIHtcblx0XHRcdFx0ZGVzZWxlY3RBbGwoKTtcblx0XHRcdFx0bWFrZUl0ZW1FZGl0YWJsZShuZXdJdGVtKTtcblx0XHRcdFx0Ly8gZm9jdXMgdGl0bGUgZmllbGQgYnkgZGVmYXVsdDsgZGVsYXkgdG8gd2FpdCBmb3Igc3R5bGUgdG8gdGFrZSBlZmZlY3Rcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHsgbmV3SXRlbS5xdWVyeVNlbGVjdG9yKCcudGl0bGUgaW5wdXQnKS5mb2N1cygpOyB9LCAxMDApO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gbWFrZVRpdGxlRWRpdGFibGUoKSB7XG5cdFx0XHRzdWJoZWFkZXIuY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdHRpdGxlSW5wdXQuZm9jdXMoKTtcblx0XHR9XG5cdFx0c2NvcGUubWFrZVRpdGxlRWRpdGFibGUgPSBtYWtlVGl0bGVFZGl0YWJsZTtcblxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuXHRcdFx0ZWxlbWVudC5maW5kKCdiay1pdGVtJykucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG1ha2VJdGVtRWRpdGFibGUoaXRlbSkge1xuXHRcdFx0aXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcygnaGFzRWRpdGFibGVJdGVtJyk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaXNCa0l0ZW1DaGlsZChub2RlKSB7XG5cdFx0XHR2YXIgaXNDYXJkQ29udGVudCA9IGZhbHNlO1xuXHRcdFx0d2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gZWxlbWVudFswXSkge1xuXHRcdFx0XHRpZiAobm9kZS5ub2RlTmFtZSA9PT0gJ01ELUNBUkQtQ09OVEVOVCcpIHtcblx0XHRcdFx0XHRpc0NhcmRDb250ZW50ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoaXNDYXJkQ29udGVudCAmJiBub2RlLm5vZGVOYW1lID09PSAnQkstSVRFTScpIHtcblx0XHRcdFx0XHRyZXR1cm4gbm9kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnSXRlbU9iamVjdCcsIEl0ZW1PYmplY3QpO1xuXG5mdW5jdGlvbiBJdGVtT2JqZWN0KCkge1xuXG5cdHZhciBpdGVtT2JqZWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50aXRsZSA9ICcnO1xuXHRcdHRoaXMubm90ZSA9ICcnO1xuXHRcdHRoaXMuYXNzaWduID0gJyc7XG5cdFx0dGhpcy5kb25lID0gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4gaXRlbU9iamVjdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0xpc3RPYmplY3QnLCBMaXN0T2JqZWN0KTtcblxuZnVuY3Rpb24gTGlzdE9iamVjdChJdGVtT2JqZWN0KSB7XG5cblx0dmFyIGxpc3RPYmplY3QgPSBmdW5jdGlvbihpZCwgbmFtZSkge1xuXHRcdHRoaXMuaWQgPSBpZDtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuaXRlbXMgPSBbXTtcblx0XHR0aGlzLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHRcdHRoaXMuZ2V0RGVzY3JpcHRpb24gPSBnZXREZXNjcmlwdGlvbjtcblx0fVxuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0dGhpcy5pdGVtcy51bnNoaWZ0KG5ldyBJdGVtT2JqZWN0KCkpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGVzY3JpcHRpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKCFpdGVtLmRvbmUpIHJldHVybiBpdGVtLnRpdGxlIH0pXG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9KS8vIGdldCBub24tZW1wdHkgaXRlbXNcblx0XHRcdFx0XHRcdC5qb2luKCcsICcpO1xuXHR9XG5cblx0cmV0dXJuIGxpc3RPYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdhbGxMaXN0c1NlcnZpY2UnLCBhbGxMaXN0c1NlcnZpY2UpO1xuXG5mdW5jdGlvbiBhbGxMaXN0c1NlcnZpY2UoTGlzdE9iamVjdCkge1xuXG5cdHZhciBsaXN0cyA9IFtdO1xuXHR2YXIgY3VycmVudExpc3RJbmRleCA9IHVuZGVmaW5lZDtcblxuXHRyZXR1cm4ge1xuXHRcdGFkZDogYWRkLFxuXHRcdGxpc3RzOiBsaXN0cyxcblx0XHRjdXJyZW50TGlzdEluZGV4OiBjdXJyZW50TGlzdEluZGV4LFxuXHRcdHNldEN1cnJlbnRMaXN0OiBzZXRDdXJyZW50TGlzdCxcblx0XHRnZXRDdXJyZW50TGlzdDogZ2V0Q3VycmVudExpc3Rcblx0fTtcblxuXHRmdW5jdGlvbiBhZGQoKSB7XG5cdFx0bGlzdHMudW5zaGlmdChcblx0XHRcdG5ldyBMaXN0T2JqZWN0KGdldFVuaXFJZCgpLCBcIk5ldyBMaXN0IFwiKyhsaXN0cy5sZW5ndGgrMSkpXG5cdFx0KTtcblx0XHRyZXR1cm4gbGlzdHNbMF07XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRVbmlxSWQoKSB7XG5cdFx0dmFyIGxlbmd0aCA9IDg7XG5cdFx0cmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqTWF0aC5wb3coMzYsbGVuZ3RoKSkudG9TdHJpbmcoMzYpKS5zbGljZSgtbGVuZ3RoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGZpbmRMaXN0QnlJZChpZCkge1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKGxpc3RzLmlkID09PSBpZCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDdXJyZW50TGlzdChsaXN0KSB7XG5cdFx0aWYgKHR5cGVvZiBsaXN0ID09PSAnbnVtYmVyJykge1xuXHRcdFx0Y3VycmVudExpc3RJbmRleCA9IGxpc3Q7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgbGlzdCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGN1cnJlbnRMaXN0SW5kZXggPSBsaXN0cy5pbmRleE9mKGxpc3QpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ3Vua25vd24gaW5wdXQgZm9yIGxpc3Q6ICcrIHR5cGVvZiBsaXN0KTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRDdXJyZW50TGlzdCgpIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIGxpc3RzW2N1cnJlbnRMaXN0SW5kZXhdO1xuXHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0Y29uc29sZS53YXJuKCdMaXN0IG5vdCBmb3VuZC4gSW5kZXg6ICcrY3VycmVudExpc3RJbmRleCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdHMpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==