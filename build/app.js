var app = angular.module('app', ['ngMaterial']);

angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($scope) {
	var vm = this;

	$scope.$on("currentListChanged", function(event, args) {
		$scope.$apply(vm.currentList = args.list);
	});
}
BasketController.$inject = ["$scope"];

angular
	.module('app')
	.controller('ItemsController', ItemsController);

function ItemsController($scope) {
	var vm = this;

	vm.addItem = addItem;
	vm.getCurrentList = function() { return main.currentList; };


	var main = $scope.Main;

	function addItem() {
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
		lists.push(
			new ListObject(getUniqId(), "New List "+(lists.length+1))
		);
	}

	function getUniqId() {
		var length = 8;
		return (Math.floor(Math.random()*Math.pow(36,length)).toString(36)).slice(-length);
	}
}
allListsService.$inject = ["ListObject"];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9MaXN0c0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2JrSXRlbS5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0SW5mby5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0Vmlldy5qcyIsInNlcnZpY2VzL0l0ZW1PYmplY3QuanMiLCJzZXJ2aWNlcy9MaXN0T2JqZWN0LmpzIiwic2VydmljZXMvYWxsTGlzdHNTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUEsTUFBQSxRQUFBLE9BQUEsT0FBQSxDQUFBOztBQ0FBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsb0JBQUE7O0FBRUEsU0FBQSxpQkFBQSxRQUFBO0NBQ0EsSUFBQSxLQUFBOztDQUVBLE9BQUEsSUFBQSxzQkFBQSxTQUFBLE9BQUEsTUFBQTtFQUNBLE9BQUEsT0FBQSxHQUFBLGNBQUEsS0FBQTs7Ozs7QUNSQTtFQUNBLE9BQUE7RUFDQSxXQUFBLG1CQUFBOztBQUVBLFNBQUEsZ0JBQUEsUUFBQTtDQUNBLElBQUEsS0FBQTs7Q0FFQSxHQUFBLFVBQUE7Q0FDQSxHQUFBLGlCQUFBLFdBQUEsRUFBQSxPQUFBLEtBQUE7OztDQUdBLElBQUEsT0FBQSxPQUFBOztDQUVBLFNBQUEsVUFBQTtFQUNBLEdBQUEsaUJBQUE7Ozs7O0FDZEE7RUFDQSxPQUFBO0VBQ0EsV0FBQSxtQkFBQTs7QUFFQSxTQUFBLGdCQUFBLGlCQUFBOztDQUVBLEtBQUEsUUFBQSxnQkFBQTs7Q0FFQSxLQUFBLFVBQUEsZ0JBQUE7Ozs7QUNSQTtFQUNBLE9BQUE7RUFDQSxVQUFBLFVBQUE7O0FBRUEsU0FBQSxTQUFBO0NBQ0EsSUFBQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLE1BQUE7RUFDQSxhQUFBOzs7Q0FHQSxPQUFBOztDQUVBLFNBQUEsS0FBQSxPQUFBLFNBQUEsT0FBQTs7O0FDYkE7RUFDQSxPQUFBO0VBQ0EsVUFBQSxjQUFBOztBQUVBLFNBQUEsYUFBQTtDQUNBLElBQUEsWUFBQTtFQUNBLFVBQUE7RUFDQSxNQUFBO0VBQ0EsWUFBQTtFQUNBLFVBQUE7SUFDQTtJQUNBO0tBQ0EsS0FBQTs7O0NBR0EsT0FBQTs7Q0FFQSxTQUFBLEtBQUEsT0FBQSxTQUFBLE9BQUE7RUFDQSxRQUFBLEdBQUEsU0FBQSxVQUFBO0dBQ0EsTUFBQSxNQUFBLHNCQUFBLEVBQUEsTUFBQSxNQUFBOzs7O0FDbkJBO0VBQ0EsT0FBQTtFQUNBLFVBQUEsY0FBQTs7QUFFQSxTQUFBLGFBQUE7Q0FDQSxJQUFBLFlBQUE7RUFDQSxVQUFBO0VBQ0EsTUFBQTs7O0NBR0EsT0FBQTs7Q0FFQSxTQUFBLEtBQUEsT0FBQSxTQUFBLE9BQUE7RUFDQSxRQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQTtHQUNBLElBQUEsRUFBQSxRQUFBO0lBQ0EsSUFBQSxTQUFBLGNBQUEsRUFBQTtJQUNBLElBQUEsUUFBQTtLQUNBLE9BQUEsVUFBQSxJQUFBOzs7OztFQUtBLFFBQUEsS0FBQSxVQUFBLEdBQUEsU0FBQSxTQUFBLEdBQUE7R0FDQSxFQUFBOzs7RUFHQSxNQUFBLE9BQUEsNkJBQUEsV0FBQTtHQUNBLElBQUEsVUFBQSxRQUFBLEdBQUEsY0FBQTtHQUNBLElBQUEsU0FBQTtJQUNBO0lBQ0EsUUFBQSxVQUFBLElBQUE7Ozs7RUFJQSxTQUFBLGNBQUE7R0FDQSxRQUFBLEtBQUEsV0FBQSxZQUFBOzs7RUFHQSxTQUFBLGNBQUEsTUFBQTtHQUNBLElBQUEsZ0JBQUE7R0FDQSxPQUFBLFFBQUEsU0FBQSxRQUFBLElBQUE7SUFDQSxJQUFBLEtBQUEsYUFBQSxtQkFBQTtLQUNBLGdCQUFBOztJQUVBLElBQUEsaUJBQUEsS0FBQSxhQUFBLFdBQUE7S0FDQSxPQUFBOztJQUVBLE9BQUEsS0FBQTs7R0FFQSxPQUFBOzs7O0FDbERBO0VBQ0EsT0FBQTtFQUNBLFFBQUEsY0FBQTs7QUFFQSxTQUFBLGFBQUE7O0NBRUEsSUFBQSxhQUFBLFdBQUE7RUFDQSxLQUFBLFFBQUE7RUFDQSxLQUFBLE9BQUE7OztDQUdBLE9BQUE7OztBQ1hBO0VBQ0EsT0FBQTtFQUNBLFFBQUEsY0FBQTs7QUFFQSxTQUFBLFdBQUEsWUFBQTs7Q0FFQSxJQUFBLGFBQUEsU0FBQSxJQUFBLE1BQUE7RUFDQSxLQUFBLEtBQUE7RUFDQSxLQUFBLE9BQUE7RUFDQSxLQUFBLFFBQUE7RUFDQSxLQUFBLFVBQUE7OztDQUdBLFNBQUEsVUFBQTtFQUNBLEtBQUEsTUFBQSxRQUFBLElBQUE7OztDQUdBLE9BQUE7Ozs7QUNqQkE7RUFDQSxPQUFBO0VBQ0EsUUFBQSxtQkFBQTs7QUFFQSxTQUFBLGdCQUFBLFlBQUE7O0NBRUEsSUFBQSxRQUFBOztDQUVBLE9BQUE7RUFDQSxLQUFBO0VBQ0EsT0FBQTs7O0NBR0EsU0FBQSxNQUFBO0VBQ0EsTUFBQTtHQUNBLElBQUEsV0FBQSxhQUFBLGFBQUEsTUFBQSxPQUFBOzs7O0NBSUEsU0FBQSxZQUFBO0VBQ0EsSUFBQSxTQUFBO0VBQ0EsT0FBQSxDQUFBLEtBQUEsTUFBQSxLQUFBLFNBQUEsS0FBQSxJQUFBLEdBQUEsU0FBQSxTQUFBLEtBQUEsTUFBQSxDQUFBOzs7eUNBRUEiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nTWF0ZXJpYWwnXSk7XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdCYXNrZXRDb250cm9sbGVyJywgQmFza2V0Q29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEJhc2tldENvbnRyb2xsZXIoJHNjb3BlKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cblx0JHNjb3BlLiRvbihcImN1cnJlbnRMaXN0Q2hhbmdlZFwiLCBmdW5jdGlvbihldmVudCwgYXJncykge1xuXHRcdCRzY29wZS4kYXBwbHkodm0uY3VycmVudExpc3QgPSBhcmdzLmxpc3QpO1xuXHR9KTtcbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1zQ29udHJvbGxlcicsIEl0ZW1zQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1zQ29udHJvbGxlcigkc2NvcGUpIHtcblx0dmFyIHZtID0gdGhpcztcblxuXHR2bS5hZGRJdGVtID0gYWRkSXRlbTtcblx0dm0uZ2V0Q3VycmVudExpc3QgPSBmdW5jdGlvbigpIHsgcmV0dXJuIG1haW4uY3VycmVudExpc3Q7IH07XG5cblxuXHR2YXIgbWFpbiA9ICRzY29wZS5NYWluO1xuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0dm0uZ2V0Q3VycmVudExpc3QoKS5hZGRJdGVtKCk7XG5cdH1cblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0xpc3RzQ29udHJvbGxlcicsIExpc3RzQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIExpc3RzQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblx0XG5cdHRoaXMubGlzdHMgPSBhbGxMaXN0c1NlcnZpY2UubGlzdHM7XG5cblx0dGhpcy5hZGRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmFkZDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtJdGVtJywgYmtJdGVtKTtcblxuZnVuY3Rpb24gYmtJdGVtKCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0dGVtcGxhdGVVcmw6ICcuL3RlbXBsYXRlcy9ia0l0ZW0uaHRtbCdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdH1cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5kaXJlY3RpdmUoJ2JrTGlzdEluZm8nLCBia0xpc3RJbmZvKTtcblxuZnVuY3Rpb24gYmtMaXN0SW5mbygpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHRcdHRyYW5zY2x1ZGU6IHRydWUsXG5cdFx0dGVtcGxhdGU6IFtcblx0XHRcdFx0JzxkaXYgbmctdHJhbnNjbHVkZT4nLFxuXHRcdFx0XHQnPC9kaXY+J1xuXHRcdFx0XS5qb2luKCcnKVxuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG5cdFx0XHRzY29wZS4kZW1pdChcImN1cnJlbnRMaXN0Q2hhbmdlZFwiLCB7IGxpc3Q6IHNjb3BlLmxpc3QgfSk7XG5cdFx0fSk7XG5cdH1cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5kaXJlY3RpdmUoJ2JrTGlzdFZpZXcnLCBia0xpc3RWaWV3KTtcblxuZnVuY3Rpb24gYmtMaXN0VmlldygpIHtcblx0dmFyIGRpcmVjdGl2ZSA9IHtcblx0XHRyZXN0cmljdDogJ0VBJyxcblx0XHRsaW5rOiBsaW5rLFxuXHR9O1xuXG5cdHJldHVybiBkaXJlY3RpdmU7XG5cblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRpZiAoZS50YXJnZXQpIHtcblx0XHRcdFx0dmFyIGJrSXRlbSA9IGlzQmtJdGVtQ2hpbGQoZS50YXJnZXQpO1xuXHRcdFx0XHRpZiAoYmtJdGVtKSB7XG5cdFx0XHRcdFx0YmtJdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9KVxuXG5cdFx0c2NvcGUuJHdhdGNoKCdNYWluLmN1cnJlbnRMaXN0Lml0ZW1zWzBdJywgZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbmV3SXRlbSA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYmstaXRlbScpO1xuXHRcdFx0aWYgKG5ld0l0ZW0pIHtcblx0XHRcdFx0ZGVzZWxlY3RBbGwoKTtcblx0XHRcdFx0bmV3SXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3RBbGwoKSB7XG5cdFx0XHRlbGVtZW50LmZpbmQoJ2JrLWl0ZW0nKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlXCIpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGlzQmtJdGVtQ2hpbGQobm9kZSkge1xuXHRcdFx0dmFyIGlzQ2FyZENvbnRlbnQgPSBmYWxzZTtcblx0XHRcdHdoaWxlIChub2RlICYmIG5vZGUgIT09IGVsZW1lbnRbMF0pIHtcblx0XHRcdFx0aWYgKG5vZGUubm9kZU5hbWUgPT09ICdNRC1DQVJELUNPTlRFTlQnKSB7XG5cdFx0XHRcdFx0aXNDYXJkQ29udGVudCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGlzQ2FyZENvbnRlbnQgJiYgbm9kZS5ub2RlTmFtZSA9PT0gJ0JLLUlURU0nKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5vZGU7XG5cdFx0XHRcdH1cblx0XHRcdFx0bm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdJdGVtT2JqZWN0JywgSXRlbU9iamVjdCk7XG5cbmZ1bmN0aW9uIEl0ZW1PYmplY3QoKSB7XG5cblx0dmFyIGl0ZW1PYmplY3QgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRpdGxlID0gJyc7XG5cdFx0dGhpcy5ub3RlID0gJyc7XG5cdH1cblxuXHRyZXR1cm4gaXRlbU9iamVjdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0xpc3RPYmplY3QnLCBMaXN0T2JqZWN0KTtcblxuZnVuY3Rpb24gTGlzdE9iamVjdChJdGVtT2JqZWN0KSB7XG5cblx0dmFyIGxpc3RPYmplY3QgPSBmdW5jdGlvbihpZCwgbmFtZSkge1xuXHRcdHRoaXMuaWQgPSBpZDtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuaXRlbXMgPSBbXTtcblx0XHR0aGlzLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHR9XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHR0aGlzLml0ZW1zLnVuc2hpZnQobmV3IEl0ZW1PYmplY3QoKSk7XG5cdH1cblxuXHRyZXR1cm4gbGlzdE9iamVjdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ2FsbExpc3RzU2VydmljZScsIGFsbExpc3RzU2VydmljZSk7XG5cbmZ1bmN0aW9uIGFsbExpc3RzU2VydmljZShMaXN0T2JqZWN0KSB7XG5cblx0dmFyIGxpc3RzID0gW107XG5cblx0cmV0dXJuIHtcblx0XHRhZGQ6IGFkZCxcblx0XHRsaXN0czogbGlzdHNcblx0fTtcblxuXHRmdW5jdGlvbiBhZGQoKSB7XG5cdFx0bGlzdHMucHVzaChcblx0XHRcdG5ldyBMaXN0T2JqZWN0KGdldFVuaXFJZCgpLCBcIk5ldyBMaXN0IFwiKyhsaXN0cy5sZW5ndGgrMSkpXG5cdFx0KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFVuaXFJZCgpIHtcblx0XHR2YXIgbGVuZ3RoID0gODtcblx0XHRyZXR1cm4gKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpNYXRoLnBvdygzNixsZW5ndGgpKS50b1N0cmluZygzNikpLnNsaWNlKC1sZW5ndGgpO1xuXHR9XG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9