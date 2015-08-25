var app = angular.module('app', ['ngMaterial']);

angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController() {
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
		templateUrl: './templates/bkItem.html'
	};

	return directive;

	function link(scope, element, attrs) {
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
			element.find('bk-item').removeClass("editable");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9MaXN0c0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2JrSXRlbS5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0SW5mby5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0Vmlldy5qcyIsInNlcnZpY2VzL0l0ZW1PYmplY3QuanMiLCJzZXJ2aWNlcy9MaXN0T2JqZWN0LmpzIiwic2VydmljZXMvYWxsTGlzdHNTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUEsTUFBQSxRQUFBLE9BQUEsT0FBQSxDQUFBOztBQ0FBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsb0JBQUE7O0FBRUEsU0FBQSxtQkFBQTtDQUNBLElBQUEsS0FBQTs7O0FDTEE7RUFDQSxPQUFBO0VBQ0EsV0FBQSxtQkFBQTs7QUFFQSxTQUFBLGdCQUFBLGlCQUFBO0NBQ0EsSUFBQSxLQUFBOztDQUVBLEdBQUEsVUFBQTtDQUNBLEdBQUEsaUJBQUEsZ0JBQUE7O0NBRUEsU0FBQSxVQUFBO0VBQ0EsSUFBQSxDQUFBLGdCQUFBLGtCQUFBO0dBQ0EsZ0JBQUEsZUFBQSxnQkFBQTs7RUFFQSxHQUFBLGlCQUFBOzs7OztBQ2RBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxpQkFBQTs7Q0FFQSxLQUFBLFFBQUEsZ0JBQUE7O0NBRUEsS0FBQSxVQUFBLFdBQUE7RUFDQSxnQkFBQSxlQUFBLGdCQUFBOzs7OztBQ1RBO0VBQ0EsT0FBQTtFQUNBLFVBQUEsVUFBQTs7QUFFQSxTQUFBLFNBQUE7Q0FDQSxJQUFBLFlBQUE7RUFDQSxVQUFBO0VBQ0EsTUFBQTtFQUNBLGFBQUE7OztDQUdBLE9BQUE7O0NBRUEsU0FBQSxLQUFBLE9BQUEsU0FBQSxPQUFBOzs7QUNiQTtFQUNBLE9BQUE7RUFDQSxVQUFBLGNBQUE7O0FBRUEsU0FBQSxXQUFBLGlCQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxhQUFBOzs7Q0FHQSxPQUFBOztDQUVBLFNBQUEsS0FBQSxPQUFBLFNBQUEsT0FBQTtFQUNBLFFBQUEsR0FBQSxTQUFBLFdBQUE7R0FDQSxNQUFBLE9BQUEsV0FBQSxFQUFBLGdCQUFBLGVBQUEsTUFBQTs7Ozs7QUNmQTtFQUNBLE9BQUE7RUFDQSxVQUFBLGNBQUE7O0FBRUEsU0FBQSxhQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxZQUFBO0VBQ0EsY0FBQTs7O0NBR0EsT0FBQTs7Q0FFQSxTQUFBLEtBQUEsT0FBQSxTQUFBLE9BQUE7RUFDQSxRQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQTtHQUNBLElBQUEsRUFBQSxRQUFBO0lBQ0EsSUFBQSxTQUFBLGNBQUEsRUFBQTtJQUNBLElBQUEsUUFBQTtLQUNBLE9BQUEsVUFBQSxJQUFBOzs7OztFQUtBLFFBQUEsS0FBQSxVQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQSxFQUFBOzs7RUFHQSxNQUFBLE9BQUEsbUNBQUEsV0FBQTs7R0FFQSxJQUFBLFVBQUEsUUFBQSxHQUFBLGNBQUE7R0FDQSxJQUFBLFNBQUE7SUFDQTtJQUNBLFFBQUEsVUFBQSxJQUFBO0lBQ0EsUUFBQSxjQUFBLGdCQUFBOzs7O0VBSUEsU0FBQSxjQUFBO0dBQ0EsUUFBQSxLQUFBLFdBQUEsWUFBQTs7O0VBR0EsU0FBQSxjQUFBLE1BQUE7R0FDQSxJQUFBLGdCQUFBO0dBQ0EsT0FBQSxRQUFBLFNBQUEsUUFBQSxJQUFBO0lBQ0EsSUFBQSxLQUFBLGFBQUEsbUJBQUE7S0FDQSxnQkFBQTs7SUFFQSxJQUFBLGlCQUFBLEtBQUEsYUFBQSxXQUFBO0tBQ0EsT0FBQTs7SUFFQSxPQUFBLEtBQUE7O0dBRUEsT0FBQTs7OztBQ3REQTtFQUNBLE9BQUE7RUFDQSxRQUFBLGNBQUE7O0FBRUEsU0FBQSxhQUFBOztDQUVBLElBQUEsYUFBQSxXQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsS0FBQSxPQUFBOzs7Q0FHQSxPQUFBOzs7QUNYQTtFQUNBLE9BQUE7RUFDQSxRQUFBLGNBQUE7O0FBRUEsU0FBQSxXQUFBLFlBQUE7O0NBRUEsSUFBQSxhQUFBLFNBQUEsSUFBQSxNQUFBO0VBQ0EsS0FBQSxLQUFBO0VBQ0EsS0FBQSxPQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsS0FBQSxVQUFBO0VBQ0EsS0FBQSxpQkFBQTs7O0NBR0EsU0FBQSxVQUFBO0VBQ0EsS0FBQSxNQUFBLFFBQUEsSUFBQTs7O0NBR0EsU0FBQSxpQkFBQTtFQUNBLE9BQUEsS0FBQSxNQUFBLElBQUEsU0FBQSxNQUFBLEVBQUEsT0FBQSxLQUFBO09BQ0EsT0FBQSxTQUFBLEtBQUEsRUFBQSxPQUFBO09BQ0EsS0FBQTs7O0NBR0EsT0FBQTs7OztBQ3hCQTtFQUNBLE9BQUE7RUFDQSxRQUFBLG1CQUFBOztBQUVBLFNBQUEsZ0JBQUEsWUFBQTs7Q0FFQSxJQUFBLFFBQUE7Q0FDQSxJQUFBLG1CQUFBOztDQUVBLE9BQUE7RUFDQSxLQUFBO0VBQ0EsT0FBQTtFQUNBLGtCQUFBO0VBQ0EsZ0JBQUE7RUFDQSxnQkFBQTs7O0NBR0EsU0FBQSxNQUFBO0VBQ0EsTUFBQTtHQUNBLElBQUEsV0FBQSxhQUFBLGFBQUEsTUFBQSxPQUFBOztFQUVBLE9BQUEsTUFBQTs7O0NBR0EsU0FBQSxZQUFBO0VBQ0EsSUFBQSxTQUFBO0VBQ0EsT0FBQSxDQUFBLEtBQUEsTUFBQSxLQUFBLFNBQUEsS0FBQSxJQUFBLEdBQUEsU0FBQSxTQUFBLEtBQUEsTUFBQSxDQUFBOzs7Q0FHQSxTQUFBLGFBQUEsSUFBQTtFQUNBLEtBQUEsSUFBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLFFBQUEsS0FBQTtHQUNBLElBQUEsTUFBQSxPQUFBLElBQUE7SUFDQSxPQUFBOzs7OztDQUtBLFNBQUEsZUFBQSxNQUFBO0VBQ0EsSUFBQSxPQUFBLFNBQUEsVUFBQTtHQUNBLG1CQUFBO1NBQ0EsSUFBQSxPQUFBLFNBQUEsVUFBQTtHQUNBLG1CQUFBLE1BQUEsUUFBQTtTQUNBO0dBQ0EsUUFBQSxLQUFBLDRCQUFBLE9BQUE7R0FDQSxRQUFBLEtBQUE7Ozs7Q0FJQSxTQUFBLGlCQUFBO0VBQ0EsSUFBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLE1BQUEsR0FBQTtHQUNBLFFBQUEsS0FBQSwwQkFBQTtHQUNBLFFBQUEsS0FBQTtHQUNBLE9BQUE7Ozs7eUNBR0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nTWF0ZXJpYWwnXSk7XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdCYXNrZXRDb250cm9sbGVyJywgQmFza2V0Q29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEJhc2tldENvbnRyb2xsZXIoKSB7XG5cdHZhciB2bSA9IHRoaXM7XG59XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdJdGVtc0NvbnRyb2xsZXInLCBJdGVtc0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBJdGVtc0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cblx0dm0uYWRkSXRlbSA9IGFkZEl0ZW07XG5cdHZtLmdldEN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0aWYgKCFhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKSkge1xuXHRcdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdFx0fVxuXHRcdHZtLmdldEN1cnJlbnRMaXN0KCkuYWRkSXRlbSgpO1xuXHR9XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdMaXN0c0NvbnRyb2xsZXInLCBMaXN0c0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBMaXN0c0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdFxuXHR0aGlzLmxpc3RzID0gYWxsTGlzdHNTZXJ2aWNlLmxpc3RzO1xuXG5cdHRoaXMuYWRkTGlzdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChhbGxMaXN0c1NlcnZpY2UuYWRkKCkpO1xuXHR9O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0l0ZW0nLCBia0l0ZW0pO1xuXG5mdW5jdGlvbiBia0l0ZW0oKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrSXRlbS5odG1sJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0SW5mbycsIGJrTGlzdEluZm8pO1xuXG5mdW5jdGlvbiBia0xpc3RJbmZvKGFsbExpc3RzU2VydmljZSkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0dGVtcGxhdGVVcmw6ICcuL3RlbXBsYXRlcy9ia0xpc3RJbmZvLmh0bWwnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7IGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChzY29wZS5saXN0KSB9KTtcblx0XHR9KTtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0VmlldycsIGJrTGlzdFZpZXcpO1xuXG5mdW5jdGlvbiBia0xpc3RWaWV3KCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0Y29udHJvbGxlcjogJ0l0ZW1zQ29udHJvbGxlcicsXG5cdFx0Y29udHJvbGxlckFzOiAnSXRlbXMnXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZGVzZWxlY3RBbGwoKTtcblx0XHRcdGlmIChlLnRhcmdldCkge1xuXHRcdFx0XHR2YXIgYmtJdGVtID0gaXNCa0l0ZW1DaGlsZChlLnRhcmdldCk7XG5cdFx0XHRcdGlmIChia0l0ZW0pIHtcblx0XHRcdFx0XHRia0l0ZW0uY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pXG5cblx0XHRzY29wZS4kd2F0Y2goJ0l0ZW1zLmdldEN1cnJlbnRMaXN0KCkuaXRlbXNbMF0nLCBmdW5jdGlvbigpIHtcblx0XHRcdC8vIG9uIG5ldyBpdGVtIGFkZGVkXG5cdFx0XHR2YXIgbmV3SXRlbSA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYmstaXRlbScpO1xuXHRcdFx0aWYgKG5ld0l0ZW0pIHtcblx0XHRcdFx0ZGVzZWxlY3RBbGwoKTtcblx0XHRcdFx0bmV3SXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0XHRuZXdJdGVtLnF1ZXJ5U2VsZWN0b3IoJy50aXRsZSBpbnB1dCcpLmZvY3VzKCk7IC8vIGZvY3VzIHRpdGxlIGZpZWxkIGJ5IGRlZmF1bHRcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuXHRcdFx0ZWxlbWVudC5maW5kKCdiay1pdGVtJykucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZVwiKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBpc0JrSXRlbUNoaWxkKG5vZGUpIHtcblx0XHRcdHZhciBpc0NhcmRDb250ZW50ID0gZmFsc2U7XG5cdFx0XHR3aGlsZSAobm9kZSAmJiBub2RlICE9PSBlbGVtZW50WzBdKSB7XG5cdFx0XHRcdGlmIChub2RlLm5vZGVOYW1lID09PSAnTUQtQ0FSRC1DT05URU5UJykge1xuXHRcdFx0XHRcdGlzQ2FyZENvbnRlbnQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChpc0NhcmRDb250ZW50ICYmIG5vZGUubm9kZU5hbWUgPT09ICdCSy1JVEVNJykge1xuXHRcdFx0XHRcdHJldHVybiBub2RlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnSXRlbU9iamVjdCcsIEl0ZW1PYmplY3QpO1xuXG5mdW5jdGlvbiBJdGVtT2JqZWN0KCkge1xuXG5cdHZhciBpdGVtT2JqZWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50aXRsZSA9ICcnO1xuXHRcdHRoaXMubm90ZSA9ICcnO1xuXHR9XG5cblx0cmV0dXJuIGl0ZW1PYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdMaXN0T2JqZWN0JywgTGlzdE9iamVjdCk7XG5cbmZ1bmN0aW9uIExpc3RPYmplY3QoSXRlbU9iamVjdCkge1xuXG5cdHZhciBsaXN0T2JqZWN0ID0gZnVuY3Rpb24oaWQsIG5hbWUpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLml0ZW1zID0gW107XG5cdFx0dGhpcy5hZGRJdGVtID0gYWRkSXRlbTtcblx0XHR0aGlzLmdldERlc2NyaXB0aW9uID0gZ2V0RGVzY3JpcHRpb247XG5cdH1cblxuXHRmdW5jdGlvbiBhZGRJdGVtKCkge1xuXHRcdHRoaXMuaXRlbXMudW5zaGlmdChuZXcgSXRlbU9iamVjdCgpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldERlc2NyaXB0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLml0ZW1zLm1hcChmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLnRpdGxlIH0pXG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9KS8vIGdldCBub24tZW1wdHkgaXRlbXNcblx0XHRcdFx0XHRcdC5qb2luKCcsICcpO1xuXHR9XG5cblx0cmV0dXJuIGxpc3RPYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdhbGxMaXN0c1NlcnZpY2UnLCBhbGxMaXN0c1NlcnZpY2UpO1xuXG5mdW5jdGlvbiBhbGxMaXN0c1NlcnZpY2UoTGlzdE9iamVjdCkge1xuXG5cdHZhciBsaXN0cyA9IFtdO1xuXHR2YXIgY3VycmVudExpc3RJbmRleCA9IHVuZGVmaW5lZDtcblxuXHRyZXR1cm4ge1xuXHRcdGFkZDogYWRkLFxuXHRcdGxpc3RzOiBsaXN0cyxcblx0XHRjdXJyZW50TGlzdEluZGV4OiBjdXJyZW50TGlzdEluZGV4LFxuXHRcdHNldEN1cnJlbnRMaXN0OiBzZXRDdXJyZW50TGlzdCxcblx0XHRnZXRDdXJyZW50TGlzdDogZ2V0Q3VycmVudExpc3Rcblx0fTtcblxuXHRmdW5jdGlvbiBhZGQoKSB7XG5cdFx0bGlzdHMudW5zaGlmdChcblx0XHRcdG5ldyBMaXN0T2JqZWN0KGdldFVuaXFJZCgpLCBcIk5ldyBMaXN0IFwiKyhsaXN0cy5sZW5ndGgrMSkpXG5cdFx0KTtcblx0XHRyZXR1cm4gbGlzdHNbMF07XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRVbmlxSWQoKSB7XG5cdFx0dmFyIGxlbmd0aCA9IDg7XG5cdFx0cmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqTWF0aC5wb3coMzYsbGVuZ3RoKSkudG9TdHJpbmcoMzYpKS5zbGljZSgtbGVuZ3RoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGZpbmRMaXN0QnlJZChpZCkge1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKGxpc3RzLmlkID09PSBpZCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDdXJyZW50TGlzdChsaXN0KSB7XG5cdFx0aWYgKHR5cGVvZiBsaXN0ID09PSAnbnVtYmVyJykge1xuXHRcdFx0Y3VycmVudExpc3RJbmRleCA9IGxpc3Q7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgbGlzdCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGN1cnJlbnRMaXN0SW5kZXggPSBsaXN0cy5pbmRleE9mKGxpc3QpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ3Vua25vd24gaW5wdXQgZm9yIGxpc3Q6ICcrIHR5cGVvZiBsaXN0KTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRDdXJyZW50TGlzdCgpIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIGxpc3RzW2N1cnJlbnRMaXN0SW5kZXhdO1xuXHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0Y29uc29sZS53YXJuKCdMaXN0IG5vdCBmb3VuZC4gSW5kZXg6ICcrY3VycmVudExpc3RJbmRleCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdHMpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==