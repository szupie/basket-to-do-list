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