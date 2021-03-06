angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($mdSidenav, $mdMedia, allListsService, $mdToast, support, $scope, $mdDialog, shareService) {
	var vm = this;
	vm.toggleListsView = toggleListsView;
	vm.closeListsView = closeListsView;
	vm.deleteListById = deleteListById;
	vm.shareList = shareList;
	vm.support = support;

	// load/save data
	allListsService.syncAll();
	setInterval(allListsService.syncAll, 5000);

	$scope.$on('firebaseSync', function() {
		$scope.$apply();
	});

	if (location.hash.substring(1).indexOf('list=') === 0) {
		allListsService.importList(location.hash.substring(6));
	}
	window.importBasketList = allListsService.importList;

	function shareList(list, e) {
		var link = shareService.getLink(list);
		var email = shareService.writeEmail(list);
		$mdDialog.show({
			templateUrl: './templates/shareDialog.html',
			locals: {
				url: link,
				email: email
			},
			clickOutsideToClose: true,
			targetEvent: e,
			controller: function($scope, url, email) {
				$scope.url = url;
				$scope.email = email;
			}
		});
	}

	// sidenav behaviour
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

	// Lists delete operations
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
