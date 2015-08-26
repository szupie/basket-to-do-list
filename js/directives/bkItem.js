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

		// Enter assign mode
		element[0].querySelector('.actions button.assign').addEventListener('click', function() {
			element.addClass("editable editing assign");
			element[0].querySelector('md-input-container.assign input').focus();
		});

		// Toggle item doneness
		element[0].querySelector('button.done').addEventListener('click', function() {
			element.toggleClass("done").removeClass("editable");
			deselect();
		});

		// Prevent ending edit mode when selecting input
		element.find('md-input-container').on('click', function(e) {
			e.stopPropagation();
		});
		// Prevent ending edit mode when clicking button
		element.find('button').on('click', function(e) {
			e.stopPropagation();
		});

		// Leave custom edit mode
		function deselect() {
			element.removeClass("editing assign");
		}
	}
}
