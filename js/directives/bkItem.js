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
			scope.$apply(function() { deselect(); });
		});


		element[0].querySelector('.actions button.assign').addEventListener('click', function() {
			changeEdit('assign');
			setTimeout(function(){ element[0].querySelector('.assign input').focus(); }, 100); // delay until element is shown
		});

		element.find('md-input-container').on('click', function(e) {
			e.stopPropagation();
		});
		element.find('button').on('click', function(e) {
			e.stopPropagation();
		});

		scope.$watch(function() { return element.attr('class'); },
			function() {
				if (!element.hasClass('editable')) {
					deselect();
				}
			}
		);

		function changeEdit(mode) {
			scope.Item.edit(mode);
		}

		function deselect() {
			scope.Item.deselect();
		}
	}
}