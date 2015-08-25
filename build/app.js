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
		element.on('click', function (e) {
			deselect();
		});


		element[0].querySelector('.actions button.assign').addEventListener('click', function() {
			element.addClass("editable editing assign");
			element[0].querySelector('md-input-container.assign input').focus();
		});

		element.find('md-input-container').on('click', function(e) {
			e.stopPropagation();
		});
		element.find('button').on('click', function(e) {
			e.stopPropagation();
		});

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
		element.on('click', function(e) {
			deselectAll();
			if (e.target) {
				var bkItem = isBkItemChild(e.target);
				if (bkItem) {
					bkItem.classList.add('editable');
				}
			}
		});

		element.find('button').on('click', function(e) {
			e.stopPropagation();
		})

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0l0ZW1zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0xpc3RzQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvYmtJdGVtLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RJbmZvLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RWaWV3LmpzIiwic2VydmljZXMvSXRlbU9iamVjdC5qcyIsInNlcnZpY2VzL0xpc3RPYmplY3QuanMiLCJzZXJ2aWNlcy9hbGxMaXN0c1NlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxNQUFBLFFBQUEsT0FBQSxPQUFBLENBQUE7O0FDQUE7RUFDQSxPQUFBO0VBQ0EsV0FBQSxvQkFBQTs7QUFFQSxTQUFBLG1CQUFBO0NBQ0EsSUFBQSxLQUFBOzs7QUNMQTtFQUNBLE9BQUE7RUFDQSxXQUFBLGtCQUFBOztBQUVBLFNBQUEsaUJBQUE7Q0FDQSxJQUFBLEtBQUE7OztBQ0xBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxpQkFBQTtDQUNBLElBQUEsS0FBQTs7Q0FFQSxHQUFBLFVBQUE7Q0FDQSxHQUFBLGlCQUFBLGdCQUFBOztDQUVBLFNBQUEsVUFBQTtFQUNBLElBQUEsQ0FBQSxnQkFBQSxrQkFBQTtHQUNBLGdCQUFBLGVBQUEsZ0JBQUE7O0VBRUEsR0FBQSxpQkFBQTs7Ozs7QUNkQTtFQUNBLE9BQUE7RUFDQSxXQUFBLG1CQUFBOztBQUVBLFNBQUEsZ0JBQUEsaUJBQUE7O0NBRUEsS0FBQSxRQUFBLGdCQUFBOztDQUVBLEtBQUEsVUFBQSxXQUFBO0VBQ0EsZ0JBQUEsZUFBQSxnQkFBQTs7Ozs7QUNUQTtFQUNBLE9BQUE7RUFDQSxVQUFBLFVBQUE7O0FBRUEsU0FBQSxTQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxhQUFBO0VBQ0EsWUFBQTtFQUNBLGNBQUE7OztDQUdBLE9BQUE7O0NBRUEsU0FBQSxLQUFBLE9BQUEsU0FBQSxPQUFBO0VBQ0EsUUFBQSxHQUFBLFNBQUEsVUFBQSxHQUFBO0dBQ0E7Ozs7RUFJQSxRQUFBLEdBQUEsY0FBQSwwQkFBQSxpQkFBQSxTQUFBLFdBQUE7R0FDQSxRQUFBLFNBQUE7R0FDQSxRQUFBLEdBQUEsY0FBQSxtQ0FBQTs7O0VBR0EsUUFBQSxLQUFBLHNCQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQSxFQUFBOztFQUVBLFFBQUEsS0FBQSxVQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQSxFQUFBOzs7RUFHQSxTQUFBLFdBQUE7R0FDQSxRQUFBLFlBQUE7Ozs7O0FDbENBO0VBQ0EsT0FBQTtFQUNBLFVBQUEsY0FBQTs7QUFFQSxTQUFBLFdBQUEsaUJBQUE7Q0FDQSxJQUFBLFlBQUE7RUFDQSxVQUFBO0VBQ0EsTUFBQTtFQUNBLGFBQUE7OztDQUdBLE9BQUE7O0NBRUEsU0FBQSxLQUFBLE9BQUEsU0FBQSxPQUFBO0VBQ0EsUUFBQSxHQUFBLFNBQUEsV0FBQTtHQUNBLE1BQUEsT0FBQSxXQUFBLEVBQUEsZ0JBQUEsZUFBQSxNQUFBOzs7OztBQ2ZBO0VBQ0EsT0FBQTtFQUNBLFVBQUEsY0FBQTs7QUFFQSxTQUFBLGFBQUE7Q0FDQSxJQUFBLFlBQUE7RUFDQSxVQUFBO0VBQ0EsTUFBQTtFQUNBLFlBQUE7RUFDQSxjQUFBOzs7Q0FHQSxPQUFBOztDQUVBLFNBQUEsS0FBQSxPQUFBLFNBQUEsT0FBQTtFQUNBLFFBQUEsR0FBQSxTQUFBLFNBQUEsR0FBQTtHQUNBO0dBQ0EsSUFBQSxFQUFBLFFBQUE7SUFDQSxJQUFBLFNBQUEsY0FBQSxFQUFBO0lBQ0EsSUFBQSxRQUFBO0tBQ0EsT0FBQSxVQUFBLElBQUE7Ozs7O0VBS0EsUUFBQSxLQUFBLFVBQUEsR0FBQSxTQUFBLFNBQUEsR0FBQTtHQUNBLEVBQUE7OztFQUdBLE1BQUEsT0FBQSxtQ0FBQSxXQUFBOztHQUVBLElBQUEsVUFBQSxRQUFBLEdBQUEsY0FBQTtHQUNBLElBQUEsU0FBQTtJQUNBO0lBQ0EsUUFBQSxVQUFBLElBQUE7SUFDQSxRQUFBLGNBQUEsZ0JBQUE7Ozs7RUFJQSxTQUFBLGNBQUE7R0FDQSxRQUFBLEtBQUEsV0FBQSxZQUFBOzs7RUFHQSxTQUFBLGNBQUEsTUFBQTtHQUNBLElBQUEsZ0JBQUE7R0FDQSxPQUFBLFFBQUEsU0FBQSxRQUFBLElBQUE7SUFDQSxJQUFBLEtBQUEsYUFBQSxtQkFBQTtLQUNBLGdCQUFBOztJQUVBLElBQUEsaUJBQUEsS0FBQSxhQUFBLFdBQUE7S0FDQSxPQUFBOztJQUVBLE9BQUEsS0FBQTs7R0FFQSxPQUFBOzs7OztBQ3REQTtFQUNBLE9BQUE7RUFDQSxRQUFBLGNBQUE7O0FBRUEsU0FBQSxhQUFBOztDQUVBLElBQUEsYUFBQSxXQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsS0FBQSxPQUFBO0VBQ0EsS0FBQSxTQUFBOzs7Q0FHQSxPQUFBOzs7QUNaQTtFQUNBLE9BQUE7RUFDQSxRQUFBLGNBQUE7O0FBRUEsU0FBQSxXQUFBLFlBQUE7O0NBRUEsSUFBQSxhQUFBLFNBQUEsSUFBQSxNQUFBO0VBQ0EsS0FBQSxLQUFBO0VBQ0EsS0FBQSxPQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsS0FBQSxVQUFBO0VBQ0EsS0FBQSxpQkFBQTs7O0NBR0EsU0FBQSxVQUFBO0VBQ0EsS0FBQSxNQUFBLFFBQUEsSUFBQTs7O0NBR0EsU0FBQSxpQkFBQTtFQUNBLE9BQUEsS0FBQSxNQUFBLElBQUEsU0FBQSxNQUFBLEVBQUEsT0FBQSxLQUFBO09BQ0EsT0FBQSxTQUFBLEtBQUEsRUFBQSxPQUFBO09BQ0EsS0FBQTs7O0NBR0EsT0FBQTs7OztBQ3hCQTtFQUNBLE9BQUE7RUFDQSxRQUFBLG1CQUFBOztBQUVBLFNBQUEsZ0JBQUEsWUFBQTs7Q0FFQSxJQUFBLFFBQUE7Q0FDQSxJQUFBLG1CQUFBOztDQUVBLE9BQUE7RUFDQSxLQUFBO0VBQ0EsT0FBQTtFQUNBLGtCQUFBO0VBQ0EsZ0JBQUE7RUFDQSxnQkFBQTs7O0NBR0EsU0FBQSxNQUFBO0VBQ0EsTUFBQTtHQUNBLElBQUEsV0FBQSxhQUFBLGFBQUEsTUFBQSxPQUFBOztFQUVBLE9BQUEsTUFBQTs7O0NBR0EsU0FBQSxZQUFBO0VBQ0EsSUFBQSxTQUFBO0VBQ0EsT0FBQSxDQUFBLEtBQUEsTUFBQSxLQUFBLFNBQUEsS0FBQSxJQUFBLEdBQUEsU0FBQSxTQUFBLEtBQUEsTUFBQSxDQUFBOzs7Q0FHQSxTQUFBLGFBQUEsSUFBQTtFQUNBLEtBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLFFBQUEsS0FBQTtHQUNBLElBQUEsTUFBQSxPQUFBLElBQUE7SUFDQSxPQUFBOzs7OztDQUtBLFNBQUEsZUFBQSxNQUFBO0VBQ0EsSUFBQSxPQUFBLFNBQUEsVUFBQTtHQUNBLG1CQUFBO1NBQ0EsSUFBQSxPQUFBLFNBQUEsVUFBQTtHQUNBLG1CQUFBLE1BQUEsUUFBQTtTQUNBO0dBQ0EsUUFBQSxLQUFBLDRCQUFBLE9BQUE7R0FDQSxRQUFBLEtBQUE7Ozs7Q0FJQSxTQUFBLGlCQUFBO0VBQ0EsSUFBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLE1BQUEsR0FBQTtHQUNBLFFBQUEsS0FBQSwwQkFBQTtHQUNBLFFBQUEsS0FBQTtHQUNBLE9BQUE7Ozs7eUNBR0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nTWF0ZXJpYWwnXSk7XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdCYXNrZXRDb250cm9sbGVyJywgQmFza2V0Q29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEJhc2tldENvbnRyb2xsZXIoKSB7XG5cdHZhciB2bSA9IHRoaXM7XG59XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdJdGVtQ29udHJvbGxlcicsIEl0ZW1Db250cm9sbGVyKTtcblxuZnVuY3Rpb24gSXRlbUNvbnRyb2xsZXIoKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdJdGVtc0NvbnRyb2xsZXInLCBJdGVtc0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBJdGVtc0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cblx0dm0uYWRkSXRlbSA9IGFkZEl0ZW07XG5cdHZtLmdldEN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0aWYgKCFhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKSkge1xuXHRcdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdFx0fVxuXHRcdHZtLmdldEN1cnJlbnRMaXN0KCkuYWRkSXRlbSgpO1xuXHR9XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdMaXN0c0NvbnRyb2xsZXInLCBMaXN0c0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBMaXN0c0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdFxuXHR0aGlzLmxpc3RzID0gYWxsTGlzdHNTZXJ2aWNlLmxpc3RzO1xuXG5cdHRoaXMuYWRkTGlzdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChhbGxMaXN0c1NlcnZpY2UuYWRkKCkpO1xuXHR9O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0l0ZW0nLCBia0l0ZW0pO1xuXG5mdW5jdGlvbiBia0l0ZW0oKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrSXRlbS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnSXRlbUNvbnRyb2xsZXInLFxuXHRcdGNvbnRyb2xsZXJBczogJ0l0ZW0nXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cblxuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLmFjdGlvbnMgYnV0dG9uLmFzc2lnbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50LmFkZENsYXNzKFwiZWRpdGFibGUgZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ21kLWlucHV0LWNvbnRhaW5lci5hc3NpZ24gaW5wdXQnKS5mb2N1cygpO1xuXHRcdH0pO1xuXG5cdFx0ZWxlbWVudC5maW5kKCdtZC1pbnB1dC1jb250YWluZXInKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KTtcblxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0KCkge1xuXHRcdFx0ZWxlbWVudC5yZW1vdmVDbGFzcyhcImVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RJbmZvJywgYmtMaXN0SW5mbyk7XG5cbmZ1bmN0aW9uIGJrTGlzdEluZm8oYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrTGlzdEluZm8uaHRtbCdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHsgYWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KHNjb3BlLmxpc3QpIH0pO1xuXHRcdH0pO1xuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RWaWV3JywgYmtMaXN0Vmlldyk7XG5cbmZ1bmN0aW9uIGJrTGlzdFZpZXcoKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0aWYgKGUudGFyZ2V0KSB7XG5cdFx0XHRcdHZhciBia0l0ZW0gPSBpc0JrSXRlbUNoaWxkKGUudGFyZ2V0KTtcblx0XHRcdFx0aWYgKGJrSXRlbSkge1xuXHRcdFx0XHRcdGJrSXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRlbGVtZW50LmZpbmQoJ2J1dHRvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fSlcblxuXHRcdHNjb3BlLiR3YXRjaCgnSXRlbXMuZ2V0Q3VycmVudExpc3QoKS5pdGVtc1swXScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gb24gbmV3IGl0ZW0gYWRkZWRcblx0XHRcdHZhciBuZXdJdGVtID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdiay1pdGVtJyk7XG5cdFx0XHRpZiAobmV3SXRlbSkge1xuXHRcdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0XHRuZXdJdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlJyk7XG5cdFx0XHRcdG5ld0l0ZW0ucXVlcnlTZWxlY3RvcignLnRpdGxlIGlucHV0JykuZm9jdXMoKTsgLy8gZm9jdXMgdGl0bGUgZmllbGQgYnkgZGVmYXVsdFxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3RBbGwoKSB7XG5cdFx0XHRlbGVtZW50LmZpbmQoJ2JrLWl0ZW0nKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlIGVkaXRpbmcgYXNzaWduXCIpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGlzQmtJdGVtQ2hpbGQobm9kZSkge1xuXHRcdFx0dmFyIGlzQ2FyZENvbnRlbnQgPSBmYWxzZTtcblx0XHRcdHdoaWxlIChub2RlICYmIG5vZGUgIT09IGVsZW1lbnRbMF0pIHtcblx0XHRcdFx0aWYgKG5vZGUubm9kZU5hbWUgPT09ICdNRC1DQVJELUNPTlRFTlQnKSB7XG5cdFx0XHRcdFx0aXNDYXJkQ29udGVudCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGlzQ2FyZENvbnRlbnQgJiYgbm9kZS5ub2RlTmFtZSA9PT0gJ0JLLUlURU0nKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5vZGU7XG5cdFx0XHRcdH1cblx0XHRcdFx0bm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0l0ZW1PYmplY3QnLCBJdGVtT2JqZWN0KTtcblxuZnVuY3Rpb24gSXRlbU9iamVjdCgpIHtcblxuXHR2YXIgaXRlbU9iamVjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudGl0bGUgPSAnJztcblx0XHR0aGlzLm5vdGUgPSAnJztcblx0XHR0aGlzLmFzc2lnbiA9ICcnO1xuXHR9XG5cblx0cmV0dXJuIGl0ZW1PYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdMaXN0T2JqZWN0JywgTGlzdE9iamVjdCk7XG5cbmZ1bmN0aW9uIExpc3RPYmplY3QoSXRlbU9iamVjdCkge1xuXG5cdHZhciBsaXN0T2JqZWN0ID0gZnVuY3Rpb24oaWQsIG5hbWUpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLml0ZW1zID0gW107XG5cdFx0dGhpcy5hZGRJdGVtID0gYWRkSXRlbTtcblx0XHR0aGlzLmdldERlc2NyaXB0aW9uID0gZ2V0RGVzY3JpcHRpb247XG5cdH1cblxuXHRmdW5jdGlvbiBhZGRJdGVtKCkge1xuXHRcdHRoaXMuaXRlbXMudW5zaGlmdChuZXcgSXRlbU9iamVjdCgpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldERlc2NyaXB0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLml0ZW1zLm1hcChmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLnRpdGxlIH0pXG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9KS8vIGdldCBub24tZW1wdHkgaXRlbXNcblx0XHRcdFx0XHRcdC5qb2luKCcsICcpO1xuXHR9XG5cblx0cmV0dXJuIGxpc3RPYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdhbGxMaXN0c1NlcnZpY2UnLCBhbGxMaXN0c1NlcnZpY2UpO1xuXG5mdW5jdGlvbiBhbGxMaXN0c1NlcnZpY2UoTGlzdE9iamVjdCkge1xuXG5cdHZhciBsaXN0cyA9IFtdO1xuXHR2YXIgY3VycmVudExpc3RJbmRleCA9IHVuZGVmaW5lZDtcblxuXHRyZXR1cm4ge1xuXHRcdGFkZDogYWRkLFxuXHRcdGxpc3RzOiBsaXN0cyxcblx0XHRjdXJyZW50TGlzdEluZGV4OiBjdXJyZW50TGlzdEluZGV4LFxuXHRcdHNldEN1cnJlbnRMaXN0OiBzZXRDdXJyZW50TGlzdCxcblx0XHRnZXRDdXJyZW50TGlzdDogZ2V0Q3VycmVudExpc3Rcblx0fTtcblxuXHRmdW5jdGlvbiBhZGQoKSB7XG5cdFx0bGlzdHMudW5zaGlmdChcblx0XHRcdG5ldyBMaXN0T2JqZWN0KGdldFVuaXFJZCgpLCBcIk5ldyBMaXN0IFwiKyhsaXN0cy5sZW5ndGgrMSkpXG5cdFx0KTtcblx0XHRyZXR1cm4gbGlzdHNbMF07XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRVbmlxSWQoKSB7XG5cdFx0dmFyIGxlbmd0aCA9IDg7XG5cdFx0cmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqTWF0aC5wb3coMzYsbGVuZ3RoKSkudG9TdHJpbmcoMzYpKS5zbGljZSgtbGVuZ3RoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGZpbmRMaXN0QnlJZChpZCkge1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKGxpc3RzLmlkID09PSBpZCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDdXJyZW50TGlzdChsaXN0KSB7XG5cdFx0aWYgKHR5cGVvZiBsaXN0ID09PSAnbnVtYmVyJykge1xuXHRcdFx0Y3VycmVudExpc3RJbmRleCA9IGxpc3Q7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgbGlzdCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGN1cnJlbnRMaXN0SW5kZXggPSBsaXN0cy5pbmRleE9mKGxpc3QpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ3Vua25vd24gaW5wdXQgZm9yIGxpc3Q6ICcrIHR5cGVvZiBsaXN0KTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRDdXJyZW50TGlzdCgpIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIGxpc3RzW2N1cnJlbnRMaXN0SW5kZXhdO1xuXHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0Y29uc29sZS53YXJuKCdMaXN0IG5vdCBmb3VuZC4gSW5kZXg6ICcrY3VycmVudExpc3RJbmRleCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdHMpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==