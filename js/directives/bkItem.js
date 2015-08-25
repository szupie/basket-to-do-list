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
