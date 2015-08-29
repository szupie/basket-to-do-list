var app = angular.module('app', ['ngMaterial']);

angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($mdSidenav, $mdMedia, $scope) {
	var vm = this;
	vm.toggleListsView = toggleListsView;
	vm.closeListsView = closeListsView;

	vm.$mdMedia = $mdMedia;
	if (!vm.$mdMedia('lg')) {
		vm.listsViewOpen = true;
	}

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

function ItemController(allListsService) {
	var vm = this;
	vm.fabIsOpen = false;
	vm.searchName = searchName;

	function searchName(query) {
		var allItems = allListsService.getCurrentList().items;
		var names = [query];
		// get list of all unique names
		for (var i=0; i<allItems.length; i++) {
			var name = allItems[i].assign;
			if (name && names.indexOf(name) < 0) { // if name isn't already in list
				names.push(name);
			}
		}
		console.log(names);
		// find matched names
		var matches = names.filter(function(name) {
			return name.toLowerCase().indexOf(query.toLowerCase()) === 0;
		});
		return matches;
	}
}
ItemController.$inject = ["allListsService"];
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
		var assignInput;

		// Enter assign mode
		function enterAssignMode() {
			element.addClass("editable editing assign");
			assignInput.select(); // iOS fix
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
			// iOS fix to deselect button
			element.find('button').on('touchstart', function(e) {
				document.activeElement.blur();
			});
		});

		// Toggle item doneness
		element[0].querySelector('button.done').addEventListener('click', function() {
			element.toggleClass("done").removeClass("editable");
			listView.classList.remove("hasEditableItem");
			deselect();
		});

		setTimeout(function() {
			// Delay querying for input until element created
			assignInput = element[0].querySelector('md-autocomplete.assign input');
			// Prevent ending edit mode when selecting input
			element.find('md-input-container').on('click', function(e) {
				e.stopPropagation();
			});
		}, 100);

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
		element[0].querySelector('button.newItem').addEventListener('click', function(e) {
			var newItem = element[0].querySelector('bk-item');
			if (newItem) {
				deselectAll();
				makeItemEditable(newItem);
				var title = newItem.querySelector('.title input');
				// focus title field by default; delay to wait for style to take effect
				setTimeout(function() { title.focus(); }, 100);
				title.select(); // iOS fix
				window.scroll(1,1); // iOS fix
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0l0ZW1zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0xpc3RzQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvYmtJdGVtLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RJbmZvLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RWaWV3LmpzIiwic2VydmljZXMvSXRlbU9iamVjdC5qcyIsInNlcnZpY2VzL0xpc3RPYmplY3QuanMiLCJzZXJ2aWNlcy9hbGxMaXN0c1NlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxNQUFNLFFBQVEsT0FBTyxPQUFPLENBQUM7QUFDakM7QUNEQTtFQUNFLE9BQU87RUFDUCxXQUFXLG9CQUFvQjs7QUFFakMsU0FBUyxpQkFBaUIsWUFBWSxVQUFVLFFBQVE7Q0FDdkQsSUFBSSxLQUFLO0NBQ1QsR0FBRyxrQkFBa0I7Q0FDckIsR0FBRyxpQkFBaUI7O0NBRXBCLEdBQUcsV0FBVztDQUNkLElBQUksQ0FBQyxHQUFHLFNBQVMsT0FBTztFQUN2QixHQUFHLGdCQUFnQjs7O0NBR3BCLFNBQVMsa0JBQWtCO0VBQzFCLFdBQVcsUUFBUTs7O0NBR3BCLFNBQVMsaUJBQWlCO0VBQ3pCLFdBQVcsUUFBUTs7OztBQUdyQjtBQ3RCQTtFQUNFLE9BQU87RUFDUCxXQUFXLGtCQUFrQjs7QUFFL0IsU0FBUyxlQUFlLGlCQUFpQjtDQUN4QyxJQUFJLEtBQUs7Q0FDVCxHQUFHLFlBQVk7Q0FDZixHQUFHLGFBQWE7O0NBRWhCLFNBQVMsV0FBVyxPQUFPO0VBQzFCLElBQUksV0FBVyxnQkFBZ0IsaUJBQWlCO0VBQ2hELElBQUksUUFBUSxDQUFDOztFQUViLEtBQUssSUFBSSxFQUFFLEdBQUcsRUFBRSxTQUFTLFFBQVEsS0FBSztHQUNyQyxJQUFJLE9BQU8sU0FBUyxHQUFHO0dB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TUFBTSxDQUFDOzs7Q0FHNUUsU0FBUyxhQUFhLElBQUk7RUFDekIsS0FBSyxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sUUFBUSxLQUFLO0dBQ2xDLElBQUksTUFBTSxPQUFPLElBQUk7SUFDcEIsT0FBTzs7Ozs7Q0FLVixTQUFTLGVBQWUsTUFBTTtFQUM3QixJQUFJLE9BQU8sU0FBUyxVQUFVO0dBQzdCLG1CQUFtQjtTQUNiLElBQUksT0FBTyxTQUFTLFVBQVU7R0FDcEMsbUJBQW1CLE1BQU0sUUFBUTtTQUMzQjtHQUNOLFFBQVEsS0FBSyw0QkFBNEIsT0FBTztHQUNoRCxRQUFRLEtBQUs7Ozs7Q0FJZixTQUFTLGlCQUFpQjtFQUN6QixJQUFJO0dBQ0gsT0FBTyxNQUFNO0lBQ1osTUFBTSxHQUFHO0dBQ1YsUUFBUSxLQUFLLDBCQUEwQjtHQUN2QyxRQUFRLEtBQUs7R0FDYixPQUFPOzs7O3lDQUdUIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyduZ01hdGVyaWFsJ10pO1xuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignQmFza2V0Q29udHJvbGxlcicsIEJhc2tldENvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBCYXNrZXRDb250cm9sbGVyKCRtZFNpZGVuYXYsICRtZE1lZGlhLCAkc2NvcGUpIHtcblx0dmFyIHZtID0gdGhpcztcblx0dm0udG9nZ2xlTGlzdHNWaWV3ID0gdG9nZ2xlTGlzdHNWaWV3O1xuXHR2bS5jbG9zZUxpc3RzVmlldyA9IGNsb3NlTGlzdHNWaWV3O1xuXG5cdHZtLiRtZE1lZGlhID0gJG1kTWVkaWE7XG5cdGlmICghdm0uJG1kTWVkaWEoJ2xnJykpIHtcblx0XHR2bS5saXN0c1ZpZXdPcGVuID0gdHJ1ZTtcblx0fVxuXG5cdGZ1bmN0aW9uIHRvZ2dsZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykudG9nZ2xlKCk7XG5cdH1cblxuXHRmdW5jdGlvbiBjbG9zZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykuY2xvc2UoKTtcblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignSXRlbUNvbnRyb2xsZXInLCBJdGVtQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1Db250cm9sbGVyKGFsbExpc3RzU2VydmljZSkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXHR2bS5mYWJJc09wZW4gPSBmYWxzZTtcblx0dm0uc2VhcmNoTmFtZSA9IHNlYXJjaE5hbWU7XG5cblx0ZnVuY3Rpb24gc2VhcmNoTmFtZShxdWVyeSkge1xuXHRcdHZhciBhbGxJdGVtcyA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpLml0ZW1zO1xuXHRcdHZhciBuYW1lcyA9IFtxdWVyeV07XG5cdFx0Ly8gZ2V0IGxpc3Qgb2YgYWxsIHVuaXF1ZSBuYW1lc1xuXHRcdGZvciAodmFyIGk9MDsgaTxhbGxJdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIG5hbWUgPSBhbGxJdGVtc1tpXS5hc3NpZ247XG5cdFx0XHRpZiAobmFtZSAmJiBuYW1lcy5pbmRleE9mKG5hbWUpIDwgMCkgeyAvLyBpZiBuYW1lIGlzbid0IGFscmVhZHkgaW4gbGlzdFxuXHRcdFx0XHRuYW1lcy5wdXNoKG5hbWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRjb25zb2xlLmxvZyhuYW1lcyk7XG5cdFx0Ly8gZmluZCBtYXRjaGVkIG5hbWVzXG5cdFx0dmFyIG1hdGNoZXMgPSBuYW1lcy5maWx0ZXIoZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0cmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHF1ZXJ5LnRvTG93ZXJDYXNlKCkpID09PSAwO1xuXHRcdH0pO1xuXHRcdHJldHVybiBtYXRjaGVzO1xuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignSXRlbXNDb250cm9sbGVyJywgSXRlbXNDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gSXRlbXNDb250cm9sbGVyKGFsbExpc3RzU2VydmljZSkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXG5cdHZtLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHR2bS5nZXRDdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblxuXHRmdW5jdGlvbiBhZGRJdGVtKCkge1xuXHRcdGlmICghYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0KCkpIHtcblx0XHRcdGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChhbGxMaXN0c1NlcnZpY2UuYWRkKCkpO1xuXHRcdH1cblx0XHR2bS5nZXRDdXJyZW50TGlzdCgpLmFkZEl0ZW0oKTtcblx0fVxuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignTGlzdHNDb250cm9sbGVyJywgTGlzdHNDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gTGlzdHNDb250cm9sbGVyKGFsbExpc3RzU2VydmljZSkge1xuXHRcblx0dGhpcy5saXN0cyA9IGFsbExpc3RzU2VydmljZS5saXN0cztcblxuXHR0aGlzLmFkZExpc3QgPSBmdW5jdGlvbigpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0fTtcblxuXHR0aGlzLmN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0l0ZW0nLCBia0l0ZW0pO1xuXG5mdW5jdGlvbiBia0l0ZW0oKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrSXRlbS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnSXRlbUNvbnRyb2xsZXInLFxuXHRcdGNvbnRyb2xsZXJBczogJ0l0ZW0nXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdC8vIEVuZCBjdXN0b20gZWRpdCBtb2RlIG9uIGNsaWNrXG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0ZGVzZWxlY3QoKTtcblx0XHR9KTtcblxuXHRcdHZhciBsaXN0VmlldyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tiay1saXN0LXZpZXddJyk7XG5cdFx0dmFyIGFzc2lnbklucHV0O1xuXG5cdFx0Ly8gRW50ZXIgYXNzaWduIG1vZGVcblx0XHRmdW5jdGlvbiBlbnRlckFzc2lnbk1vZGUoKSB7XG5cdFx0XHRlbGVtZW50LmFkZENsYXNzKFwiZWRpdGFibGUgZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0XHRhc3NpZ25JbnB1dC5zZWxlY3QoKTsgLy8gaU9TIGZpeFxuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHsgYXNzaWduSW5wdXQuZm9jdXMoKTsgfSwgMTAwKTsgLy8gZGVsYXkgdG8gd2FpdCBmb3IgY2xhc3NlcyB0byBhcHBseVxuXHRcdFx0bGlzdFZpZXcuY2xhc3NMaXN0LmFkZChcImhhc0VkaXRhYmxlSXRlbVwiKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly8gUmVhdHRhY2ggbGlzdGVuZXIgdG8gYnV0dG9ucyBvbiBzY3JlZW4gc2l6ZSBjaGFuZ2Vcblx0XHR2YXIgYXNzaWduQnV0dG9uID0gZ2V0QXNzaWduQnV0dG9uKCk7XG5cdFx0c2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gc2NvcGUuTWFpbi4kbWRNZWRpYSgnbWQnKTsgfSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoYXNzaWduQnV0dG9uKSB7XG5cdFx0XHRcdGFzc2lnbkJ1dHRvbi5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIGVudGVyQXNzaWduTW9kZSk7XG5cdFx0XHR9XG5cdFx0XHRhc3NpZ25CdXR0b24gPSBnZXRBc3NpZ25CdXR0b24oKTtcblx0XHRcdGlmIChhc3NpZ25CdXR0b24pIHtcblx0XHRcdFx0YXNzaWduQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJBc3NpZ25Nb2RlKTtcblx0XHRcdH1cblx0XHRcdC8vIFByZXZlbnQgZW5kaW5nIGVkaXQgbW9kZSB3aGVuIGNsaWNraW5nIGJ1dHRvblxuXHRcdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHR9KTtcblx0XHRcdC8vIGlPUyBmaXggdG8gZGVzZWxlY3QgYnV0dG9uXG5cdFx0XHRlbGVtZW50LmZpbmQoJ2J1dHRvbicpLm9uKCd0b3VjaHN0YXJ0JywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Ly8gVG9nZ2xlIGl0ZW0gZG9uZW5lc3Ncblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5kb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnQudG9nZ2xlQ2xhc3MoXCJkb25lXCIpLnJlbW92ZUNsYXNzKFwiZWRpdGFibGVcIik7XG5cdFx0XHRsaXN0Vmlldy5jbGFzc0xpc3QucmVtb3ZlKFwiaGFzRWRpdGFibGVJdGVtXCIpO1xuXHRcdFx0ZGVzZWxlY3QoKTtcblx0XHR9KTtcblxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBEZWxheSBxdWVyeWluZyBmb3IgaW5wdXQgdW50aWwgZWxlbWVudCBjcmVhdGVkXG5cdFx0XHRhc3NpZ25JbnB1dCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignbWQtYXV0b2NvbXBsZXRlLmFzc2lnbiBpbnB1dCcpO1xuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gc2VsZWN0aW5nIGlucHV0XG5cdFx0XHRlbGVtZW50LmZpbmQoJ21kLWlucHV0LWNvbnRhaW5lcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdH0sIDEwMCk7XG5cblx0XHQvLyBMZWF2ZSBjdXN0b20gZWRpdCBtb2RlXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3QoKSB7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKFwiZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ2V0QXNzaWduQnV0dG9uKCkge1xuXHRcdFx0cmV0dXJuIGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmFzc2lnbicpO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RJbmZvJywgYmtMaXN0SW5mbyk7XG5cbmZ1bmN0aW9uIGJrTGlzdEluZm8oYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrTGlzdEluZm8uaHRtbCdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHsgYWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KHNjb3BlLmxpc3QpIH0pO1xuXHRcdH0pO1xuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RWaWV3JywgYmtMaXN0Vmlldyk7XG5cbmZ1bmN0aW9uIGJrTGlzdFZpZXcoKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cblx0XHR2YXIgc3ViaGVhZGVyID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJyk7XG5cdFx0dmFyIHRpdGxlSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgaW5wdXQnKTtcblxuXHRcdC8vIENsaWNrIG91dHNpZGUgb2YgaXRlbXMgdG8gZXhpdCBlZGl0IG1vZGVcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRpZiAoZS50YXJnZXQpIHtcblx0XHRcdFx0dmFyIGJrSXRlbSA9IGlzQmtJdGVtQ2hpbGQoZS50YXJnZXQpO1xuXHRcdFx0XHRpZiAoYmtJdGVtKSB7XG5cdFx0XHRcdFx0bWFrZUl0ZW1FZGl0YWJsZShia0l0ZW0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBQcmV2ZW50IGxvc2luZyBmb2N1cyBvbiBidXR0b24gY2xpY2tzXG5cdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gTWFrZSB0aXRsZSBlZGl0YWJsZSBvbiBjbGlja1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlciAubmFtZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRtYWtlVGl0bGVFZGl0YWJsZSgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gRXhpdCB0aXRsZSBlZGl0IG1vZGUgb24gdGl0bGUgaW5wdXQgbG9zaW5nIGZvY3VzXG5cdFx0dGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXInKS5jbGFzc0xpc3QucmVtb3ZlKCdlZGl0YWJsZScpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gU3dpdGNoIGZvY3VzIHRvIG5ldyBpdGVtXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24ubmV3SXRlbScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIG5ld0l0ZW0gPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2JrLWl0ZW0nKTtcblx0XHRcdGlmIChuZXdJdGVtKSB7XG5cdFx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUobmV3SXRlbSk7XG5cdFx0XHRcdHZhciB0aXRsZSA9IG5ld0l0ZW0ucXVlcnlTZWxlY3RvcignLnRpdGxlIGlucHV0Jyk7XG5cdFx0XHRcdC8vIGZvY3VzIHRpdGxlIGZpZWxkIGJ5IGRlZmF1bHQ7IGRlbGF5IHRvIHdhaXQgZm9yIHN0eWxlIHRvIHRha2UgZWZmZWN0XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRpdGxlLmZvY3VzKCk7IH0sIDEwMCk7XG5cdFx0XHRcdHRpdGxlLnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRcdHdpbmRvdy5zY3JvbGwoMSwxKTsgLy8gaU9TIGZpeFxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gbWFrZVRpdGxlRWRpdGFibGUoKSB7XG5cdFx0XHRzdWJoZWFkZXIuY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdHRpdGxlSW5wdXQuZm9jdXMoKTtcblx0XHR9XG5cdFx0c2NvcGUubWFrZVRpdGxlRWRpdGFibGUgPSBtYWtlVGl0bGVFZGl0YWJsZTtcblxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuXHRcdFx0ZWxlbWVudC5maW5kKCdiay1pdGVtJykucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG1ha2VJdGVtRWRpdGFibGUoaXRlbSkge1xuXHRcdFx0aXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcygnaGFzRWRpdGFibGVJdGVtJyk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaXNCa0l0ZW1DaGlsZChub2RlKSB7XG5cdFx0XHR2YXIgaXNDYXJkQ29udGVudCA9IGZhbHNlO1xuXHRcdFx0d2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gZWxlbWVudFswXSkge1xuXHRcdFx0XHRpZiAobm9kZS5ub2RlTmFtZSA9PT0gJ01ELUNBUkQtQ09OVEVOVCcpIHtcblx0XHRcdFx0XHRpc0NhcmRDb250ZW50ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoaXNDYXJkQ29udGVudCAmJiBub2RlLm5vZGVOYW1lID09PSAnQkstSVRFTScpIHtcblx0XHRcdFx0XHRyZXR1cm4gbm9kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnSXRlbU9iamVjdCcsIEl0ZW1PYmplY3QpO1xuXG5mdW5jdGlvbiBJdGVtT2JqZWN0KCkge1xuXG5cdHZhciBpdGVtT2JqZWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50aXRsZSA9ICcnO1xuXHRcdHRoaXMubm90ZSA9ICcnO1xuXHRcdHRoaXMuYXNzaWduID0gJyc7XG5cdFx0dGhpcy5kb25lID0gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4gaXRlbU9iamVjdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0xpc3RPYmplY3QnLCBMaXN0T2JqZWN0KTtcblxuZnVuY3Rpb24gTGlzdE9iamVjdChJdGVtT2JqZWN0KSB7XG5cblx0dmFyIGxpc3RPYmplY3QgPSBmdW5jdGlvbihpZCwgbmFtZSkge1xuXHRcdHRoaXMuaWQgPSBpZDtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuaXRlbXMgPSBbXTtcblx0XHR0aGlzLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHRcdHRoaXMuZ2V0RGVzY3JpcHRpb24gPSBnZXREZXNjcmlwdGlvbjtcblx0fVxuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0dGhpcy5pdGVtcy51bnNoaWZ0KG5ldyBJdGVtT2JqZWN0KCkpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGVzY3JpcHRpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKCFpdGVtLmRvbmUpIHJldHVybiBpdGVtLnRpdGxlIH0pXG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9KS8vIGdldCBub24tZW1wdHkgaXRlbXNcblx0XHRcdFx0XHRcdC5qb2luKCcsICcpO1xuXHR9XG5cblx0cmV0dXJuIGxpc3RPYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdhbGxMaXN0c1NlcnZpY2UnLCBhbGxMaXN0c1NlcnZpY2UpO1xuXG5mdW5jdGlvbiBhbGxMaXN0c1NlcnZpY2UoTGlzdE9iamVjdCkge1xuXG5cdHZhciBsaXN0cyA9IFtdO1xuXHR2YXIgY3VycmVudExpc3RJbmRleCA9IHVuZGVmaW5lZDtcblxuXHRyZXR1cm4ge1xuXHRcdGFkZDogYWRkLFxuXHRcdGxpc3RzOiBsaXN0cyxcblx0XHRjdXJyZW50TGlzdEluZGV4OiBjdXJyZW50TGlzdEluZGV4LFxuXHRcdHNldEN1cnJlbnRMaXN0OiBzZXRDdXJyZW50TGlzdCxcblx0XHRnZXRDdXJyZW50TGlzdDogZ2V0Q3VycmVudExpc3Rcblx0fTtcblxuXHRmdW5jdGlvbiBhZGQoKSB7XG5cdFx0bGlzdHMudW5zaGlmdChcblx0XHRcdG5ldyBMaXN0T2JqZWN0KGdldFVuaXFJZCgpLCBcIk5ldyBMaXN0IFwiKyhsaXN0cy5sZW5ndGgrMSkpXG5cdFx0KTtcblx0XHRyZXR1cm4gbGlzdHNbMF07XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRVbmlxSWQoKSB7XG5cdFx0dmFyIGxlbmd0aCA9IDg7XG5cdFx0cmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqTWF0aC5wb3coMzYsbGVuZ3RoKSkudG9TdHJpbmcoMzYpKS5zbGljZSgtbGVuZ3RoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGZpbmRMaXN0QnlJZChpZCkge1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKGxpc3RzLmlkID09PSBpZCkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDdXJyZW50TGlzdChsaXN0KSB7XG5cdFx0aWYgKHR5cGVvZiBsaXN0ID09PSAnbnVtYmVyJykge1xuXHRcdFx0Y3VycmVudExpc3RJbmRleCA9IGxpc3Q7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgbGlzdCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGN1cnJlbnRMaXN0SW5kZXggPSBsaXN0cy5pbmRleE9mKGxpc3QpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ3Vua25vd24gaW5wdXQgZm9yIGxpc3Q6ICcrIHR5cGVvZiBsaXN0KTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRDdXJyZW50TGlzdCgpIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIGxpc3RzW2N1cnJlbnRMaXN0SW5kZXhdO1xuXHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0Y29uc29sZS53YXJuKCdMaXN0IG5vdCBmb3VuZC4gSW5kZXg6ICcrY3VycmVudExpc3RJbmRleCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdHMpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==