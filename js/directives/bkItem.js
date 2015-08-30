angular
	.module('app')
	.directive('bkItem', bkItem);

function bkItem($q) {
	var directive = {
		restrict: 'EA',
		link: link,
		templateUrl: './templates/bkItem.html',
		controller: 'ItemsController',
		controllerAs: 'Items'
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

		var photoInput = element[0].querySelector('input.photo');
		var fileDefer;
		var waitingInput = 0;
		function photoPrompt() {
			photoInput.click();
			photoInput.value = null;
			fileDefer = $q.defer();
			scope.Items.getPhoto(attrs.itemId, fileDefer.promise);
		}
		function photoPromptClose() {
			if (waitingInput > 0) {
				waitingInput = 0;
				fileDefer.notify('noImage');
			} else {
				waitingInput++;
				fileDefer.notify('getting');
			}
		}
		photoInput.addEventListener('change', function(e) {
			var file = e.target.files[0];
			waitingInput = 0;
			if (file) {
				var reader = new FileReader();
				reader.onloadend = function() {
					fileDefer.resolve(reader.result);
				}
				reader.readAsDataURL(file);
			}
		});

		// Toggle item doneness
		element[0].querySelector('button.done').addEventListener('click', function() {
			element.toggleClass("done").removeClass("editable");
			listView.classList.remove("hasEditableItem");
			deselect();
		});
		
		// Reattach listener to buttons on screen size change
		var assignButton = getAssignButton();
		var photoButton = getPhotoButton();
		scope.$watch(function() { return scope.Main.$mdMedia('md'); }, function() {
			if (assignButton) {
				assignButton.removeEventListener('click', enterAssignMode);
			}
			assignButton = getAssignButton();
			if (assignButton) {
				assignButton.addEventListener('click', enterAssignMode);
			}
			if (photoButton) {
				photoButton.removeEventListener('click', photoPrompt);
				document.removeEventListener("visibilitychange", photoPromptClose);
			}
			photoButton = getPhotoButton();
			if (photoButton) {
				photoButton.addEventListener('click', photoPrompt);
				document.addEventListener("visibilitychange", photoPromptClose);
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
		function getPhotoButton() {
			return element[0].querySelector('button.photo');
		}
	}
}
