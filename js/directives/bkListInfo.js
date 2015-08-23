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