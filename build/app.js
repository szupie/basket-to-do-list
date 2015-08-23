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
	.factory('ItemObject', ItemObject);

function ItemObject() {

	var itemObject = function() {
		this.title = 'lol';
		this.note = 'wtf';
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
		this.items.push(new ItemObject());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9MaXN0c0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2JrTGlzdEluZm8uanMiLCJzZXJ2aWNlcy9JdGVtT2JqZWN0LmpzIiwic2VydmljZXMvTGlzdE9iamVjdC5qcyIsInNlcnZpY2VzL2FsbExpc3RzU2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFBLE1BQUEsUUFBQSxPQUFBLE9BQUEsQ0FBQTs7QUNBQTtFQUNBLE9BQUE7RUFDQSxXQUFBLG9CQUFBOztBQUVBLFNBQUEsaUJBQUEsUUFBQTtDQUNBLElBQUEsS0FBQTs7Q0FFQSxPQUFBLElBQUEsc0JBQUEsU0FBQSxPQUFBLE1BQUE7RUFDQSxPQUFBLE9BQUEsR0FBQSxjQUFBLEtBQUE7Ozs7O0FDUkE7RUFDQSxPQUFBO0VBQ0EsV0FBQSxtQkFBQTs7QUFFQSxTQUFBLGdCQUFBLFFBQUE7Q0FDQSxJQUFBLEtBQUE7O0NBRUEsR0FBQSxVQUFBO0NBQ0EsR0FBQSxpQkFBQSxXQUFBLEVBQUEsT0FBQSxLQUFBOzs7Q0FHQSxJQUFBLE9BQUEsT0FBQTs7Q0FFQSxTQUFBLFVBQUE7RUFDQSxHQUFBLGlCQUFBOzs7OztBQ2RBO0VBQ0EsT0FBQTtFQUNBLFdBQUEsbUJBQUE7O0FBRUEsU0FBQSxnQkFBQSxpQkFBQTs7Q0FFQSxLQUFBLFFBQUEsZ0JBQUE7O0NBRUEsS0FBQSxVQUFBLGdCQUFBOzs7O0FDUkE7RUFDQSxPQUFBO0VBQ0EsVUFBQSxjQUFBOztBQUVBLFNBQUEsYUFBQTtDQUNBLElBQUEsWUFBQTtFQUNBLFVBQUE7RUFDQSxNQUFBO0VBQ0EsWUFBQTtFQUNBLFVBQUE7SUFDQTtJQUNBO0tBQ0EsS0FBQTs7O0NBR0EsT0FBQTs7Q0FFQSxTQUFBLEtBQUEsT0FBQSxTQUFBLE9BQUE7RUFDQSxRQUFBLEdBQUEsU0FBQSxVQUFBO0dBQ0EsTUFBQSxNQUFBLHNCQUFBLEVBQUEsTUFBQSxNQUFBOzs7O0FDbkJBO0VBQ0EsT0FBQTtFQUNBLFFBQUEsY0FBQTs7QUFFQSxTQUFBLGFBQUE7O0NBRUEsSUFBQSxhQUFBLFdBQUE7RUFDQSxLQUFBLFFBQUE7RUFDQSxLQUFBLE9BQUE7OztDQUdBLE9BQUE7OztBQ1hBO0VBQ0EsT0FBQTtFQUNBLFFBQUEsY0FBQTs7QUFFQSxTQUFBLFdBQUEsWUFBQTs7Q0FFQSxJQUFBLGFBQUEsU0FBQSxJQUFBLE1BQUE7RUFDQSxLQUFBLEtBQUE7RUFDQSxLQUFBLE9BQUE7RUFDQSxLQUFBLFFBQUE7RUFDQSxLQUFBLFVBQUE7OztDQUdBLFNBQUEsVUFBQTtFQUNBLEtBQUEsTUFBQSxLQUFBLElBQUE7OztDQUdBLE9BQUE7Ozs7QUNqQkE7RUFDQSxPQUFBO0VBQ0EsUUFBQSxtQkFBQTs7QUFFQSxTQUFBLGdCQUFBLFlBQUE7O0NBRUEsSUFBQSxRQUFBOztDQUVBLE9BQUE7RUFDQSxLQUFBO0VBQ0EsT0FBQTs7O0NBR0EsU0FBQSxNQUFBO0VBQ0EsTUFBQTtHQUNBLElBQUEsV0FBQSxhQUFBLGFBQUEsTUFBQSxPQUFBOzs7O0NBSUEsU0FBQSxZQUFBO0VBQ0EsSUFBQSxTQUFBO0VBQ0EsT0FBQSxDQUFBLEtBQUEsTUFBQSxLQUFBLFNBQUEsS0FBQSxJQUFBLEdBQUEsU0FBQSxTQUFBLEtBQUEsTUFBQSxDQUFBOzs7eUNBRUEiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nTWF0ZXJpYWwnXSk7XG4iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdCYXNrZXRDb250cm9sbGVyJywgQmFza2V0Q29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEJhc2tldENvbnRyb2xsZXIoJHNjb3BlKSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cblx0JHNjb3BlLiRvbihcImN1cnJlbnRMaXN0Q2hhbmdlZFwiLCBmdW5jdGlvbihldmVudCwgYXJncykge1xuXHRcdCRzY29wZS4kYXBwbHkodm0uY3VycmVudExpc3QgPSBhcmdzLmxpc3QpO1xuXHR9KTtcbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1zQ29udHJvbGxlcicsIEl0ZW1zQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1zQ29udHJvbGxlcigkc2NvcGUpIHtcblx0dmFyIHZtID0gdGhpcztcblxuXHR2bS5hZGRJdGVtID0gYWRkSXRlbTtcblx0dm0uZ2V0Q3VycmVudExpc3QgPSBmdW5jdGlvbigpIHsgcmV0dXJuIG1haW4uY3VycmVudExpc3Q7IH07XG5cblxuXHR2YXIgbWFpbiA9ICRzY29wZS5NYWluO1xuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0dm0uZ2V0Q3VycmVudExpc3QoKS5hZGRJdGVtKCk7XG5cdH1cblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0xpc3RzQ29udHJvbGxlcicsIExpc3RzQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIExpc3RzQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblx0XG5cdHRoaXMubGlzdHMgPSBhbGxMaXN0c1NlcnZpY2UubGlzdHM7XG5cblx0dGhpcy5hZGRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmFkZDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtMaXN0SW5mbycsIGJrTGlzdEluZm8pO1xuXG5mdW5jdGlvbiBia0xpc3RJbmZvKCkge1xuXHR2YXIgZGlyZWN0aXZlID0ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLFxuXHRcdGxpbms6IGxpbmssXG5cdFx0dHJhbnNjbHVkZTogdHJ1ZSxcblx0XHR0ZW1wbGF0ZTogW1xuXHRcdFx0XHQnPGRpdiBuZy10cmFuc2NsdWRlPicsXG5cdFx0XHRcdCc8L2Rpdj4nXG5cdFx0XHRdLmpvaW4oJycpXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcblx0XHRcdHNjb3BlLiRlbWl0KFwiY3VycmVudExpc3RDaGFuZ2VkXCIsIHsgbGlzdDogc2NvcGUubGlzdCB9KTtcblx0XHR9KTtcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0l0ZW1PYmplY3QnLCBJdGVtT2JqZWN0KTtcblxuZnVuY3Rpb24gSXRlbU9iamVjdCgpIHtcblxuXHR2YXIgaXRlbU9iamVjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudGl0bGUgPSAnbG9sJztcblx0XHR0aGlzLm5vdGUgPSAnd3RmJztcblx0fVxuXG5cdHJldHVybiBpdGVtT2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnTGlzdE9iamVjdCcsIExpc3RPYmplY3QpO1xuXG5mdW5jdGlvbiBMaXN0T2JqZWN0KEl0ZW1PYmplY3QpIHtcblxuXHR2YXIgbGlzdE9iamVjdCA9IGZ1bmN0aW9uKGlkLCBuYW1lKSB7XG5cdFx0dGhpcy5pZCA9IGlkO1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0dGhpcy5pdGVtcyA9IFtdO1xuXHRcdHRoaXMuYWRkSXRlbSA9IGFkZEl0ZW07XG5cdH1cblxuXHRmdW5jdGlvbiBhZGRJdGVtKCkge1xuXHRcdHRoaXMuaXRlbXMucHVzaChuZXcgSXRlbU9iamVjdCgpKTtcblx0fVxuXG5cdHJldHVybiBsaXN0T2JqZWN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnYWxsTGlzdHNTZXJ2aWNlJywgYWxsTGlzdHNTZXJ2aWNlKTtcblxuZnVuY3Rpb24gYWxsTGlzdHNTZXJ2aWNlKExpc3RPYmplY3QpIHtcblxuXHR2YXIgbGlzdHMgPSBbXTtcblxuXHRyZXR1cm4ge1xuXHRcdGFkZDogYWRkLFxuXHRcdGxpc3RzOiBsaXN0c1xuXHR9O1xuXG5cdGZ1bmN0aW9uIGFkZCgpIHtcblx0XHRsaXN0cy5wdXNoKFxuXHRcdFx0bmV3IExpc3RPYmplY3QoZ2V0VW5pcUlkKCksIFwiTmV3IExpc3QgXCIrKGxpc3RzLmxlbmd0aCsxKSlcblx0XHQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0VW5pcUlkKCkge1xuXHRcdHZhciBsZW5ndGggPSA4O1xuXHRcdHJldHVybiAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKk1hdGgucG93KDM2LGxlbmd0aCkpLnRvU3RyaW5nKDM2KSkuc2xpY2UoLWxlbmd0aCk7XG5cdH1cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=