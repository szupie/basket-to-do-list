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
