var app = angular.module('app', ['ngMaterial']);

angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($scope, allListsService) {
	var vm = this;

	vm.newList = addNewList;
	$scope.$on("currentListChanged", function(event, args) {
		$scope.$apply(vm.currentList = args.list);
	});

	function addNewList() {
		vm.currentList = allListsService.add();
	}
}
BasketController.$inject = ["$scope", "allListsService"];

angular
	.module('app')
	.controller('ItemsController', ItemsController);

function ItemsController($scope) {
	var vm = this;

	vm.addItem = addItem;
	vm.getCurrentList = function() { return main.currentList; };


	var main = $scope.Main;

	function addItem() {
		if (!vm.getCurrentList()) {
			main.newList();
		}
		vm.getCurrentList().addItem();
	}

}
ItemsController.$inject = ["$scope"];
angular
	.module('app')
	.controller('ListsController', ListsController);

function ListsController(allListsService) {
	
	this.lists = allListsService.lists;

	this.addList = allListsService.add;

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

function bkListInfo() {
	var directive = {
		restrict: 'EA',
		link: link,
		transclude: true,
		template: [
				'<div ng-transclude>',
				'</div>'
			].join('')
	};

	return directive;

	function link(scope, element, attrs) {
		element.on('click', function(){
			scope.$emit("currentListChanged", { list: scope.list });
		});
	}
}
angular
	.module('app')
	.directive('bkListView', bkListView);

function bkListView() {
	var directive = {
		restrict: 'EA',
		link: link,
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

		scope.$watch('Main.currentList.items[0]', function() {
			var newItem = element[0].querySelector('bk-item');
			if (newItem) {
				deselectAll();
				newItem.classList.add('editable');
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
	}

	function addItem() {
		this.items.unshift(new ItemObject());
	}

	return listObject;

}
ListObject.$inject = ["ItemObject"];
angular
	.module('app')
	.factory('allListsService', allListsService);

function allListsService(ListObject) {

	var lists = [];

	return {
		add: add,
		lists: lists
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
}
allListsService.$inject = ["ListObject"];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9MaXN0c0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2JrSXRlbS5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0SW5mby5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0Vmlldy5qcyIsInNlcnZpY2VzL0l0ZW1PYmplY3QuanMiLCJzZXJ2aWNlcy9MaXN0T2JqZWN0LmpzIiwic2VydmljZXMvYWxsTGlzdHNTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUEsTUFBQSxRQUFBLE9BQUEsT0FBQSxDQUFBOztBQ0FBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsb0JBQUE7O0FBRUEsU0FBQSxpQkFBQSxRQUFBLGlCQUFBO0NBQ0EsSUFBQSxLQUFBOztDQUVBLEdBQUEsVUFBQTtDQUNBLE9BQUEsSUFBQSxzQkFBQSxTQUFBLE9BQUEsTUFBQTtFQUNBLE9BQUEsT0FBQSxHQUFBLGNBQUEsS0FBQTs7O0NBR0EsU0FBQSxhQUFBO0VBQ0EsR0FBQSxjQUFBLGdCQUFBOzs7OztBQ2JBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxRQUFBO0NBQ0EsSUFBQSxLQUFBOztDQUVBLEdBQUEsVUFBQTtDQUNBLEdBQUEsaUJBQUEsV0FBQSxFQUFBLE9BQUEsS0FBQTs7O0NBR0EsSUFBQSxPQUFBLE9BQUE7O0NBRUEsU0FBQSxVQUFBO0VBQ0EsSUFBQSxDQUFBLEdBQUEsa0JBQUE7R0FDQSxLQUFBOztFQUVBLEdBQUEsaUJBQUE7Ozs7O0FDakJBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxpQkFBQTs7Q0FFQSxLQUFBLFFBQUEsZ0JBQUE7O0NBRUEsS0FBQSxVQUFBLGdCQUFBOzs7O0FDUkE7RUFDQSxPQUFBO0VBQ0EsVUFBQSxVQUFBOztBQUVBLFNBQUEsU0FBQTtDQUNBLElBQUEsWUFBQTtFQUNBLFVBQUE7RUFDQSxNQUFBO0VBQ0EsYUFBQTs7O0NBR0EsT0FBQTs7Q0FFQSxTQUFBLEtBQUEsT0FBQSxTQUFBLE9BQUE7OztBQ2JBO0VBQ0EsT0FBQTtFQUNBLFVBQUEsY0FBQTs7QUFFQSxTQUFBLGFBQUE7Q0FDQSxJQUFBLFlBQUE7RUFDQSxVQUFBO0VBQ0EsTUFBQTtFQUNBLFlBQUE7RUFDQSxVQUFBO0lBQ0E7SUFDQTtLQUNBLEtBQUE7OztDQUdBLE9BQUE7O0NBRUEsU0FBQSxLQUFBLE9BQUEsU0FBQSxPQUFBO0VBQ0EsUUFBQSxHQUFBLFNBQUEsVUFBQTtHQUNBLE1BQUEsTUFBQSxzQkFBQSxFQUFBLE1BQUEsTUFBQTs7OztBQ25CQTtFQUNBLE9BQUE7RUFDQSxVQUFBLGNBQUE7O0FBRUEsU0FBQSxhQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7OztDQUdBLE9BQUE7O0NBRUEsU0FBQSxLQUFBLE9BQUEsU0FBQSxPQUFBO0VBQ0EsUUFBQSxHQUFBLFNBQUEsU0FBQSxHQUFBO0dBQ0E7R0FDQSxJQUFBLEVBQUEsUUFBQTtJQUNBLElBQUEsU0FBQSxjQUFBLEVBQUE7SUFDQSxJQUFBLFFBQUE7S0FDQSxPQUFBLFVBQUEsSUFBQTs7Ozs7RUFLQSxRQUFBLEtBQUEsVUFBQSxHQUFBLFNBQUEsU0FBQSxHQUFBO0dBQ0EsRUFBQTs7O0VBR0EsTUFBQSxPQUFBLDZCQUFBLFdBQUE7R0FDQSxJQUFBLFVBQUEsUUFBQSxHQUFBLGNBQUE7R0FDQSxJQUFBLFNBQUE7SUFDQTtJQUNBLFFBQUEsVUFBQSxJQUFBOzs7O0VBSUEsU0FBQSxjQUFBO0dBQ0EsUUFBQSxLQUFBLFdBQUEsWUFBQTs7O0VBR0EsU0FBQSxjQUFBLE1BQUE7R0FDQSxJQUFBLGdCQUFBO0dBQ0EsT0FBQSxRQUFBLFNBQUEsUUFBQSxJQUFBO0lBQ0EsSUFBQSxLQUFBLGFBQUEsbUJBQUE7S0FDQSxnQkFBQTs7SUFFQSxJQUFBLGlCQUFBLEtBQUEsYUFBQSxXQUFBO0tBQ0EsT0FBQTs7SUFFQSxPQUFBLEtBQUE7O0dBRUEsT0FBQTs7OztBQ2xEQTtFQUNBLE9BQUE7RUFDQSxRQUFBLGNBQUE7O0FBRUEsU0FBQSxhQUFBOztDQUVBLElBQUEsYUFBQSxXQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsS0FBQSxPQUFBOzs7Q0FHQSxPQUFBOzs7QUNYQTtFQUNBLE9BQUE7RUFDQSxRQUFBLGNBQUE7O0FBRUEsU0FBQSxXQUFBLFlBQUE7O0NBRUEsSUFBQSxhQUFBLFNBQUEsSUFBQSxNQUFBO0VBQ0EsS0FBQSxLQUFBO0VBQ0EsS0FBQSxPQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsS0FBQSxVQUFBOzs7Q0FHQSxTQUFBLFVBQUE7RUFDQSxLQUFBLE1BQUEsUUFBQSxJQUFBOzs7Q0FHQSxPQUFBOzs7O0FDakJBO0VBQ0EsT0FBQTtFQUNBLFFBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxZQUFBOztDQUVBLElBQUEsUUFBQTs7Q0FFQSxPQUFBO0VBQ0EsS0FBQTtFQUNBLE9BQUE7OztDQUdBLFNBQUEsTUFBQTtFQUNBLE1BQUE7R0FDQSxJQUFBLFdBQUEsYUFBQSxhQUFBLE1BQUEsT0FBQTs7RUFFQSxPQUFBLE1BQUE7OztDQUdBLFNBQUEsWUFBQTtFQUNBLElBQUEsU0FBQTtFQUNBLE9BQUEsQ0FBQSxLQUFBLE1BQUEsS0FBQSxTQUFBLEtBQUEsSUFBQSxHQUFBLFNBQUEsU0FBQSxLQUFBLE1BQUEsQ0FBQTs7O3lDQUVBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyduZ01hdGVyaWFsJ10pO1xuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignQmFza2V0Q29udHJvbGxlcicsIEJhc2tldENvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBCYXNrZXRDb250cm9sbGVyKCRzY29wZSwgYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cblx0dm0ubmV3TGlzdCA9IGFkZE5ld0xpc3Q7XG5cdCRzY29wZS4kb24oXCJjdXJyZW50TGlzdENoYW5nZWRcIiwgZnVuY3Rpb24oZXZlbnQsIGFyZ3MpIHtcblx0XHQkc2NvcGUuJGFwcGx5KHZtLmN1cnJlbnRMaXN0ID0gYXJncy5saXN0KTtcblx0fSk7XG5cblx0ZnVuY3Rpb24gYWRkTmV3TGlzdCgpIHtcblx0XHR2bS5jdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5hZGQoKTtcblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignSXRlbXNDb250cm9sbGVyJywgSXRlbXNDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gSXRlbXNDb250cm9sbGVyKCRzY29wZSkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXG5cdHZtLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHR2bS5nZXRDdXJyZW50TGlzdCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbWFpbi5jdXJyZW50TGlzdDsgfTtcblxuXG5cdHZhciBtYWluID0gJHNjb3BlLk1haW47XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHRpZiAoIXZtLmdldEN1cnJlbnRMaXN0KCkpIHtcblx0XHRcdG1haW4ubmV3TGlzdCgpO1xuXHRcdH1cblx0XHR2bS5nZXRDdXJyZW50TGlzdCgpLmFkZEl0ZW0oKTtcblx0fVxuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignTGlzdHNDb250cm9sbGVyJywgTGlzdHNDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gTGlzdHNDb250cm9sbGVyKGFsbExpc3RzU2VydmljZSkge1xuXHRcblx0dGhpcy5saXN0cyA9IGFsbExpc3RzU2VydmljZS5saXN0cztcblxuXHR0aGlzLmFkZExpc3QgPSBhbGxMaXN0c1NlcnZpY2UuYWRkO1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0l0ZW0nLCBia0l0ZW0pO1xuXG5mdW5jdGlvbiBia0l0ZW0oKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrSXRlbS5odG1sJ1xuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0SW5mbycsIGJrTGlzdEluZm8pO1xuXG5mdW5jdGlvbiBia0xpc3RJbmZvKCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0dHJhbnNjbHVkZTogdHJ1ZSxcblx0XHR0ZW1wbGF0ZTogW1xuXHRcdFx0XHQnPGRpdiBuZy10cmFuc2NsdWRlPicsXG5cdFx0XHRcdCc8L2Rpdj4nXG5cdFx0XHRdLmpvaW4oJycpXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcblx0XHRcdHNjb3BlLiRlbWl0KFwiY3VycmVudExpc3RDaGFuZ2VkXCIsIHsgbGlzdDogc2NvcGUubGlzdCB9KTtcblx0XHR9KTtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0VmlldycsIGJrTGlzdFZpZXcpO1xuXG5mdW5jdGlvbiBia0xpc3RWaWV3KCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZGVzZWxlY3RBbGwoKTtcblx0XHRcdGlmIChlLnRhcmdldCkge1xuXHRcdFx0XHR2YXIgYmtJdGVtID0gaXNCa0l0ZW1DaGlsZChlLnRhcmdldCk7XG5cdFx0XHRcdGlmIChia0l0ZW0pIHtcblx0XHRcdFx0XHRia0l0ZW0uY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pXG5cblx0XHRzY29wZS4kd2F0Y2goJ01haW4uY3VycmVudExpc3QuaXRlbXNbMF0nLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBuZXdJdGVtID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdiay1pdGVtJyk7XG5cdFx0XHRpZiAobmV3SXRlbSkge1xuXHRcdFx0XHRkZXNlbGVjdEFsbCgpO1xuXHRcdFx0XHRuZXdJdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlJyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRmdW5jdGlvbiBkZXNlbGVjdEFsbCgpIHtcblx0XHRcdGVsZW1lbnQuZmluZCgnYmstaXRlbScpLnJlbW92ZUNsYXNzKFwiZWRpdGFibGVcIik7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaXNCa0l0ZW1DaGlsZChub2RlKSB7XG5cdFx0XHR2YXIgaXNDYXJkQ29udGVudCA9IGZhbHNlO1xuXHRcdFx0d2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gZWxlbWVudFswXSkge1xuXHRcdFx0XHRpZiAobm9kZS5ub2RlTmFtZSA9PT0gJ01ELUNBUkQtQ09OVEVOVCcpIHtcblx0XHRcdFx0XHRpc0NhcmRDb250ZW50ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoaXNDYXJkQ29udGVudCAmJiBub2RlLm5vZGVOYW1lID09PSAnQkstSVRFTScpIHtcblx0XHRcdFx0XHRyZXR1cm4gbm9kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0l0ZW1PYmplY3QnLCBJdGVtT2JqZWN0KTtcblxuZnVuY3Rpb24gSXRlbU9iamVjdCgpIHtcblxuXHR2YXIgaXRlbU9iamVjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudGl0bGUgPSAnJztcblx0XHR0aGlzLm5vdGUgPSAnJztcblx0fVxuXG5cdHJldHVybiBpdGVtT2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnTGlzdE9iamVjdCcsIExpc3RPYmplY3QpO1xuXG5mdW5jdGlvbiBMaXN0T2JqZWN0KEl0ZW1PYmplY3QpIHtcblxuXHR2YXIgbGlzdE9iamVjdCA9IGZ1bmN0aW9uKGlkLCBuYW1lKSB7XG5cdFx0dGhpcy5pZCA9IGlkO1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0dGhpcy5pdGVtcyA9IFtdO1xuXHRcdHRoaXMuYWRkSXRlbSA9IGFkZEl0ZW07XG5cdH1cblxuXHRmdW5jdGlvbiBhZGRJdGVtKCkge1xuXHRcdHRoaXMuaXRlbXMudW5zaGlmdChuZXcgSXRlbU9iamVjdCgpKTtcblx0fVxuXG5cdHJldHVybiBsaXN0T2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnYWxsTGlzdHNTZXJ2aWNlJywgYWxsTGlzdHNTZXJ2aWNlKTtcblxuZnVuY3Rpb24gYWxsTGlzdHNTZXJ2aWNlKExpc3RPYmplY3QpIHtcblxuXHR2YXIgbGlzdHMgPSBbXTtcblxuXHRyZXR1cm4ge1xuXHRcdGFkZDogYWRkLFxuXHRcdGxpc3RzOiBsaXN0c1xuXHR9O1xuXG5cdGZ1bmN0aW9uIGFkZCgpIHtcblx0XHRsaXN0cy51bnNoaWZ0KFxuXHRcdFx0bmV3IExpc3RPYmplY3QoZ2V0VW5pcUlkKCksIFwiTmV3IExpc3QgXCIrKGxpc3RzLmxlbmd0aCsxKSlcblx0XHQpO1xuXHRcdHJldHVybiBsaXN0c1swXTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFVuaXFJZCgpIHtcblx0XHR2YXIgbGVuZ3RoID0gODtcblx0XHRyZXR1cm4gKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpNYXRoLnBvdygzNixsZW5ndGgpKS50b1N0cmluZygzNikpLnNsaWNlKC1sZW5ndGgpO1xuXHR9XG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9