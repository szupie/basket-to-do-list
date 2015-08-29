var app = angular.module('app', ['ngMaterial']);

angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($mdSidenav, $mdMedia, allListsService, $mdToast) {
	var vm = this;
	vm.toggleListsView = toggleListsView;
	vm.closeListsView = closeListsView;
	vm.deleteListById = deleteListById;

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

	var deleteId;
	function deleteListById(id) {
		// show undo toast
		var deleteToast = $mdToast.simple().content('List Deleted').action('Undo').highlightAction(true);
		$mdToast.show(deleteToast).then(function(response) {
			if (response === 'ok') {
				undoDelete();
			}
		});
		// perform delete
		allListsService.deleteList(id).then(function() {
			$mdToast.hide();
		});
		// hide currently editing list
		$mdSidenav('left').open();
	}

	function undoDelete() {
		allListsService.cancelDelete();
	}
}
BasketController.$inject = ["$mdSidenav", "$mdMedia", "allListsService", "$mdToast"];

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

	var vm = this;
	
	vm.lists = allListsService.lists;

	vm.addList = function() {
		allListsService.setCurrentList(allListsService.add());
	};

	vm.currentList = allListsService.getCurrentList;

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

function allListsService(ListObject, $q) {

	var lists = [];
	var currentListId = undefined;
	var deleteTimer;
	var deleteDefer;
	var deletingId;

	return {
		add: add,
		lists: lists,
		setCurrentList: setCurrentList,
		getCurrentList: getCurrentList,
		deleteList: deleteList,
		cancelDelete: cancelDelete
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

	function findListIndexById(id) {
		for (var i=0; i<lists.length; i++) {
			if (lists[i].id === id) {
				return i;
			}
		}
	}

	function deleteList(id) {
		// Set list status for deletion
		var index = findListIndexById(id);
		if (index >= 0) {
			lists[index].deleting = true;
			currentListId = '';
		}
		// delete delay
		deletingId = id;
		deleteDefer = $q.defer();
		deleteTimer = setTimeout(function() {
			// get index again, as it may have changed
			var index = findListIndexById(id);
			if (index >= 0) {
				lists.splice(index, 1);
				deleteDefer.resolve('deleted');
			} else {
				deleteDefer.reject('listNotFound');
			}
		}, 5000);
		return deleteDefer.promise;
	}

	function cancelDelete() {
		clearTimeout(deleteTimer);
		var index = findListIndexById(deletingId);
		if (index >= 0) {
			lists[index].deleting = false;
		}
		deleteDefer.reject('deleteCancelled');
	}

	function setCurrentList(list) {
		if (typeof list === 'number') {
			currentListId = findListIndexById(list);
		} else if (typeof list === 'object') {
			currentListId = list.id;
		} else {
			console.warn('unknown input for list: '+ typeof list);
			console.warn(list);
		}
	}

	function getCurrentList() {
		try {
			return lists[findListIndexById(currentListId)];
		} catch(e) {
			console.warn('List not found. ID: '+currentListId);
			console.warn(lists);
			return false;
		}
	}
}
allListsService.$inject = ["ListObject", "$q"];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0l0ZW1zQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL0xpc3RzQ29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvYmtJdGVtLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RJbmZvLmpzIiwiZGlyZWN0aXZlcy9ia0xpc3RWaWV3LmpzIiwic2VydmljZXMvSXRlbU9iamVjdC5qcyIsInNlcnZpY2VzL0xpc3RPYmplY3QuanMiLCJzZXJ2aWNlcy9hbGxMaXN0c1NlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxNQUFNLFFBQVEsT0FBTyxPQUFPLENBQUM7QUFDakM7QUNEQTtFQUNFLE9BQU87RUFDUCxXQUFXLG9CQUFvQjs7QUFFakMsU0FBUyxpQkFBaUIsWUFBWSxVQUFVLGlCQUFpQixVQUFVO0NBQzFFLElBQUksS0FBSztDQUNULEdBQUcsa0JBQWtCO0NBQ3JCLEdBQUcsaUJBQWlCO0NBQ3BCLEdBQUcsaUJBQWlCOztDQUVwQixHQUFHLFdBQVc7Q0FDZCxJQUFJLENBQUMsR0FBRyxTQUFTLE9BQU87RUFDdkIsR0FBRyxnQkFBZ0I7OztDQUdwQixTQUFTLGtCQUFrQjtFQUMxQixXQUFXLFFBQVE7OztDQUdwQixTQUFTLGlCQUFpQjtFQUN6QixXQUFXLFFBQVE7OztDQUdwQixJQUFJO0NBQ0osU0FBUyxlQUFlLElBQUk7O0VBRTNCLElBQUksY0FBYyxTQUFTLFNBQVMsUUFBUSxnQkFBZ0IsT0FBTyxRQUFRLGdCQUFnQjtFQUMzRixTQUFTLEtBQUssYUFBYSxLQUFLLFNBQVMsVUFBVTtHQUNsRCxJQUFJLGFBQWEsTUFBTTtJQUN0Qjs7OztFQUlGLGdCQUFnQixXQUFXLElBQUksS0FBSyxXQUFXO0dBQzlDLFNBQVM7OztFQUdWLFdBQVcsUUFBUTs7O0NBR3BCLFNBQVMsYUFBYTtF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QUFrQjtTQUM1QixJQUFJLE9BQU8sU0FBUyxVQUFVO0dBQ3BDLGdCQUFnQixLQUFLO1NBQ2Y7R0FDTixRQUFRLEtBQUssNEJBQTRCLE9BQU87R0FDaEQsUUFBUSxLQUFLOzs7O0NBSWYsU0FBUyxpQkFBaUI7RUFDekIsSUFBSTtHQUNILE9BQU8sTUFBTSxrQkFBa0I7SUFDOUIsTUFBTSxHQUFHO0dBQ1YsUUFBUSxLQUFLLHVCQUF1QjtHQUNwQyxRQUFRLEtBQUs7R0FDYixPQUFPOzs7OytDQUdUIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyduZ01hdGVyaWFsJ10pO1xuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuY29udHJvbGxlcignQmFza2V0Q29udHJvbGxlcicsIEJhc2tldENvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBCYXNrZXRDb250cm9sbGVyKCRtZFNpZGVuYXYsICRtZE1lZGlhLCBhbGxMaXN0c1NlcnZpY2UsICRtZFRvYXN0KSB7XG5cdHZhciB2bSA9IHRoaXM7XG5cdHZtLnRvZ2dsZUxpc3RzVmlldyA9IHRvZ2dsZUxpc3RzVmlldztcblx0dm0uY2xvc2VMaXN0c1ZpZXcgPSBjbG9zZUxpc3RzVmlldztcblx0dm0uZGVsZXRlTGlzdEJ5SWQgPSBkZWxldGVMaXN0QnlJZDtcblxuXHR2bS4kbWRNZWRpYSA9ICRtZE1lZGlhO1xuXHRpZiAoIXZtLiRtZE1lZGlhKCdsZycpKSB7XG5cdFx0dm0ubGlzdHNWaWV3T3BlbiA9IHRydWU7XG5cdH1cblxuXHRmdW5jdGlvbiB0b2dnbGVMaXN0c1ZpZXcoKSB7XG5cdFx0JG1kU2lkZW5hdignbGVmdCcpLnRvZ2dsZSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2xvc2VMaXN0c1ZpZXcoKSB7XG5cdFx0JG1kU2lkZW5hdignbGVmdCcpLmNsb3NlKCk7XG5cdH1cblxuXHR2YXIgZGVsZXRlSWQ7XG5cdGZ1bmN0aW9uIGRlbGV0ZUxpc3RCeUlkKGlkKSB7XG5cdFx0Ly8gc2hvdyB1bmRvIHRvYXN0XG5cdFx0dmFyIGRlbGV0ZVRvYXN0ID0gJG1kVG9hc3Quc2ltcGxlKCkuY29udGVudCgnTGlzdCBEZWxldGVkJykuYWN0aW9uKCdVbmRvJykuaGlnaGxpZ2h0QWN0aW9uKHRydWUpO1xuXHRcdCRtZFRvYXN0LnNob3coZGVsZXRlVG9hc3QpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZSA9PT0gJ29rJykge1xuXHRcdFx0XHR1bmRvRGVsZXRlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcGVyZm9ybSBkZWxldGVcblx0XHRhbGxMaXN0c1NlcnZpY2UuZGVsZXRlTGlzdChpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRtZFRvYXN0LmhpZGUoKTtcblx0XHR9KTtcblx0XHQvLyBoaWRlIGN1cnJlbnRseSBlZGl0aW5nIGxpc3Rcblx0XHQkbWRTaWRlbmF2KCdsZWZ0Jykub3BlbigpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdW5kb0RlbGV0ZSgpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2UuY2FuY2VsRGVsZXRlKCk7XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1Db250cm9sbGVyJywgSXRlbUNvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBJdGVtQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblx0dmFyIHZtID0gdGhpcztcblx0dm0uZmFiSXNPcGVuID0gZmFsc2U7XG5cdHZtLnNlYXJjaE5hbWUgPSBzZWFyY2hOYW1lO1xuXG5cdGZ1bmN0aW9uIHNlYXJjaE5hbWUocXVlcnkpIHtcblx0XHR2YXIgYWxsSXRlbXMgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKS5pdGVtcztcblx0XHR2YXIgbmFtZXMgPSBbcXVlcnldO1xuXHRcdC8vIGdldCBsaXN0IG9mIGFsbCB1bmlxdWUgbmFtZXNcblx0XHRmb3IgKHZhciBpPTA7IGk8YWxsSXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBuYW1lID0gYWxsSXRlbXNbaV0uYXNzaWduO1xuXHRcdFx0aWYgKG5hbWUgJiYgbmFtZXMuaW5kZXhPZihuYW1lKSA8IDApIHsgLy8gaWYgbmFtZSBpc24ndCBhbHJlYWR5IGluIGxpc3Rcblx0XHRcdFx0bmFtZXMucHVzaChuYW1lKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Y29uc29sZS5sb2cobmFtZXMpO1xuXHRcdC8vIGZpbmQgbWF0Y2hlZCBuYW1lc1xuXHRcdHZhciBtYXRjaGVzID0gbmFtZXMuZmlsdGVyKGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRcdHJldHVybiBuYW1lLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihxdWVyeS50b0xvd2VyQ2FzZSgpKSA9PT0gMDtcblx0XHR9KTtcblx0XHRyZXR1cm4gbWF0Y2hlcztcblx0fVxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1zQ29udHJvbGxlcicsIEl0ZW1zQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1zQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblx0dmFyIHZtID0gdGhpcztcblxuXHR2bS5hZGRJdGVtID0gYWRkSXRlbTtcblx0dm0uZ2V0Q3VycmVudExpc3QgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3Q7XG5cblx0ZnVuY3Rpb24gYWRkSXRlbSgpIHtcblx0XHRpZiAoIWFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpKSB7XG5cdFx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0XHR9XG5cdFx0dm0uZ2V0Q3VycmVudExpc3QoKS5hZGRJdGVtKCk7XG5cdH1cblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0xpc3RzQ29udHJvbGxlcicsIExpc3RzQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIExpc3RzQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UpIHtcblxuXHR2YXIgdm0gPSB0aGlzO1xuXHRcblx0dm0ubGlzdHMgPSBhbGxMaXN0c1NlcnZpY2UubGlzdHM7XG5cblx0dm0uYWRkTGlzdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5zZXRDdXJyZW50TGlzdChhbGxMaXN0c1NlcnZpY2UuYWRkKCkpO1xuXHR9O1xuXG5cdHZtLmN1cnJlbnRMaXN0ID0gYWxsTGlzdHNTZXJ2aWNlLmdldEN1cnJlbnRMaXN0O1xuXG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0l0ZW0nLCBia0l0ZW0pO1xuXG5mdW5jdGlvbiBia0l0ZW0oKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrSXRlbS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnSXRlbUNvbnRyb2xsZXInLFxuXHRcdGNvbnRyb2xsZXJBczogJ0l0ZW0nXG5cdH07XG5cblx0cmV0dXJuIGRpcmVjdGl2ZTtcblxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdC8vIEVuZCBjdXN0b20gZWRpdCBtb2RlIG9uIGNsaWNrXG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuXHRcdFx0ZGVzZWxlY3QoKTtcblx0XHR9KTtcblxuXHRcdHZhciBsaXN0VmlldyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tiay1saXN0LXZpZXddJyk7XG5cdFx0dmFyIGFzc2lnbklucHV0O1xuXG5cdFx0Ly8gRW50ZXIgYXNzaWduIG1vZGVcblx0XHRmdW5jdGlvbiBlbnRlckFzc2lnbk1vZGUoKSB7XG5cdFx0XHRlbGVtZW50LmFkZENsYXNzKFwiZWRpdGFibGUgZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0XHRhc3NpZ25JbnB1dC5zZWxlY3QoKTsgLy8gaU9TIGZpeFxuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHsgYXNzaWduSW5wdXQuZm9jdXMoKTsgfSwgMTAwKTsgLy8gZGVsYXkgdG8gd2FpdCBmb3IgY2xhc3NlcyB0byBhcHBseVxuXHRcdFx0bGlzdFZpZXcuY2xhc3NMaXN0LmFkZChcImhhc0VkaXRhYmxlSXRlbVwiKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly8gUmVhdHRhY2ggbGlzdGVuZXIgdG8gYnV0dG9ucyBvbiBzY3JlZW4gc2l6ZSBjaGFuZ2Vcblx0XHR2YXIgYXNzaWduQnV0dG9uID0gZ2V0QXNzaWduQnV0dG9uKCk7XG5cdFx0c2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gc2NvcGUuTWFpbi4kbWRNZWRpYSgnbWQnKTsgfSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoYXNzaWduQnV0dG9uKSB7XG5cdFx0XHRcdGFzc2lnbkJ1dHRvbi5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIGVudGVyQXNzaWduTW9kZSk7XG5cdFx0XHR9XG5cdFx0XHRhc3NpZ25CdXR0b24gPSBnZXRBc3NpZ25CdXR0b24oKTtcblx0XHRcdGlmIChhc3NpZ25CdXR0b24pIHtcblx0XHRcdFx0YXNzaWduQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJBc3NpZ25Nb2RlKTtcblx0XHRcdH1cblx0XHRcdC8vIFByZXZlbnQgZW5kaW5nIGVkaXQgbW9kZSB3aGVuIGNsaWNraW5nIGJ1dHRvblxuXHRcdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHR9KTtcblx0XHRcdC8vIGlPUyBmaXggdG8gZGVzZWxlY3QgYnV0dG9uXG5cdFx0XHRlbGVtZW50LmZpbmQoJ2J1dHRvbicpLm9uKCd0b3VjaHN0YXJ0JywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Ly8gVG9nZ2xlIGl0ZW0gZG9uZW5lc3Ncblx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5kb25lJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdGVsZW1lbnQudG9nZ2xlQ2xhc3MoXCJkb25lXCIpLnJlbW92ZUNsYXNzKFwiZWRpdGFibGVcIik7XG5cdFx0XHRsaXN0Vmlldy5jbGFzc0xpc3QucmVtb3ZlKFwiaGFzRWRpdGFibGVJdGVtXCIpO1xuXHRcdFx0ZGVzZWxlY3QoKTtcblx0XHR9KTtcblxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBEZWxheSBxdWVyeWluZyBmb3IgaW5wdXQgdW50aWwgZWxlbWVudCBjcmVhdGVkXG5cdFx0XHRhc3NpZ25JbnB1dCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignbWQtYXV0b2NvbXBsZXRlLmFzc2lnbiBpbnB1dCcpO1xuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gc2VsZWN0aW5nIGlucHV0XG5cdFx0XHRlbGVtZW50LmZpbmQoJ21kLWlucHV0LWNvbnRhaW5lcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdH0sIDEwMCk7XG5cblx0XHQvLyBMZWF2ZSBjdXN0b20gZWRpdCBtb2RlXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3QoKSB7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKFwiZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ2V0QXNzaWduQnV0dG9uKCkge1xuXHRcdFx0cmV0dXJuIGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmFzc2lnbicpO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RJbmZvJywgYmtMaXN0SW5mbyk7XG5cbmZ1bmN0aW9uIGJrTGlzdEluZm8oYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrTGlzdEluZm8uaHRtbCdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHsgYWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KHNjb3BlLmxpc3QpIH0pO1xuXHRcdH0pO1xuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RWaWV3JywgYmtMaXN0Vmlldyk7XG5cbmZ1bmN0aW9uIGJrTGlzdFZpZXcoKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cblx0XHR2YXIgc3ViaGVhZGVyID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJyk7XG5cdFx0dmFyIHRpdGxlSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgaW5wdXQnKTtcblxuXHRcdC8vIENsaWNrIG91dHNpZGUgb2YgaXRlbXMgdG8gZXhpdCBlZGl0IG1vZGVcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRpZiAoZS50YXJnZXQpIHtcblx0XHRcdFx0dmFyIGJrSXRlbSA9IGlzQmtJdGVtQ2hpbGQoZS50YXJnZXQpO1xuXHRcdFx0XHRpZiAoYmtJdGVtKSB7XG5cdFx0XHRcdFx0bWFrZUl0ZW1FZGl0YWJsZShia0l0ZW0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBQcmV2ZW50IGxvc2luZyBmb2N1cyBvbiBidXR0b24gY2xpY2tzXG5cdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gTWFrZSB0aXRsZSBlZGl0YWJsZSBvbiBjbGlja1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlciAubmFtZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRtYWtlVGl0bGVFZGl0YWJsZSgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gRXhpdCB0aXRsZSBlZGl0IG1vZGUgb24gdGl0bGUgaW5wdXQgbG9zaW5nIGZvY3VzXG5cdFx0dGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXInKS5jbGFzc0xpc3QucmVtb3ZlKCdlZGl0YWJsZScpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gU3dpdGNoIGZvY3VzIHRvIG5ldyBpdGVtXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24ubmV3SXRlbScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIG5ld0l0ZW0gPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2JrLWl0ZW0nKTtcblx0XHRcdGlmIChuZXdJdGVtKSB7XG5cdFx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUobmV3SXRlbSk7XG5cdFx0XHRcdHZhciB0aXRsZSA9IG5ld0l0ZW0ucXVlcnlTZWxlY3RvcignLnRpdGxlIGlucHV0Jyk7XG5cdFx0XHRcdC8vIGZvY3VzIHRpdGxlIGZpZWxkIGJ5IGRlZmF1bHQ7IGRlbGF5IHRvIHdhaXQgZm9yIHN0eWxlIHRvIHRha2UgZWZmZWN0XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRpdGxlLmZvY3VzKCk7IH0sIDEwMCk7XG5cdFx0XHRcdHRpdGxlLnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRcdHdpbmRvdy5zY3JvbGwoMSwxKTsgLy8gaU9TIGZpeFxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gbWFrZVRpdGxlRWRpdGFibGUoKSB7XG5cdFx0XHRzdWJoZWFkZXIuY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdHRpdGxlSW5wdXQuZm9jdXMoKTtcblx0XHR9XG5cdFx0c2NvcGUubWFrZVRpdGxlRWRpdGFibGUgPSBtYWtlVGl0bGVFZGl0YWJsZTtcblxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuXHRcdFx0ZWxlbWVudC5maW5kKCdiay1pdGVtJykucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG1ha2VJdGVtRWRpdGFibGUoaXRlbSkge1xuXHRcdFx0aXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcygnaGFzRWRpdGFibGVJdGVtJyk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaXNCa0l0ZW1DaGlsZChub2RlKSB7XG5cdFx0XHR2YXIgaXNDYXJkQ29udGVudCA9IGZhbHNlO1xuXHRcdFx0d2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gZWxlbWVudFswXSkge1xuXHRcdFx0XHRpZiAobm9kZS5ub2RlTmFtZSA9PT0gJ01ELUNBUkQtQ09OVEVOVCcpIHtcblx0XHRcdFx0XHRpc0NhcmRDb250ZW50ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoaXNDYXJkQ29udGVudCAmJiBub2RlLm5vZGVOYW1lID09PSAnQkstSVRFTScpIHtcblx0XHRcdFx0XHRyZXR1cm4gbm9kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnSXRlbU9iamVjdCcsIEl0ZW1PYmplY3QpO1xuXG5mdW5jdGlvbiBJdGVtT2JqZWN0KCkge1xuXG5cdHZhciBpdGVtT2JqZWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50aXRsZSA9ICcnO1xuXHRcdHRoaXMubm90ZSA9ICcnO1xuXHRcdHRoaXMuYXNzaWduID0gJyc7XG5cdFx0dGhpcy5kb25lID0gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4gaXRlbU9iamVjdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0xpc3RPYmplY3QnLCBMaXN0T2JqZWN0KTtcblxuZnVuY3Rpb24gTGlzdE9iamVjdChJdGVtT2JqZWN0KSB7XG5cblx0dmFyIGxpc3RPYmplY3QgPSBmdW5jdGlvbihpZCwgbmFtZSkge1xuXHRcdHRoaXMuaWQgPSBpZDtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuaXRlbXMgPSBbXTtcblx0XHR0aGlzLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHRcdHRoaXMuZ2V0RGVzY3JpcHRpb24gPSBnZXREZXNjcmlwdGlvbjtcblx0fVxuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0dGhpcy5pdGVtcy51bnNoaWZ0KG5ldyBJdGVtT2JqZWN0KCkpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGVzY3JpcHRpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKCFpdGVtLmRvbmUpIHJldHVybiBpdGVtLnRpdGxlIH0pXG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9KS8vIGdldCBub24tZW1wdHkgaXRlbXNcblx0XHRcdFx0XHRcdC5qb2luKCcsICcpO1xuXHR9XG5cblx0cmV0dXJuIGxpc3RPYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdhbGxMaXN0c1NlcnZpY2UnLCBhbGxMaXN0c1NlcnZpY2UpO1xuXG5mdW5jdGlvbiBhbGxMaXN0c1NlcnZpY2UoTGlzdE9iamVjdCwgJHEpIHtcblxuXHR2YXIgbGlzdHMgPSBbXTtcblx0dmFyIGN1cnJlbnRMaXN0SWQgPSB1bmRlZmluZWQ7XG5cdHZhciBkZWxldGVUaW1lcjtcblx0dmFyIGRlbGV0ZURlZmVyO1xuXHR2YXIgZGVsZXRpbmdJZDtcblxuXHRyZXR1cm4ge1xuXHRcdGFkZDogYWRkLFxuXHRcdGxpc3RzOiBsaXN0cyxcblx0XHRzZXRDdXJyZW50TGlzdDogc2V0Q3VycmVudExpc3QsXG5cdFx0Z2V0Q3VycmVudExpc3Q6IGdldEN1cnJlbnRMaXN0LFxuXHRcdGRlbGV0ZUxpc3Q6IGRlbGV0ZUxpc3QsXG5cdFx0Y2FuY2VsRGVsZXRlOiBjYW5jZWxEZWxldGVcblx0fTtcblxuXHRmdW5jdGlvbiBhZGQoKSB7XG5cdFx0bGlzdHMudW5zaGlmdChcblx0XHRcdG5ldyBMaXN0T2JqZWN0KGdldFVuaXFJZCgpLCBcIk5ldyBMaXN0IFwiKyhsaXN0cy5sZW5ndGgrMSkpXG5cdFx0KTtcblx0XHRyZXR1cm4gbGlzdHNbMF07XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRVbmlxSWQoKSB7XG5cdFx0dmFyIGxlbmd0aCA9IDg7XG5cdFx0cmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqTWF0aC5wb3coMzYsbGVuZ3RoKSkudG9TdHJpbmcoMzYpKS5zbGljZSgtbGVuZ3RoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGZpbmRMaXN0SW5kZXhCeUlkKGlkKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPGxpc3RzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAobGlzdHNbaV0uaWQgPT09IGlkKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGRlbGV0ZUxpc3QoaWQpIHtcblx0XHQvLyBTZXQgbGlzdCBzdGF0dXMgZm9yIGRlbGV0aW9uXG5cdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoaWQpO1xuXHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRsaXN0c1tpbmRleF0uZGVsZXRpbmcgPSB0cnVlO1xuXHRcdFx0Y3VycmVudExpc3RJZCA9ICcnO1xuXHRcdH1cblx0XHQvLyBkZWxldGUgZGVsYXlcblx0XHRkZWxldGluZ0lkID0gaWQ7XG5cdFx0ZGVsZXRlRGVmZXIgPSAkcS5kZWZlcigpO1xuXHRcdGRlbGV0ZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdC8vIGdldCBpbmRleCBhZ2FpbiwgYXMgaXQgbWF5IGhhdmUgY2hhbmdlZFxuXHRcdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoaWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVzb2x2ZSgnZGVsZXRlZCcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdsaXN0Tm90Rm91bmQnKTtcblx0XHRcdH1cblx0XHR9LCA1MDAwKTtcblx0XHRyZXR1cm4gZGVsZXRlRGVmZXIucHJvbWlzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNhbmNlbERlbGV0ZSgpIHtcblx0XHRjbGVhclRpbWVvdXQoZGVsZXRlVGltZXIpO1xuXHRcdHZhciBpbmRleCA9IGZpbmRMaXN0SW5kZXhCeUlkKGRlbGV0aW5nSWQpO1xuXHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRsaXN0c1tpbmRleF0uZGVsZXRpbmcgPSBmYWxzZTtcblx0XHR9XG5cdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdkZWxldGVDYW5jZWxsZWQnKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNldEN1cnJlbnRMaXN0KGxpc3QpIHtcblx0XHRpZiAodHlwZW9mIGxpc3QgPT09ICdudW1iZXInKSB7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gZmluZExpc3RJbmRleEJ5SWQobGlzdCk7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgbGlzdCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGN1cnJlbnRMaXN0SWQgPSBsaXN0LmlkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ3Vua25vd24gaW5wdXQgZm9yIGxpc3Q6ICcrIHR5cGVvZiBsaXN0KTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRDdXJyZW50TGlzdCgpIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIGxpc3RzW2ZpbmRMaXN0SW5kZXhCeUlkKGN1cnJlbnRMaXN0SWQpXTtcblx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdGNvbnNvbGUud2FybignTGlzdCBub3QgZm91bmQuIElEOiAnK2N1cnJlbnRMaXN0SWQpO1xuXHRcdFx0Y29uc29sZS53YXJuKGxpc3RzKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=