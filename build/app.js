if (window.FileReader) {
	fileSupport = true;
}

var app = angular.module('app', ['ngMaterial'])
				.constant('support', {fileReader: fileSupport});
angular
	.module('app')
	.controller('BasketController', BasketController);

function BasketController($mdSidenav, $mdMedia, allListsService, $mdToast, support) {
	var vm = this;
	vm.toggleListsView = toggleListsView;
	vm.closeListsView = closeListsView;
	vm.deleteListById = deleteListById;
	vm.shareList = shareList;
	vm.support = support;

	// load/save data
	allListsService.localRetrieve();
	setInterval(allListsService.localSave, 5000);

	if (location.hash.substring(1).indexOf('import=') === 0) {
		allListsService.importList(location.hash.substring(8));
	}
	window.importBasketList = allListsService.importList;

	function shareList(id) {
		window.open(allListsService.emailList(id));
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
BasketController.$inject = ["$mdSidenav", "$mdMedia", "allListsService", "$mdToast", "support"];

angular
	.module('app')
	.controller('ItemsController', ItemsController);

function ItemsController(allListsService, $mdToast, $mdMedia) {
	var vm = this;

	vm.addItem = addItem;
	vm.getCurrentList = allListsService.getCurrentList;
	vm.deleteItem = deleteItem;
	vm.searchName = searchName;
	vm.getPhoto = getPhoto;

	function addItem() {
		if (!allListsService.getCurrentList()) {
			allListsService.setCurrentList(allListsService.add());
		}
		vm.getCurrentList().addItem();
	}

	function deleteItem(id) {
		// show undo toast
		var deleteToast = $mdToast.simple().content('Item Deleted').action('Undo').highlightAction(true);
		$mdToast.show(deleteToast).then(function(response) {
			if (response === 'ok') {
				undoDelete();
			}
		});
		// perform delete
		allListsService.deleteItem(id).then(function() {
			$mdToast.hide();
		});
	}

	function undoDelete() {
		allListsService.cancelDelete();
	}

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
		// find matched names
		var matches = names.filter(function(name) {
			return name.toLowerCase().indexOf(query.toLowerCase()) === 0;
		});
		return matches;
	}

	function getPhoto(id, promise) {
		var list = allListsService.getCurrentList();
		var index = list.getItemIndexById(id);
		var loadingIcon = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2032%2032%22%20width%3D%2232%22%20height%3D%2232%22%20fill%3D%22black%22%3E%0A%20%20%3Ccircle%20transform%3D%22translate%288%200%29%22%20cx%3D%220%22%20cy%3D%2216%22%20r%3D%220%22%3E%20%0A%20%20%20%20%3Canimate%20attributeName%3D%22r%22%20values%3D%220%3B%204%3B%200%3B%200%22%20dur%3D%221.2s%22%20repeatCount%3D%22indefinite%22%20begin%3D%220%22%0A%20%20%20%20%20%20keytimes%3D%220%3B0.2%3B0.7%3B1%22%20keySplines%3D%220.2%200.2%200.4%200.8%3B0.2%200.6%200.4%200.8%3B0.2%200.6%200.4%200.8%22%20calcMode%3D%22spline%22%20/%3E%0A%20%20%3C/circle%3E%0A%20%20%3Ccircle%20transform%3D%22translate%2816%200%29%22%20cx%3D%220%22%20cy%3D%2216%22%20r%3D%220%22%3E%20%0A%20%20%20%20%3Canimate%20attributeName%3D%22r%22%20values%3D%220%3B%204%3B%200%3B%200%22%20dur%3D%221.2s%22%20repeatCount%3D%22indefinite%22%20begin%3D%220.3%22%0A%20%20%20%20%20%20keytimes%3D%220%3B0.2%3B0.7%3B1%22%20keySplines%3D%220.2%200.2%200.4%200.8%3B0.2%200.6%200.4%200.8%3B0.2%200.6%200.4%200.8%22%20calcMode%3D%22spline%22%20/%3E%0A%20%20%3C/circle%3E%0A%20%20%3Ccircle%20transform%3D%22translate%2824%200%29%22%20cx%3D%220%22%20cy%3D%2216%22%20r%3D%220%22%3E%20%0A%20%20%20%20%3Canimate%20attributeName%3D%22r%22%20values%3D%220%3B%204%3B%200%3B%200%22%20dur%3D%221.2s%22%20repeatCount%3D%22indefinite%22%20begin%3D%220.6%22%0A%20%20%20%20%20%20keytimes%3D%220%3B0.2%3B0.7%3B1%22%20keySplines%3D%220.2%200.2%200.4%200.8%3B0.2%200.6%200.4%200.8%3B0.2%200.6%200.4%200.8%22%20calcMode%3D%22spline%22%20/%3E%0A%20%20%3C/circle%3E%0A%3C/svg%3E";
		// set as loading icon on mobile
		promise.then(function(file){
			list.items[index].photo = file;
		}, null
		, function(update) {
			if (update === 'getting') {
				list.items[index].photo = loadingIcon;
			} else if (update === 'noImage') {
				if (list.items[index].photo === loadingIcon) {
					list.items[index].photo = '';
				}
			}
		});
	}

}
ItemsController.$inject = ["allListsService", "$mdToast", "$mdMedia"];
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

		// Photo select
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
		element[0].querySelector('img.photo').addEventListener('click', function(e) {
			e.stopPropagation();
			element.toggleClass('photoView');
		});
		element[0].querySelector('.media').addEventListener('click', function(e) {
			e.stopPropagation();
			element.removeClass('photoView');
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
bkItem.$inject = ["$q"];

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

	var itemObject = function(id) {
		this.id = id;
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
		this.getItemIndexById = getItemIndexById;
		this.getDescription = getDescription;
	}
	var nextItemId = 0;

	function addItem() {
		this.items.unshift(new ItemObject(nextItemId++));
	}

	function getItemIndexById(id) {
		for (var i=0; i<this.items.length; i++) {
			if (this.items[i].id == id) {
				return i;
			}
		}
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

function allListsService(ListObject, $q, emailService) {

	var lists = [];
	var currentListId = undefined;
	var deleteTimer;
	var deleteDefer;
	var deletingListId;
	var deletingItemId;

	return {
		add: add,
		lists: lists,
		setCurrentList: setCurrentList,
		getCurrentList: getCurrentList,
		deleteList: deleteList,
		deleteItem: deleteItem,
		cancelDelete: cancelDelete,
		localRetrieve: localRetrieve,
		localSave: localSave,
		importList: importList,
		exportList: exportList,
		emailList: emailList,
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

	function getTextOnlyList(id) {
		var list = lists[findListIndexById(id)];
		var textOnlyList = [];
		for (var i=0; i<list.items.length; i++) {
			textOnlyList.push(list.items[i]);
			textOnlyList[i].audio = '';
			textOnlyList[i].photo = '';
		}
		return textOnlyList;
	}

	function deleteList(id) {
		// Set list status for deletion
		var index = findListIndexById(id);
		if (index >= 0) {
			lists[index].deleting = true;
			currentListId = '';
		}
		// delete delay
		deletingListId = id;
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
			deletingListId = undefined;
		}, 5000);
		return deleteDefer.promise;
	}

	function deleteItem(id) {
		// Set list status for deletion
		var index = getCurrentList().getItemIndexById(id);
		if (index >= 0) {
			getCurrentList().items[index].deleting = true;
		}
		// delete delay
		deletingItemId = id;
		deletingListId = getCurrentList().id; // store list id in case current list is changed
		deleteDefer = $q.defer();
		deleteTimer = setTimeout(function() {
			// get index again, as it may have changed
			var listIndex = findListIndexById(deletingListId);
			if (listIndex >= 0) {
				var index = lists[listIndex].getItemIndexById(id);
				if (index >= 0) {
					lists[listIndex].items.splice(index, 1);
					deleteDefer.resolve('deleted');
				} else {
					deleteDefer.reject('listNotFound');
				}
			}
			deletingItemId = undefined;
		}, 5000);
		return deleteDefer.promise;
	}

	function cancelDelete() {
		clearTimeout(deleteTimer);
		if (deletingItemId) {
			var list = lists[findListIndexById(deletingListId)];
			var index = list.getItemIndexById(deletingId);
			if (index >= 0) {
				list.items[index].deleting = false;
			}
			deletingItemId = undefined;
		} else {
			var index = findListIndexById(deletingId);
			if (index >= 0) {
				lists[index].deleting = false;
			}
			deletingListId = undefined;
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

	function importList(data) {
		var list = emailService.decode(data);
		if (findListIndexById(list.id) < 0) {
			var list = new ListObject(list.id, list.name);
			list.items = list.items;
			lists.push(list);
		}
	}

	function exportList(listId) {
		return emailService.encode(getTextOnlyList(listId));
	}

	function emailList(listId) {
		return emailService.writeEmail(lists[findListIndexById(listId)]);
	}

	function localRetrieve() {
		var retrieved = localStorage.getItem('Baskets');
		if (retrieved) {
			var parsed = JSON.parse(retrieved);
			for (var i=0; i<parsed.length; i++) {
				var list = new ListObject(parsed[i].id, parsed[i].name);
				list.items = parsed[i].items;
				lists.push(list);
			}
		}
	}

	function localSave() {
		localStorage.setItem('Baskets', JSON.stringify(lists));
	}
}
allListsService.$inject = ["ListObject", "$q", "emailService"];
/*
 * Copyright (c) 2010 Nick Galbreath
 * http://code.google.com/p/stringencoders/source/browse/#svn/trunk/javascript
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/* base64 encode/decode compatible with window.btoa/atob
 *
 * window.atob/btoa is a Firefox extension to convert binary data (the "b")
 * to base64 (ascii, the "a").
 *
 * It is also found in Safari and Chrome.  It is not available in IE.
 *
 * if (!window.btoa) window.btoa = base64.encode
 * if (!window.atob) window.atob = base64.decode
 *
 * The original spec's for atob/btoa are a bit lacking
 * https://developer.mozilla.org/en/DOM/window.atob
 * https://developer.mozilla.org/en/DOM/window.btoa
 *
 * window.btoa and base64.encode takes a string where charCodeAt is [0,255]
 * If any character is not [0,255], then an DOMException(5) is thrown.
 *
 * window.atob and base64.decode take a base64-encoded string
 * If the input length is not a multiple of 4, or contains invalid characters
 *   then an DOMException(5) is thrown.
 */


angular
    .module('app')
    .factory('base64', base64);

function base64() {

    var base64 = {};
    base64.PADCHAR = '=';
    base64.ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    var encodeFunc = base64.encode;
    var decodeFunc = base64.decode;

    base64.makeDOMException = function() {
        // sadly in FF,Safari,Chrome you can't make a DOMException
        var e, tmp;

        try {
            return new DOMException(DOMException.INVALID_CHARACTER_ERR);
        } catch (tmp) {
            // not available, just passback a duck-typed equiv
            // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Error
            // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Error/prototype
            var ex = new Error("DOM Exception 5");

            // ex.number and ex.description is IE-specific.
            ex.code = ex.number = 5;
            ex.name = ex.description = "INVALID_CHARACTER_ERR";

            // Safari/Chrome output format
            ex.toString = function() { return 'Error: ' + ex.name + ': ' + ex.message; };
            return ex;
        }
    }

    base64.getbyte64 = function(s,i) {
        // This is oddly fast, except on Chrome/V8.
        //  Minimal or no improvement in performance by using a
        //   object with properties mapping chars to value (eg. 'A': 0)
        var idx = base64.ALPHA.indexOf(s.charAt(i));
        if (idx === -1) {
            throw base64.makeDOMException();
        }
        return idx;
    }

    base64.decode = function(s) {
        // convert to string
        s = '' + s;
        var getbyte64 = base64.getbyte64;
        var pads, i, b10;
        var imax = s.length
        if (imax === 0) {
            return s;
        }

        if (imax % 4 !== 0) {
            throw base64.makeDOMException();
        }

        pads = 0
        if (s.charAt(imax - 1) === base64.PADCHAR) {
            pads = 1;
            if (s.charAt(imax - 2) === base64.PADCHAR) {
                pads = 2;
            }
            // either way, we want to ignore this last block
            imax -= 4;
        }

        var x = [];
        for (i = 0; i < imax; i += 4) {
            b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) |
                (getbyte64(s,i+2) << 6) | getbyte64(s,i+3);
            x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff, b10 & 0xff));
        }

        switch (pads) {
        case 1:
            b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) | (getbyte64(s,i+2) << 6);
            x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff));
            break;
        case 2:
            b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12);
            x.push(String.fromCharCode(b10 >> 16));
            break;
        }
        return x.join('');
    }

    base64.getbyte = function(s,i) {
        var x = s.charCodeAt(i);
        if (x > 255) {
            throw base64.makeDOMException();
        }
        return x;
    }

    base64.encode = function(s) {
        if (arguments.length !== 1) {
            throw new SyntaxError("Not enough arguments");
        }
        var padchar = base64.PADCHAR;
        var alpha   = base64.ALPHA;
        var getbyte = base64.getbyte;

        var i, b10;
        var x = [];

        // convert to string
        s = '' + s;

        var imax = s.length - s.length % 3;

        if (s.length === 0) {
            return s;
        }
        for (i = 0; i < imax; i += 3) {
            b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8) | getbyte(s,i+2);
            x.push(alpha.charAt(b10 >> 18));
            x.push(alpha.charAt((b10 >> 12) & 0x3F));
            x.push(alpha.charAt((b10 >> 6) & 0x3f));
            x.push(alpha.charAt(b10 & 0x3f));
        }
        switch (s.length - imax) {
        case 1:
            b10 = getbyte(s,i) << 16;
            x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
                   padchar + padchar);
            break;
        case 2:
            b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8);
            x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
                   alpha.charAt((b10 >> 6) & 0x3f) + padchar);
            break;
        }
        return x.join('');
    }

    if (window.atob) {
        decodeFunc = window.atob;
    }
    if (window.btoa) {
        encodeFunc = window.btoa;
    }

    return {
        decode: decodeFunc,
        encode: encodeFunc,
    };
}
!function(){function t(t){this.message=t}var r="undefined"!=typeof exports?exports:this,e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";t.prototype=new Error,t.prototype.name="InvalidCharacterError",r.btoa||(r.btoa=function(r){for(var o,n,a=String(r),i=0,c=e,d="";a.charAt(0|i)||(c="=",i%1);d+=c.charAt(63&o>>8-i%1*8)){if(n=a.charCodeAt(i+=.75),n>255)throw new t("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");o=o<<8|n}return d}),r.atob||(r.atob=function(r){var o=String(r).replace(/=+$/,"");if(o.length%4==1)throw new t("'atob' failed: The string to be decoded is not correctly encoded.");for(var n,a,i=0,c=0,d="";a=o.charAt(c++);~a&&(n=i%4?64*n+a:a,i++%4)?d+=String.fromCharCode(255&n>>(-2*i&6)):0)a=e.indexOf(a);return d})}();
// https://github.com/davidchambers/Base64.js
angular
	.module('app')
	.factory('emailService', emailService);

function emailService() {

	return {
		decode: decode,
		encode: encode,
		writeEmail: writeEmail,
	};

	function encode(object) {
		return JSON.stringify(object);
	}

	function decode(data) {
		return JSON.parse(data);
	}

	function writeEmail(list) {
		var results = [];
		results.push("====================");
		results.push(list.name);
		results.push("====================");
		results.push("");
		for (var i=0; i<list.items.length; i++) {
			var item = list.items[i];
			results.push(item.title);
			results.push("");
			if (item.note) results.push('Notes: '+item.note);
			if (item.assign) results.push('Assigned to '+item.assign);
			results.push("--------------------");
			results.push("");
		}
		var body = results.join('%0A'); // new line
		return 'mailto:?body='+body;
	}
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL0Jhc2tldENvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9JdGVtc0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9MaXN0c0NvbnRyb2xsZXIuanMiLCJkaXJlY3RpdmVzL2JrSXRlbS5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0SW5mby5qcyIsImRpcmVjdGl2ZXMvYmtMaXN0Vmlldy5qcyIsInNlcnZpY2VzL0l0ZW1PYmplY3QuanMiLCJzZXJ2aWNlcy9MaXN0T2JqZWN0LmpzIiwic2VydmljZXMvYWxsTGlzdHNTZXJ2aWNlLmpzIiwic2VydmljZXMvYmFzZTY0LmpzIiwic2VydmljZXMvYmFzZTY0Lm1pbi5qcyIsInNlcnZpY2VzL2VtYWlsU2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFJLE9BQU8sWUFBWTtDQUN0QixjQUFjOzs7QUFHZixJQUFJLE1BQU0sUUFBUSxPQUFPLE9BQU8sQ0FBQztLQUM1QixTQUFTLFdBQVcsQ0FBQyxZQUFZLGNBQWM7QUNMcEQ7RUFDRSxPQUFPO0VBQ1AsV0FBVyxvQkFBb0I7O0FBRWpDLFNBQVMsaUJBQWlCLFlBQVksVUFBVSxpQkFBaUIsVUFBVSxTQUFTO0NBQ25GLElBQUksS0FBSztDQUNULEdBQUcsa0JBQWtCO0NBQ3JCLEdBQUcsaUJBQWlCO0NBQ3BCLEdBQUcsaUJBQWlCO0NBQ3BCLEdBQUcsWUFBWTtDQUNmLEdBQUcsVUFBVTs7O0NBR2IsZ0JBQWdCO0NBQ2hCLFlBQVksZ0JBQWdCLFdBQVc7O0NBRXZDLElBQUksU0FBUyxLQUFLLFVBQVUsR0FBRyxRQUFRLGVBQWUsR0FBRztFQUN4RCxnQkFBZ0IsV0FBVyxTQUFTLEtBQUssVUFBVTs7Q0FFcEQsT0FBTyxtQkFBbUIsZ0JBQWdCOztDQUUxQyxTQUFTLFVBQVUsSUFBSTtFQUN0QixPQUFPLEtBQUssZ0JBQWdCLFVBQVU7Ozs7Q0FJdkMsR0FBRyxXQUFXO0NBQ2QsSUFBSSxDQUFDLEdBQUcsU0FB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QUFJLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxPQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsSUFBSSxHQUFHLEdBQUcsT0FBTyxhQUFhLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLFFBQVEsR0FBRyxPQUFPOzZDQUN4dUI7QUNEN0M7RUFDRSxPQUFPO0VBQ1AsUUFBUSxnQkFBZ0I7O0FBRTFCLFNBQVMsZUFBZTs7Q0FFdkIsT0FBTztFQUNOLFFBQVE7RUFDUixRQUFRO0VBQ1IsWUFBWTs7O0NBR2IsU0FBUyxPQUFPLFFBQVE7RUFDdkIsT0FBTyxLQUFLLFVBQVU7OztDQUd2QixTQUFTLE9BQU8sTUFBTTtFQUNyQixPQUFPLEtBQUssTUFBTTs7O0NBR25CLFNBQVMsV0FBVyxNQUFNO0VBQ3pCLElBQUksVUFBVTtFQUNkLFFBQVEsS0FBSztFQUNiLFFBQVEsS0FBSyxLQUFLO0VBQ2xCLFFBQVEsS0FBSztFQUNiLFFBQVEsS0FBSztFQUNiLEtBQUssSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLE1BQU0sUUFBUSxLQUFLO0dBQ3ZDLElBQUksT0FBTyxLQUFLLE1BQU07R0FDdEIsUUFBUSxLQUFLLEtBQUs7R0FDbEIsUUFBUSxLQUFLO0dBQ2IsSUFBSSxLQUFLLE1BQU0sUUFBUSxLQUFLLFVBQVUsS0FBSztHQUMzQyxJQUFJLEtBQUssUUFBUSxRQUFRLEtBQUssZUFBZSxLQUFLO0dBQ2xELFFBQVEsS0FBSztHQUNiLFFBQVEsS0FBSzs7RUFFZCxJQUFJLE9BQU8sUUFBUSxLQUFLO0VBQ3hCLE9BQU8sZ0JBQWdCOztDQUV4QiIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpZiAod2luZG93LkZpbGVSZWFkZXIpIHtcblx0ZmlsZVN1cHBvcnQgPSB0cnVlO1xufVxuXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFsnbmdNYXRlcmlhbCddKVxuXHRcdFx0XHQuY29uc3RhbnQoJ3N1cHBvcnQnLCB7ZmlsZVJlYWRlcjogZmlsZVN1cHBvcnR9KTsiLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdCYXNrZXRDb250cm9sbGVyJywgQmFza2V0Q29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEJhc2tldENvbnRyb2xsZXIoJG1kU2lkZW5hdiwgJG1kTWVkaWEsIGFsbExpc3RzU2VydmljZSwgJG1kVG9hc3QsIHN1cHBvcnQpIHtcblx0dmFyIHZtID0gdGhpcztcblx0dm0udG9nZ2xlTGlzdHNWaWV3ID0gdG9nZ2xlTGlzdHNWaWV3O1xuXHR2bS5jbG9zZUxpc3RzVmlldyA9IGNsb3NlTGlzdHNWaWV3O1xuXHR2bS5kZWxldGVMaXN0QnlJZCA9IGRlbGV0ZUxpc3RCeUlkO1xuXHR2bS5zaGFyZUxpc3QgPSBzaGFyZUxpc3Q7XG5cdHZtLnN1cHBvcnQgPSBzdXBwb3J0O1xuXG5cdC8vIGxvYWQvc2F2ZSBkYXRhXG5cdGFsbExpc3RzU2VydmljZS5sb2NhbFJldHJpZXZlKCk7XG5cdHNldEludGVydmFsKGFsbExpc3RzU2VydmljZS5sb2NhbFNhdmUsIDUwMDApO1xuXG5cdGlmIChsb2NhdGlvbi5oYXNoLnN1YnN0cmluZygxKS5pbmRleE9mKCdpbXBvcnQ9JykgPT09IDApIHtcblx0XHRhbGxMaXN0c1NlcnZpY2UuaW1wb3J0TGlzdChsb2NhdGlvbi5oYXNoLnN1YnN0cmluZyg4KSk7XG5cdH1cblx0d2luZG93LmltcG9ydEJhc2tldExpc3QgPSBhbGxMaXN0c1NlcnZpY2UuaW1wb3J0TGlzdDtcblxuXHRmdW5jdGlvbiBzaGFyZUxpc3QoaWQpIHtcblx0XHR3aW5kb3cub3BlbihhbGxMaXN0c1NlcnZpY2UuZW1haWxMaXN0KGlkKSk7XG5cdH1cblxuXHQvLyBzaWRlbmF2IGJlaGF2aW91clxuXHR2bS4kbWRNZWRpYSA9ICRtZE1lZGlhO1xuXHRpZiAoIXZtLiRtZE1lZGlhKCdsZycpKSB7XG5cdFx0dm0ubGlzdHNWaWV3T3BlbiA9IHRydWU7XG5cdH1cblx0ZnVuY3Rpb24gdG9nZ2xlTGlzdHNWaWV3KCkge1xuXHRcdCRtZFNpZGVuYXYoJ2xlZnQnKS50b2dnbGUoKTtcblx0fVxuXHRmdW5jdGlvbiBjbG9zZUxpc3RzVmlldygpIHtcblx0XHQkbWRTaWRlbmF2KCdsZWZ0JykuY2xvc2UoKTtcblx0fVxuXG5cdC8vIExpc3RzIGRlbGV0ZSBvcGVyYXRpb25zXG5cdGZ1bmN0aW9uIGRlbGV0ZUxpc3RCeUlkKGlkKSB7XG5cdFx0Ly8gc2hvdyB1bmRvIHRvYXN0XG5cdFx0dmFyIGRlbGV0ZVRvYXN0ID0gJG1kVG9hc3Quc2ltcGxlKCkuY29udGVudCgnTGlzdCBEZWxldGVkJykuYWN0aW9uKCdVbmRvJykuaGlnaGxpZ2h0QWN0aW9uKHRydWUpO1xuXHRcdCRtZFRvYXN0LnNob3coZGVsZXRlVG9hc3QpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGlmIChyZXNwb25zZSA9PT0gJ29rJykge1xuXHRcdFx0XHR1bmRvRGVsZXRlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcGVyZm9ybSBkZWxldGVcblx0XHRhbGxMaXN0c1NlcnZpY2UuZGVsZXRlTGlzdChpZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRtZFRvYXN0LmhpZGUoKTtcblx0XHR9KTtcblx0XHQvLyBoaWRlIGN1cnJlbnRseSBlZGl0aW5nIGxpc3Rcblx0XHQkbWRTaWRlbmF2KCdsZWZ0Jykub3BlbigpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdW5kb0RlbGV0ZSgpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2UuY2FuY2VsRGVsZXRlKCk7XG5cdH1cbn1cbiIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmNvbnRyb2xsZXIoJ0l0ZW1zQ29udHJvbGxlcicsIEl0ZW1zQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIEl0ZW1zQ29udHJvbGxlcihhbGxMaXN0c1NlcnZpY2UsICRtZFRvYXN0LCAkbWRNZWRpYSkge1xuXHR2YXIgdm0gPSB0aGlzO1xuXG5cdHZtLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHR2bS5nZXRDdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblx0dm0uZGVsZXRlSXRlbSA9IGRlbGV0ZUl0ZW07XG5cdHZtLnNlYXJjaE5hbWUgPSBzZWFyY2hOYW1lO1xuXHR2bS5nZXRQaG90byA9IGdldFBob3RvO1xuXG5cdGZ1bmN0aW9uIGFkZEl0ZW0oKSB7XG5cdFx0aWYgKCFhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKSkge1xuXHRcdFx0YWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KGFsbExpc3RzU2VydmljZS5hZGQoKSk7XG5cdFx0fVxuXHRcdHZtLmdldEN1cnJlbnRMaXN0KCkuYWRkSXRlbSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlSXRlbShpZCkge1xuXHRcdC8vIHNob3cgdW5kbyB0b2FzdFxuXHRcdHZhciBkZWxldGVUb2FzdCA9ICRtZFRvYXN0LnNpbXBsZSgpLmNvbnRlbnQoJ0l0ZW0gRGVsZXRlZCcpLmFjdGlvbignVW5kbycpLmhpZ2hsaWdodEFjdGlvbih0cnVlKTtcblx0XHQkbWRUb2FzdC5zaG93KGRlbGV0ZVRvYXN0KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRpZiAocmVzcG9uc2UgPT09ICdvaycpIHtcblx0XHRcdFx0dW5kb0RlbGV0ZSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdC8vIHBlcmZvcm0gZGVsZXRlXG5cdFx0YWxsTGlzdHNTZXJ2aWNlLmRlbGV0ZUl0ZW0oaWQpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkbWRUb2FzdC5oaWRlKCk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiB1bmRvRGVsZXRlKCkge1xuXHRcdGFsbExpc3RzU2VydmljZS5jYW5jZWxEZWxldGUoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNlYXJjaE5hbWUocXVlcnkpIHtcblx0XHR2YXIgYWxsSXRlbXMgPSBhbGxMaXN0c1NlcnZpY2UuZ2V0Q3VycmVudExpc3QoKS5pdGVtcztcblx0XHR2YXIgbmFtZXMgPSBbcXVlcnldO1xuXHRcdC8vIGdldCBsaXN0IG9mIGFsbCB1bmlxdWUgbmFtZXNcblx0XHRmb3IgKHZhciBpPTA7IGk8YWxsSXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBuYW1lID0gYWxsSXRlbXNbaV0uYXNzaWduO1xuXHRcdFx0aWYgKG5hbWUgJiYgbmFtZXMuaW5kZXhPZihuYW1lKSA8IDApIHsgLy8gaWYgbmFtZSBpc24ndCBhbHJlYWR5IGluIGxpc3Rcblx0XHRcdFx0bmFtZXMucHVzaChuYW1lKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gZmluZCBtYXRjaGVkIG5hbWVzXG5cdFx0dmFyIG1hdGNoZXMgPSBuYW1lcy5maWx0ZXIoZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0cmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHF1ZXJ5LnRvTG93ZXJDYXNlKCkpID09PSAwO1xuXHRcdH0pO1xuXHRcdHJldHVybiBtYXRjaGVzO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0UGhvdG8oaWQsIHByb21pc2UpIHtcblx0XHR2YXIgbGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdCgpO1xuXHRcdHZhciBpbmRleCA9IGxpc3QuZ2V0SXRlbUluZGV4QnlJZChpZCk7XG5cdFx0dmFyIGxvYWRpbmdJY29uID0gXCJkYXRhOmltYWdlL3N2Zyt4bWwsJTNDc3ZnJTIweG1sbnMlM0QlMjJodHRwJTNBLy93d3cudzMub3JnLzIwMDAvc3ZnJTIyJTIwdmlld0JveCUzRCUyMjAlMjAwJTIwMzIlMjAzMiUyMiUyMHdpZHRoJTNEJTIyMzIlMjIlMjBoZWlnaHQlM0QlMjIzMiUyMiUyMGZpbGwlM0QlMjJibGFjayUyMiUzRSUwQSUyMCUyMCUzQ2NpcmNsZSUyMHRyYW5zZm9ybSUzRCUyMnRyYW5zbGF0ZSUyODglMjAwJTI5JTIyJTIwY3glM0QlMjIwJTIyJTIwY3klM0QlMjIxNiUyMiUyMHIlM0QlMjIwJTIyJTNFJTIwJTBBJTIwJTIwJTIwJTIwJTNDYW5pbWF0ZSUyMGF0dHJpYnV0ZU5hbWUlM0QlMjJyJTIyJTIwdmFsdWVzJTNEJTIyMCUzQiUyMDQlM0IlMjAwJTNCJTIwMCUyMiUyMGR1ciUzRCUyMjEuMnMlMjIlMjByZXBlYXRDb3VudCUzRCUyMmluZGVmaW5pdGUlMjIlMjBiZWdpbiUzRCUyMjAlMjIlMEElMjAlMjAlMjAlMjAlMjAlMjBrZXl0aW1lcyUzRCUyMjAlM0IwLjIlM0IwLjclM0IxJTIyJTIwa2V5U3BsaW5lcyUzRCUyMjAuMiUyMDAuMiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUzQjAuMiUyMDAuNiUyMDAuNCUyMDAuOCUyMiUyMGNhbGNNb2RlJTNEJTIyc3BsaW5lJTIyJTIwLyUzRSUwQSUyMCUyMCUzQy9jaXJjbGUlM0UlMEElMjAlMjAlM0NjaXJjbGUlMjB0cmFuc2Zvcm0lM0QlMjJ0cmFuc2xhdGUlMjgxNiUyMDAlMjklMjIlMjBjeCUzRCUyMjAlMjIlMjBjeSUzRCUyMjE2JTIyJTIwciUzRCUyMjAlMjIlM0UlMjAlMEElMjAlMjAlMjAlMjAlM0NhbmltYXRlJTIwYXR0cmlidXRlTmFtZSUzRCUyMnIlMjIlMjB2YWx1ZXMlM0QlMjIwJTNCJTIwNCUzQiUyMDAlM0IlMjAwJTIyJTIwZHVyJTNEJTIyMS4ycyUyMiUyMHJlcGVhdENvdW50JTNEJTIyaW5kZWZpbml0ZSUyMiUyMGJlZ2luJTNEJTIyMC4zJTIyJTBBJTIwJTIwJTIwJTIwJTIwJTIwa2V5dGltZXMlM0QlMjIwJTNCMC4yJTNCMC43JTNCMSUyMiUyMGtleVNwbGluZXMlM0QlMjIwLjIlMjAwLjIlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglM0IwLjIlMjAwLjYlMjAwLjQlMjAwLjglMjIlMjBjYWxjTW9kZSUzRCUyMnNwbGluZSUyMiUyMC8lM0UlMEElMjAlMjAlM0MvY2lyY2xlJTNFJTBBJTIwJTIwJTNDY2lyY2xlJTIwdHJhbnNmb3JtJTNEJTIydHJhbnNsYXRlJTI4MjQlMjAwJTI5JTIyJTIwY3glM0QlMjIwJTIyJTIwY3klM0QlMjIxNiUyMiUyMHIlM0QlMjIwJTIyJTNFJTIwJTBBJTIwJTIwJTIwJTIwJTNDYW5pbWF0ZSUyMGF0dHJpYnV0ZU5hbWUlM0QlMjJyJTIyJTIwdmFsdWVzJTNEJTIyMCUzQiUyMDQlM0IlMjAwJTNCJTIwMCUyMiUyMGR1ciUzRCUyMjEuMnMlMjIlMjByZXBlYXRDb3VudCUzRCUyMmluZGVmaW5pdGUlMjIlMjBiZWdpbiUzRCUyMjAuNiUyMiUwQSUyMCUyMCUyMCUyMCUyMCUyMGtleXRpbWVzJTNEJTIyMCUzQjAuMiUzQjAuNyUzQjElMjIlMjBrZXlTcGxpbmVzJTNEJTIyMC4yJTIwMC4yJTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTNCMC4yJTIwMC42JTIwMC40JTIwMC44JTIyJTIwY2FsY01vZGUlM0QlMjJzcGxpbmUlMjIlMjAvJTNFJTBBJTIwJTIwJTNDL2NpcmNsZSUzRSUwQSUzQy9zdmclM0VcIjtcblx0XHQvLyBzZXQgYXMgbG9hZGluZyBpY29uIG9uIG1vYmlsZVxuXHRcdHByb21pc2UudGhlbihmdW5jdGlvbihmaWxlKXtcblx0XHRcdGxpc3QuaXRlbXNbaW5kZXhdLnBob3RvID0gZmlsZTtcblx0XHR9LCBudWxsXG5cdFx0LCBmdW5jdGlvbih1cGRhdGUpIHtcblx0XHRcdGlmICh1cGRhdGUgPT09ICdnZXR0aW5nJykge1xuXHRcdFx0XHRsaXN0Lml0ZW1zW2luZGV4XS5waG90byA9IGxvYWRpbmdJY29uO1xuXHRcdFx0fSBlbHNlIGlmICh1cGRhdGUgPT09ICdub0ltYWdlJykge1xuXHRcdFx0XHRpZiAobGlzdC5pdGVtc1tpbmRleF0ucGhvdG8gPT09IGxvYWRpbmdJY29uKSB7XG5cdFx0XHRcdFx0bGlzdC5pdGVtc1tpbmRleF0ucGhvdG8gPSAnJztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5jb250cm9sbGVyKCdMaXN0c0NvbnRyb2xsZXInLCBMaXN0c0NvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBMaXN0c0NvbnRyb2xsZXIoYWxsTGlzdHNTZXJ2aWNlKSB7XG5cblx0dmFyIHZtID0gdGhpcztcblx0XG5cdHZtLmxpc3RzID0gYWxsTGlzdHNTZXJ2aWNlLmxpc3RzO1xuXG5cdHZtLmFkZExpc3QgPSBmdW5jdGlvbigpIHtcblx0XHRhbGxMaXN0c1NlcnZpY2Uuc2V0Q3VycmVudExpc3QoYWxsTGlzdHNTZXJ2aWNlLmFkZCgpKTtcblx0fTtcblxuXHR2bS5jdXJyZW50TGlzdCA9IGFsbExpc3RzU2VydmljZS5nZXRDdXJyZW50TGlzdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmRpcmVjdGl2ZSgnYmtJdGVtJywgYmtJdGVtKTtcblxuZnVuY3Rpb24gYmtJdGVtKCRxKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrSXRlbS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0Ly8gRW5kIGN1c3RvbSBlZGl0IG1vZGUgb24gY2xpY2tcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHRkZXNlbGVjdCgpO1xuXHRcdH0pO1xuXG5cdFx0dmFyIGxpc3RWaWV3ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2JrLWxpc3Qtdmlld10nKTtcblx0XHR2YXIgYXNzaWduSW5wdXQ7XG5cblx0XHQvLyBFbnRlciBhc3NpZ24gbW9kZVxuXHRcdGZ1bmN0aW9uIGVudGVyQXNzaWduTW9kZSgpIHtcblx0XHRcdGVsZW1lbnQuYWRkQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGFzc2lnbklucHV0LnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBhc3NpZ25JbnB1dC5mb2N1cygpOyB9LCAxMDApOyAvLyBkZWxheSB0byB3YWl0IGZvciBjbGFzc2VzIHRvIGFwcGx5XG5cdFx0XHRsaXN0Vmlldy5jbGFzc0xpc3QuYWRkKFwiaGFzRWRpdGFibGVJdGVtXCIpO1xuXHRcdH1cblxuXHRcdC8vIFBob3RvIHNlbGVjdFxuXHRcdHZhciBwaG90b0lucHV0ID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdpbnB1dC5waG90bycpO1xuXHRcdHZhciBmaWxlRGVmZXI7XG5cdFx0dmFyIHdhaXRpbmdJbnB1dCA9IDA7XG5cdFx0ZnVuY3Rpb24gcGhvdG9Qcm9tcHQoKSB7XG5cdFx0XHRwaG90b0lucHV0LmNsaWNrKCk7XG5cdFx0XHRwaG90b0lucHV0LnZhbHVlID0gbnVsbDtcblx0XHRcdGZpbGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0XHRzY29wZS5JdGVtcy5nZXRQaG90byhhdHRycy5pdGVtSWQsIGZpbGVEZWZlci5wcm9taXNlKTtcblx0XHR9XG5cdFx0ZnVuY3Rpb24gcGhvdG9Qcm9tcHRDbG9zZSgpIHtcblx0XHRcdGlmICh3YWl0aW5nSW5wdXQgPiAwKSB7XG5cdFx0XHRcdHdhaXRpbmdJbnB1dCA9IDA7XG5cdFx0XHRcdGZpbGVEZWZlci5ub3RpZnkoJ25vSW1hZ2UnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHdhaXRpbmdJbnB1dCsrO1xuXHRcdFx0XHRmaWxlRGVmZXIubm90aWZ5KCdnZXR0aW5nJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHBob3RvSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIGZpbGUgPSBlLnRhcmdldC5maWxlc1swXTtcblx0XHRcdHdhaXRpbmdJbnB1dCA9IDA7XG5cdFx0XHRpZiAoZmlsZSkge1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblx0XHRcdFx0cmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGZpbGVEZWZlci5yZXNvbHZlKHJlYWRlci5yZXN1bHQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignaW1nLnBob3RvJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZWxlbWVudC50b2dnbGVDbGFzcygncGhvdG9WaWV3Jyk7XG5cdFx0fSk7XG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWVkaWEnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKCdwaG90b1ZpZXcnKTtcblx0XHR9KTtcblxuXHRcdC8vIFRvZ2dsZSBpdGVtIGRvbmVuZXNzXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24uZG9uZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50LnRvZ2dsZUNsYXNzKFwiZG9uZVwiKS5yZW1vdmVDbGFzcyhcImVkaXRhYmxlXCIpO1xuXHRcdFx0bGlzdFZpZXcuY2xhc3NMaXN0LnJlbW92ZShcImhhc0VkaXRhYmxlSXRlbVwiKTtcblx0XHRcdGRlc2VsZWN0KCk7XG5cdFx0fSk7XG5cdFx0XG5cdFx0Ly8gUmVhdHRhY2ggbGlzdGVuZXIgdG8gYnV0dG9ucyBvbiBzY3JlZW4gc2l6ZSBjaGFuZ2Vcblx0XHR2YXIgYXNzaWduQnV0dG9uID0gZ2V0QXNzaWduQnV0dG9uKCk7XG5cdFx0dmFyIHBob3RvQnV0dG9uID0gZ2V0UGhvdG9CdXR0b24oKTtcblx0XHRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBzY29wZS5NYWluLiRtZE1lZGlhKCdtZCcpOyB9LCBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChhc3NpZ25CdXR0b24pIHtcblx0XHRcdFx0YXNzaWduQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW50ZXJBc3NpZ25Nb2RlKTtcblx0XHRcdH1cblx0XHRcdGFzc2lnbkJ1dHRvbiA9IGdldEFzc2lnbkJ1dHRvbigpO1xuXHRcdFx0aWYgKGFzc2lnbkJ1dHRvbikge1xuXHRcdFx0XHRhc3NpZ25CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlbnRlckFzc2lnbk1vZGUpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHBob3RvQnV0dG9uKSB7XG5cdFx0XHRcdHBob3RvQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcGhvdG9Qcm9tcHQpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCBwaG90b1Byb21wdENsb3NlKTtcblx0XHRcdH1cblx0XHRcdHBob3RvQnV0dG9uID0gZ2V0UGhvdG9CdXR0b24oKTtcblx0XHRcdGlmIChwaG90b0J1dHRvbikge1xuXHRcdFx0XHRwaG90b0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHBob3RvUHJvbXB0KTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgcGhvdG9Qcm9tcHRDbG9zZSk7XG5cdFx0XHR9XG5cdFx0XHQvLyBQcmV2ZW50IGVuZGluZyBlZGl0IG1vZGUgd2hlbiBjbGlja2luZyBidXR0b25cblx0XHRcdGVsZW1lbnQuZmluZCgnYnV0dG9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSk7XG5cdFx0XHQvLyBpT1MgZml4IHRvIGRlc2VsZWN0IGJ1dHRvblxuXHRcdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbigndG91Y2hzdGFydCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBEZWxheSBxdWVyeWluZyBmb3IgaW5wdXQgdW50aWwgZWxlbWVudCBjcmVhdGVkXG5cdFx0XHRhc3NpZ25JbnB1dCA9IGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignbWQtYXV0b2NvbXBsZXRlLmFzc2lnbiBpbnB1dCcpO1xuXHRcdFx0Ly8gUHJldmVudCBlbmRpbmcgZWRpdCBtb2RlIHdoZW4gc2VsZWN0aW5nIGlucHV0XG5cdFx0XHRlbGVtZW50LmZpbmQoJ21kLWlucHV0LWNvbnRhaW5lcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdH0pO1xuXHRcdH0sIDEwMCk7XG5cblx0XHQvLyBMZWF2ZSBjdXN0b20gZWRpdCBtb2RlXG5cdFx0ZnVuY3Rpb24gZGVzZWxlY3QoKSB7XG5cdFx0XHRlbGVtZW50LnJlbW92ZUNsYXNzKFwiZWRpdGluZyBhc3NpZ25cIik7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ2V0QXNzaWduQnV0dG9uKCkge1xuXHRcdFx0cmV0dXJuIGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignYnV0dG9uLmFzc2lnbicpO1xuXHRcdH1cblx0XHRmdW5jdGlvbiBnZXRQaG90b0J1dHRvbigpIHtcblx0XHRcdHJldHVybiBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbi5waG90bycpO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RJbmZvJywgYmtMaXN0SW5mbyk7XG5cbmZ1bmN0aW9uIGJrTGlzdEluZm8oYWxsTGlzdHNTZXJ2aWNlKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHR0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGVzL2JrTGlzdEluZm8uaHRtbCdcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0ZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHsgYWxsTGlzdHNTZXJ2aWNlLnNldEN1cnJlbnRMaXN0KHNjb3BlLmxpc3QpIH0pO1xuXHRcdH0pO1xuXHR9XG59IiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZGlyZWN0aXZlKCdia0xpc3RWaWV3JywgYmtMaXN0Vmlldyk7XG5cbmZ1bmN0aW9uIGJrTGlzdFZpZXcoKSB7XG5cdHZhciBkaXJlY3RpdmUgPSB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsXG5cdFx0bGluazogbGluayxcblx0XHRjb250cm9sbGVyOiAnSXRlbXNDb250cm9sbGVyJyxcblx0XHRjb250cm9sbGVyQXM6ICdJdGVtcydcblx0fTtcblxuXHRyZXR1cm4gZGlyZWN0aXZlO1xuXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cblx0XHR2YXIgc3ViaGVhZGVyID0gZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWQtc3ViaGVhZGVyJyk7XG5cdFx0dmFyIHRpdGxlSW5wdXQgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXIgaW5wdXQnKTtcblxuXHRcdC8vIENsaWNrIG91dHNpZGUgb2YgaXRlbXMgdG8gZXhpdCBlZGl0IG1vZGVcblx0XHRlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRpZiAoZS50YXJnZXQpIHtcblx0XHRcdFx0dmFyIGJrSXRlbSA9IGlzQmtJdGVtQ2hpbGQoZS50YXJnZXQpO1xuXHRcdFx0XHRpZiAoYmtJdGVtKSB7XG5cdFx0XHRcdFx0bWFrZUl0ZW1FZGl0YWJsZShia0l0ZW0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBQcmV2ZW50IGxvc2luZyBmb2N1cyBvbiBidXR0b24gY2xpY2tzXG5cdFx0ZWxlbWVudC5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gTWFrZSB0aXRsZSBlZGl0YWJsZSBvbiBjbGlja1xuXHRcdGVsZW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1kLXN1YmhlYWRlciAubmFtZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRtYWtlVGl0bGVFZGl0YWJsZSgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gRXhpdCB0aXRsZSBlZGl0IG1vZGUgb24gdGl0bGUgaW5wdXQgbG9zaW5nIGZvY3VzXG5cdFx0dGl0bGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zdWJoZWFkZXInKS5jbGFzc0xpc3QucmVtb3ZlKCdlZGl0YWJsZScpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gU3dpdGNoIGZvY3VzIHRvIG5ldyBpdGVtXG5cdFx0ZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yKCdidXR0b24ubmV3SXRlbScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIG5ld0l0ZW0gPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2JrLWl0ZW0nKTtcblx0XHRcdGlmIChuZXdJdGVtKSB7XG5cdFx0XHRcdGRlc2VsZWN0QWxsKCk7XG5cdFx0XHRcdG1ha2VJdGVtRWRpdGFibGUobmV3SXRlbSk7XG5cdFx0XHRcdHZhciB0aXRsZSA9IG5ld0l0ZW0ucXVlcnlTZWxlY3RvcignLnRpdGxlIGlucHV0Jyk7XG5cdFx0XHRcdC8vIGZvY3VzIHRpdGxlIGZpZWxkIGJ5IGRlZmF1bHQ7IGRlbGF5IHRvIHdhaXQgZm9yIHN0eWxlIHRvIHRha2UgZWZmZWN0XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRpdGxlLmZvY3VzKCk7IH0sIDEwMCk7XG5cdFx0XHRcdHRpdGxlLnNlbGVjdCgpOyAvLyBpT1MgZml4XG5cdFx0XHRcdHdpbmRvdy5zY3JvbGwoMSwxKTsgLy8gaU9TIGZpeFxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gbWFrZVRpdGxlRWRpdGFibGUoKSB7XG5cdFx0XHRzdWJoZWFkZXIuY2xhc3NMaXN0LmFkZCgnZWRpdGFibGUnKTtcblx0XHRcdHRpdGxlSW5wdXQuZm9jdXMoKTtcblx0XHR9XG5cdFx0c2NvcGUubWFrZVRpdGxlRWRpdGFibGUgPSBtYWtlVGl0bGVFZGl0YWJsZTtcblxuXHRcdGZ1bmN0aW9uIGRlc2VsZWN0QWxsKCkge1xuXHRcdFx0ZWxlbWVudC5maW5kKCdiay1pdGVtJykucmVtb3ZlQ2xhc3MoXCJlZGl0YWJsZSBlZGl0aW5nIGFzc2lnblwiKTtcblx0XHRcdGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2hhc0VkaXRhYmxlSXRlbScpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG1ha2VJdGVtRWRpdGFibGUoaXRlbSkge1xuXHRcdFx0aXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0YWJsZScpO1xuXHRcdFx0ZWxlbWVudC5hZGRDbGFzcygnaGFzRWRpdGFibGVJdGVtJyk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaXNCa0l0ZW1DaGlsZChub2RlKSB7XG5cdFx0XHR2YXIgaXNDYXJkQ29udGVudCA9IGZhbHNlO1xuXHRcdFx0d2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gZWxlbWVudFswXSkge1xuXHRcdFx0XHRpZiAobm9kZS5ub2RlTmFtZSA9PT0gJ01ELUNBUkQtQ09OVEVOVCcpIHtcblx0XHRcdFx0XHRpc0NhcmRDb250ZW50ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoaXNDYXJkQ29udGVudCAmJiBub2RlLm5vZGVOYW1lID09PSAnQkstSVRFTScpIHtcblx0XHRcdFx0XHRyZXR1cm4gbm9kZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufVxuIiwiYW5ndWxhclxuXHQubW9kdWxlKCdhcHAnKVxuXHQuZmFjdG9yeSgnSXRlbU9iamVjdCcsIEl0ZW1PYmplY3QpO1xuXG5mdW5jdGlvbiBJdGVtT2JqZWN0KCkge1xuXG5cdHZhciBpdGVtT2JqZWN0ID0gZnVuY3Rpb24oaWQpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy50aXRsZSA9ICcnO1xuXHRcdHRoaXMubm90ZSA9ICcnO1xuXHRcdHRoaXMuYXNzaWduID0gJyc7XG5cdFx0dGhpcy5kb25lID0gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4gaXRlbU9iamVjdDtcblxufSIsImFuZ3VsYXJcblx0Lm1vZHVsZSgnYXBwJylcblx0LmZhY3RvcnkoJ0xpc3RPYmplY3QnLCBMaXN0T2JqZWN0KTtcblxuZnVuY3Rpb24gTGlzdE9iamVjdChJdGVtT2JqZWN0KSB7XG5cblx0dmFyIGxpc3RPYmplY3QgPSBmdW5jdGlvbihpZCwgbmFtZSkge1xuXHRcdHRoaXMuaWQgPSBpZDtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuaXRlbXMgPSBbXTtcblx0XHR0aGlzLmFkZEl0ZW0gPSBhZGRJdGVtO1xuXHRcdHRoaXMuZ2V0SXRlbUluZGV4QnlJZCA9IGdldEl0ZW1JbmRleEJ5SWQ7XG5cdFx0dGhpcy5nZXREZXNjcmlwdGlvbiA9IGdldERlc2NyaXB0aW9uO1xuXHR9XG5cdHZhciBuZXh0SXRlbUlkID0gMDtcblxuXHRmdW5jdGlvbiBhZGRJdGVtKCkge1xuXHRcdHRoaXMuaXRlbXMudW5zaGlmdChuZXcgSXRlbU9iamVjdChuZXh0SXRlbUlkKyspKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldEl0ZW1JbmRleEJ5SWQoaWQpIHtcblx0XHRmb3IgKHZhciBpPTA7IGk8dGhpcy5pdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKHRoaXMuaXRlbXNbaV0uaWQgPT0gaWQpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RGVzY3JpcHRpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgaWYgKCFpdGVtLmRvbmUpIHJldHVybiBpdGVtLnRpdGxlIH0pXG5cdFx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9KS8vIGdldCBub24tZW1wdHkgaXRlbXNcblx0XHRcdFx0XHRcdC5qb2luKCcsICcpO1xuXHR9XG5cblx0cmV0dXJuIGxpc3RPYmplY3Q7XG5cbn0iLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdhbGxMaXN0c1NlcnZpY2UnLCBhbGxMaXN0c1NlcnZpY2UpO1xuXG5mdW5jdGlvbiBhbGxMaXN0c1NlcnZpY2UoTGlzdE9iamVjdCwgJHEsIGVtYWlsU2VydmljZSkge1xuXG5cdHZhciBsaXN0cyA9IFtdO1xuXHR2YXIgY3VycmVudExpc3RJZCA9IHVuZGVmaW5lZDtcblx0dmFyIGRlbGV0ZVRpbWVyO1xuXHR2YXIgZGVsZXRlRGVmZXI7XG5cdHZhciBkZWxldGluZ0xpc3RJZDtcblx0dmFyIGRlbGV0aW5nSXRlbUlkO1xuXG5cdHJldHVybiB7XG5cdFx0YWRkOiBhZGQsXG5cdFx0bGlzdHM6IGxpc3RzLFxuXHRcdHNldEN1cnJlbnRMaXN0OiBzZXRDdXJyZW50TGlzdCxcblx0XHRnZXRDdXJyZW50TGlzdDogZ2V0Q3VycmVudExpc3QsXG5cdFx0ZGVsZXRlTGlzdDogZGVsZXRlTGlzdCxcblx0XHRkZWxldGVJdGVtOiBkZWxldGVJdGVtLFxuXHRcdGNhbmNlbERlbGV0ZTogY2FuY2VsRGVsZXRlLFxuXHRcdGxvY2FsUmV0cmlldmU6IGxvY2FsUmV0cmlldmUsXG5cdFx0bG9jYWxTYXZlOiBsb2NhbFNhdmUsXG5cdFx0aW1wb3J0TGlzdDogaW1wb3J0TGlzdCxcblx0XHRleHBvcnRMaXN0OiBleHBvcnRMaXN0LFxuXHRcdGVtYWlsTGlzdDogZW1haWxMaXN0LFxuXHR9O1xuXG5cdGZ1bmN0aW9uIGFkZCgpIHtcblx0XHRsaXN0cy51bnNoaWZ0KFxuXHRcdFx0bmV3IExpc3RPYmplY3QoZ2V0VW5pcUlkKCksIFwiTmV3IExpc3QgXCIrKGxpc3RzLmxlbmd0aCsxKSlcblx0XHQpO1xuXHRcdHJldHVybiBsaXN0c1swXTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFVuaXFJZCgpIHtcblx0XHR2YXIgbGVuZ3RoID0gODtcblx0XHRyZXR1cm4gKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpNYXRoLnBvdygzNixsZW5ndGgpKS50b1N0cmluZygzNikpLnNsaWNlKC1sZW5ndGgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZmluZExpc3RJbmRleEJ5SWQoaWQpIHtcblx0XHRmb3IgKHZhciBpPTA7IGk8bGlzdHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChsaXN0c1tpXS5pZCA9PT0gaWQpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0VGV4dE9ubHlMaXN0KGlkKSB7XG5cdFx0dmFyIGxpc3QgPSBsaXN0c1tmaW5kTGlzdEluZGV4QnlJZChpZCldO1xuXHRcdHZhciB0ZXh0T25seUxpc3QgPSBbXTtcblx0XHRmb3IgKHZhciBpPTA7IGk8bGlzdC5pdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGV4dE9ubHlMaXN0LnB1c2gobGlzdC5pdGVtc1tpXSk7XG5cdFx0XHR0ZXh0T25seUxpc3RbaV0uYXVkaW8gPSAnJztcblx0XHRcdHRleHRPbmx5TGlzdFtpXS5waG90byA9ICcnO1xuXHRcdH1cblx0XHRyZXR1cm4gdGV4dE9ubHlMaXN0O1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlTGlzdChpZCkge1xuXHRcdC8vIFNldCBsaXN0IHN0YXR1cyBmb3IgZGVsZXRpb25cblx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChpZCk7XG5cdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdGxpc3RzW2luZGV4XS5kZWxldGluZyA9IHRydWU7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gJyc7XG5cdFx0fVxuXHRcdC8vIGRlbGV0ZSBkZWxheVxuXHRcdGRlbGV0aW5nTGlzdElkID0gaWQ7XG5cdFx0ZGVsZXRlRGVmZXIgPSAkcS5kZWZlcigpO1xuXHRcdGRlbGV0ZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdC8vIGdldCBpbmRleCBhZ2FpbiwgYXMgaXQgbWF5IGhhdmUgY2hhbmdlZFxuXHRcdFx0dmFyIGluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoaWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdHMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVzb2x2ZSgnZGVsZXRlZCcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVsZXRlRGVmZXIucmVqZWN0KCdsaXN0Tm90Rm91bmQnKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nTGlzdElkID0gdW5kZWZpbmVkO1xuXHRcdH0sIDUwMDApO1xuXHRcdHJldHVybiBkZWxldGVEZWZlci5wcm9taXNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVsZXRlSXRlbShpZCkge1xuXHRcdC8vIFNldCBsaXN0IHN0YXR1cyBmb3IgZGVsZXRpb25cblx0XHR2YXIgaW5kZXggPSBnZXRDdXJyZW50TGlzdCgpLmdldEl0ZW1JbmRleEJ5SWQoaWQpO1xuXHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRnZXRDdXJyZW50TGlzdCgpLml0ZW1zW2luZGV4XS5kZWxldGluZyA9IHRydWU7XG5cdFx0fVxuXHRcdC8vIGRlbGV0ZSBkZWxheVxuXHRcdGRlbGV0aW5nSXRlbUlkID0gaWQ7XG5cdFx0ZGVsZXRpbmdMaXN0SWQgPSBnZXRDdXJyZW50TGlzdCgpLmlkOyAvLyBzdG9yZSBsaXN0IGlkIGluIGNhc2UgY3VycmVudCBsaXN0IGlzIGNoYW5nZWRcblx0XHRkZWxldGVEZWZlciA9ICRxLmRlZmVyKCk7XG5cdFx0ZGVsZXRlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gZ2V0IGluZGV4IGFnYWluLCBhcyBpdCBtYXkgaGF2ZSBjaGFuZ2VkXG5cdFx0XHR2YXIgbGlzdEluZGV4ID0gZmluZExpc3RJbmRleEJ5SWQoZGVsZXRpbmdMaXN0SWQpO1xuXHRcdFx0aWYgKGxpc3RJbmRleCA+PSAwKSB7XG5cdFx0XHRcdHZhciBpbmRleCA9IGxpc3RzW2xpc3RJbmRleF0uZ2V0SXRlbUluZGV4QnlJZChpZCk7XG5cdFx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdFx0bGlzdHNbbGlzdEluZGV4XS5pdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRcdGRlbGV0ZURlZmVyLnJlc29sdmUoJ2RlbGV0ZWQnKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkZWxldGVEZWZlci5yZWplY3QoJ2xpc3ROb3RGb3VuZCcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRkZWxldGluZ0l0ZW1JZCA9IHVuZGVmaW5lZDtcblx0XHR9LCA1MDAwKTtcblx0XHRyZXR1cm4gZGVsZXRlRGVmZXIucHJvbWlzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNhbmNlbERlbGV0ZSgpIHtcblx0XHRjbGVhclRpbWVvdXQoZGVsZXRlVGltZXIpO1xuXHRcdGlmIChkZWxldGluZ0l0ZW1JZCkge1xuXHRcdFx0dmFyIGxpc3QgPSBsaXN0c1tmaW5kTGlzdEluZGV4QnlJZChkZWxldGluZ0xpc3RJZCldO1xuXHRcdFx0dmFyIGluZGV4ID0gbGlzdC5nZXRJdGVtSW5kZXhCeUlkKGRlbGV0aW5nSWQpO1xuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcblx0XHRcdFx0bGlzdC5pdGVtc1tpbmRleF0uZGVsZXRpbmcgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGRlbGV0aW5nSXRlbUlkID0gdW5kZWZpbmVkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgaW5kZXggPSBmaW5kTGlzdEluZGV4QnlJZChkZWxldGluZ0lkKTtcblx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdGxpc3RzW2luZGV4XS5kZWxldGluZyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRpbmdMaXN0SWQgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGRlbGV0ZURlZmVyLnJlamVjdCgnZGVsZXRlQ2FuY2VsbGVkJyk7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDdXJyZW50TGlzdChsaXN0KSB7XG5cdFx0aWYgKHR5cGVvZiBsaXN0ID09PSAnbnVtYmVyJykge1xuXHRcdFx0Y3VycmVudExpc3RJZCA9IGZpbmRMaXN0SW5kZXhCeUlkKGxpc3QpO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRjdXJyZW50TGlzdElkID0gbGlzdC5pZDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc29sZS53YXJuKCd1bmtub3duIGlucHV0IGZvciBsaXN0OiAnKyB0eXBlb2YgbGlzdCk7XG5cdFx0XHRjb25zb2xlLndhcm4obGlzdCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Q3VycmVudExpc3QoKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBsaXN0c1tmaW5kTGlzdEluZGV4QnlJZChjdXJyZW50TGlzdElkKV07XG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ0xpc3Qgbm90IGZvdW5kLiBJRDogJytjdXJyZW50TGlzdElkKTtcblx0XHRcdGNvbnNvbGUud2FybihsaXN0cyk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaW1wb3J0TGlzdChkYXRhKSB7XG5cdFx0dmFyIGxpc3QgPSBlbWFpbFNlcnZpY2UuZGVjb2RlKGRhdGEpO1xuXHRcdGlmIChmaW5kTGlzdEluZGV4QnlJZChsaXN0LmlkKSA8IDApIHtcblx0XHRcdHZhciBsaXN0ID0gbmV3IExpc3RPYmplY3QobGlzdC5pZCwgbGlzdC5uYW1lKTtcblx0XHRcdGxpc3QuaXRlbXMgPSBsaXN0Lml0ZW1zO1xuXHRcdFx0bGlzdHMucHVzaChsaXN0KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBleHBvcnRMaXN0KGxpc3RJZCkge1xuXHRcdHJldHVybiBlbWFpbFNlcnZpY2UuZW5jb2RlKGdldFRleHRPbmx5TGlzdChsaXN0SWQpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGVtYWlsTGlzdChsaXN0SWQpIHtcblx0XHRyZXR1cm4gZW1haWxTZXJ2aWNlLndyaXRlRW1haWwobGlzdHNbZmluZExpc3RJbmRleEJ5SWQobGlzdElkKV0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gbG9jYWxSZXRyaWV2ZSgpIHtcblx0XHR2YXIgcmV0cmlldmVkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0Jhc2tldHMnKTtcblx0XHRpZiAocmV0cmlldmVkKSB7XG5cdFx0XHR2YXIgcGFyc2VkID0gSlNPTi5wYXJzZShyZXRyaWV2ZWQpO1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHBhcnNlZC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIgbGlzdCA9IG5ldyBMaXN0T2JqZWN0KHBhcnNlZFtpXS5pZCwgcGFyc2VkW2ldLm5hbWUpO1xuXHRcdFx0XHRsaXN0Lml0ZW1zID0gcGFyc2VkW2ldLml0ZW1zO1xuXHRcdFx0XHRsaXN0cy5wdXNoKGxpc3QpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGxvY2FsU2F2ZSgpIHtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnQmFza2V0cycsIEpTT04uc3RyaW5naWZ5KGxpc3RzKSk7XG5cdH1cbn0iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDEwIE5pY2sgR2FsYnJlYXRoXG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3Avc3RyaW5nZW5jb2RlcnMvc291cmNlL2Jyb3dzZS8jc3ZuL3RydW5rL2phdmFzY3JpcHRcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvblxuICogb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb25cbiAqIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dFxuICogcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsXG4gKiBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlXG4gKiBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZ1xuICogY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFU1xuICogT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkRcbiAqIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUXG4gKiBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSxcbiAqIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lOR1xuICogRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUlxuICogT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICovXG5cbi8qIGJhc2U2NCBlbmNvZGUvZGVjb2RlIGNvbXBhdGlibGUgd2l0aCB3aW5kb3cuYnRvYS9hdG9iXG4gKlxuICogd2luZG93LmF0b2IvYnRvYSBpcyBhIEZpcmVmb3ggZXh0ZW5zaW9uIHRvIGNvbnZlcnQgYmluYXJ5IGRhdGEgKHRoZSBcImJcIilcbiAqIHRvIGJhc2U2NCAoYXNjaWksIHRoZSBcImFcIikuXG4gKlxuICogSXQgaXMgYWxzbyBmb3VuZCBpbiBTYWZhcmkgYW5kIENocm9tZS4gIEl0IGlzIG5vdCBhdmFpbGFibGUgaW4gSUUuXG4gKlxuICogaWYgKCF3aW5kb3cuYnRvYSkgd2luZG93LmJ0b2EgPSBiYXNlNjQuZW5jb2RlXG4gKiBpZiAoIXdpbmRvdy5hdG9iKSB3aW5kb3cuYXRvYiA9IGJhc2U2NC5kZWNvZGVcbiAqXG4gKiBUaGUgb3JpZ2luYWwgc3BlYydzIGZvciBhdG9iL2J0b2EgYXJlIGEgYml0IGxhY2tpbmdcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0RPTS93aW5kb3cuYXRvYlxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vRE9NL3dpbmRvdy5idG9hXG4gKlxuICogd2luZG93LmJ0b2EgYW5kIGJhc2U2NC5lbmNvZGUgdGFrZXMgYSBzdHJpbmcgd2hlcmUgY2hhckNvZGVBdCBpcyBbMCwyNTVdXG4gKiBJZiBhbnkgY2hhcmFjdGVyIGlzIG5vdCBbMCwyNTVdLCB0aGVuIGFuIERPTUV4Y2VwdGlvbig1KSBpcyB0aHJvd24uXG4gKlxuICogd2luZG93LmF0b2IgYW5kIGJhc2U2NC5kZWNvZGUgdGFrZSBhIGJhc2U2NC1lbmNvZGVkIHN0cmluZ1xuICogSWYgdGhlIGlucHV0IGxlbmd0aCBpcyBub3QgYSBtdWx0aXBsZSBvZiA0LCBvciBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnNcbiAqICAgdGhlbiBhbiBET01FeGNlcHRpb24oNSkgaXMgdGhyb3duLlxuICovXG5cblxuYW5ndWxhclxuICAgIC5tb2R1bGUoJ2FwcCcpXG4gICAgLmZhY3RvcnkoJ2Jhc2U2NCcsIGJhc2U2NCk7XG5cbmZ1bmN0aW9uIGJhc2U2NCgpIHtcblxuICAgIHZhciBiYXNlNjQgPSB7fTtcbiAgICBiYXNlNjQuUEFEQ0hBUiA9ICc9JztcbiAgICBiYXNlNjQuQUxQSEEgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cbiAgICB2YXIgZW5jb2RlRnVuYyA9IGJhc2U2NC5lbmNvZGU7XG4gICAgdmFyIGRlY29kZUZ1bmMgPSBiYXNlNjQuZGVjb2RlO1xuXG4gICAgYmFzZTY0Lm1ha2VET01FeGNlcHRpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gc2FkbHkgaW4gRkYsU2FmYXJpLENocm9tZSB5b3UgY2FuJ3QgbWFrZSBhIERPTUV4Y2VwdGlvblxuICAgICAgICB2YXIgZSwgdG1wO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IERPTUV4Y2VwdGlvbihET01FeGNlcHRpb24uSU5WQUxJRF9DSEFSQUNURVJfRVJSKTtcbiAgICAgICAgfSBjYXRjaCAodG1wKSB7XG4gICAgICAgICAgICAvLyBub3QgYXZhaWxhYmxlLCBqdXN0IHBhc3NiYWNrIGEgZHVjay10eXBlZCBlcXVpdlxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vQ29yZV9KYXZhU2NyaXB0XzEuNV9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRXJyb3JcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0NvcmVfSmF2YVNjcmlwdF8xLjVfUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0Vycm9yL3Byb3RvdHlwZVxuICAgICAgICAgICAgdmFyIGV4ID0gbmV3IEVycm9yKFwiRE9NIEV4Y2VwdGlvbiA1XCIpO1xuXG4gICAgICAgICAgICAvLyBleC5udW1iZXIgYW5kIGV4LmRlc2NyaXB0aW9uIGlzIElFLXNwZWNpZmljLlxuICAgICAgICAgICAgZXguY29kZSA9IGV4Lm51bWJlciA9IDU7XG4gICAgICAgICAgICBleC5uYW1lID0gZXguZGVzY3JpcHRpb24gPSBcIklOVkFMSURfQ0hBUkFDVEVSX0VSUlwiO1xuXG4gICAgICAgICAgICAvLyBTYWZhcmkvQ2hyb21lIG91dHB1dCBmb3JtYXRcbiAgICAgICAgICAgIGV4LnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7IHJldHVybiAnRXJyb3I6ICcgKyBleC5uYW1lICsgJzogJyArIGV4Lm1lc3NhZ2U7IH07XG4gICAgICAgICAgICByZXR1cm4gZXg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBiYXNlNjQuZ2V0Ynl0ZTY0ID0gZnVuY3Rpb24ocyxpKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgb2RkbHkgZmFzdCwgZXhjZXB0IG9uIENocm9tZS9WOC5cbiAgICAgICAgLy8gIE1pbmltYWwgb3Igbm8gaW1wcm92ZW1lbnQgaW4gcGVyZm9ybWFuY2UgYnkgdXNpbmcgYVxuICAgICAgICAvLyAgIG9iamVjdCB3aXRoIHByb3BlcnRpZXMgbWFwcGluZyBjaGFycyB0byB2YWx1ZSAoZWcuICdBJzogMClcbiAgICAgICAgdmFyIGlkeCA9IGJhc2U2NC5BTFBIQS5pbmRleE9mKHMuY2hhckF0KGkpKTtcbiAgICAgICAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRocm93IGJhc2U2NC5tYWtlRE9NRXhjZXB0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlkeDtcbiAgICB9XG5cbiAgICBiYXNlNjQuZGVjb2RlID0gZnVuY3Rpb24ocykge1xuICAgICAgICAvLyBjb252ZXJ0IHRvIHN0cmluZ1xuICAgICAgICBzID0gJycgKyBzO1xuICAgICAgICB2YXIgZ2V0Ynl0ZTY0ID0gYmFzZTY0LmdldGJ5dGU2NDtcbiAgICAgICAgdmFyIHBhZHMsIGksIGIxMDtcbiAgICAgICAgdmFyIGltYXggPSBzLmxlbmd0aFxuICAgICAgICBpZiAoaW1heCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW1heCAlIDQgIT09IDApIHtcbiAgICAgICAgICAgIHRocm93IGJhc2U2NC5tYWtlRE9NRXhjZXB0aW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICBwYWRzID0gMFxuICAgICAgICBpZiAocy5jaGFyQXQoaW1heCAtIDEpID09PSBiYXNlNjQuUEFEQ0hBUikge1xuICAgICAgICAgICAgcGFkcyA9IDE7XG4gICAgICAgICAgICBpZiAocy5jaGFyQXQoaW1heCAtIDIpID09PSBiYXNlNjQuUEFEQ0hBUikge1xuICAgICAgICAgICAgICAgIHBhZHMgPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZWl0aGVyIHdheSwgd2Ugd2FudCB0byBpZ25vcmUgdGhpcyBsYXN0IGJsb2NrXG4gICAgICAgICAgICBpbWF4IC09IDQ7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeCA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaW1heDsgaSArPSA0KSB7XG4gICAgICAgICAgICBiMTAgPSAoZ2V0Ynl0ZTY0KHMsaSkgPDwgMTgpIHwgKGdldGJ5dGU2NChzLGkrMSkgPDwgMTIpIHxcbiAgICAgICAgICAgICAgICAoZ2V0Ynl0ZTY0KHMsaSsyKSA8PCA2KSB8IGdldGJ5dGU2NChzLGkrMyk7XG4gICAgICAgICAgICB4LnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZShiMTAgPj4gMTYsIChiMTAgPj4gOCkgJiAweGZmLCBiMTAgJiAweGZmKSk7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHBhZHMpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgYjEwID0gKGdldGJ5dGU2NChzLGkpIDw8IDE4KSB8IChnZXRieXRlNjQocyxpKzEpIDw8IDEyKSB8IChnZXRieXRlNjQocyxpKzIpIDw8IDYpO1xuICAgICAgICAgICAgeC5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUoYjEwID4+IDE2LCAoYjEwID4+IDgpICYgMHhmZikpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIGIxMCA9IChnZXRieXRlNjQocyxpKSA8PCAxOCkgfCAoZ2V0Ynl0ZTY0KHMsaSsxKSA8PCAxMik7XG4gICAgICAgICAgICB4LnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZShiMTAgPj4gMTYpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4LmpvaW4oJycpO1xuICAgIH1cblxuICAgIGJhc2U2NC5nZXRieXRlID0gZnVuY3Rpb24ocyxpKSB7XG4gICAgICAgIHZhciB4ID0gcy5jaGFyQ29kZUF0KGkpO1xuICAgICAgICBpZiAoeCA+IDI1NSkge1xuICAgICAgICAgICAgdGhyb3cgYmFzZTY0Lm1ha2VET01FeGNlcHRpb24oKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG5cbiAgICBiYXNlNjQuZW5jb2RlID0gZnVuY3Rpb24ocykge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiTm90IGVub3VnaCBhcmd1bWVudHNcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhZGNoYXIgPSBiYXNlNjQuUEFEQ0hBUjtcbiAgICAgICAgdmFyIGFscGhhICAgPSBiYXNlNjQuQUxQSEE7XG4gICAgICAgIHZhciBnZXRieXRlID0gYmFzZTY0LmdldGJ5dGU7XG5cbiAgICAgICAgdmFyIGksIGIxMDtcbiAgICAgICAgdmFyIHggPSBbXTtcblxuICAgICAgICAvLyBjb252ZXJ0IHRvIHN0cmluZ1xuICAgICAgICBzID0gJycgKyBzO1xuXG4gICAgICAgIHZhciBpbWF4ID0gcy5sZW5ndGggLSBzLmxlbmd0aCAlIDM7XG5cbiAgICAgICAgaWYgKHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaW1heDsgaSArPSAzKSB7XG4gICAgICAgICAgICBiMTAgPSAoZ2V0Ynl0ZShzLGkpIDw8IDE2KSB8IChnZXRieXRlKHMsaSsxKSA8PCA4KSB8IGdldGJ5dGUocyxpKzIpO1xuICAgICAgICAgICAgeC5wdXNoKGFscGhhLmNoYXJBdChiMTAgPj4gMTgpKTtcbiAgICAgICAgICAgIHgucHVzaChhbHBoYS5jaGFyQXQoKGIxMCA+PiAxMikgJiAweDNGKSk7XG4gICAgICAgICAgICB4LnB1c2goYWxwaGEuY2hhckF0KChiMTAgPj4gNikgJiAweDNmKSk7XG4gICAgICAgICAgICB4LnB1c2goYWxwaGEuY2hhckF0KGIxMCAmIDB4M2YpKTtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKHMubGVuZ3RoIC0gaW1heCkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBiMTAgPSBnZXRieXRlKHMsaSkgPDwgMTY7XG4gICAgICAgICAgICB4LnB1c2goYWxwaGEuY2hhckF0KGIxMCA+PiAxOCkgKyBhbHBoYS5jaGFyQXQoKGIxMCA+PiAxMikgJiAweDNGKSArXG4gICAgICAgICAgICAgICAgICAgcGFkY2hhciArIHBhZGNoYXIpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIGIxMCA9IChnZXRieXRlKHMsaSkgPDwgMTYpIHwgKGdldGJ5dGUocyxpKzEpIDw8IDgpO1xuICAgICAgICAgICAgeC5wdXNoKGFscGhhLmNoYXJBdChiMTAgPj4gMTgpICsgYWxwaGEuY2hhckF0KChiMTAgPj4gMTIpICYgMHgzRikgK1xuICAgICAgICAgICAgICAgICAgIGFscGhhLmNoYXJBdCgoYjEwID4+IDYpICYgMHgzZikgKyBwYWRjaGFyKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4LmpvaW4oJycpO1xuICAgIH1cblxuICAgIGlmICh3aW5kb3cuYXRvYikge1xuICAgICAgICBkZWNvZGVGdW5jID0gd2luZG93LmF0b2I7XG4gICAgfVxuICAgIGlmICh3aW5kb3cuYnRvYSkge1xuICAgICAgICBlbmNvZGVGdW5jID0gd2luZG93LmJ0b2E7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZGVjb2RlOiBkZWNvZGVGdW5jLFxuICAgICAgICBlbmNvZGU6IGVuY29kZUZ1bmMsXG4gICAgfTtcbn0iLCIhZnVuY3Rpb24oKXtmdW5jdGlvbiB0KHQpe3RoaXMubWVzc2FnZT10fXZhciByPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBleHBvcnRzP2V4cG9ydHM6dGhpcyxlPVwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz1cIjt0LnByb3RvdHlwZT1uZXcgRXJyb3IsdC5wcm90b3R5cGUubmFtZT1cIkludmFsaWRDaGFyYWN0ZXJFcnJvclwiLHIuYnRvYXx8KHIuYnRvYT1mdW5jdGlvbihyKXtmb3IodmFyIG8sbixhPVN0cmluZyhyKSxpPTAsYz1lLGQ9XCJcIjthLmNoYXJBdCgwfGkpfHwoYz1cIj1cIixpJTEpO2QrPWMuY2hhckF0KDYzJm8+PjgtaSUxKjgpKXtpZihuPWEuY2hhckNvZGVBdChpKz0uNzUpLG4+MjU1KXRocm93IG5ldyB0KFwiJ2J0b2EnIGZhaWxlZDogVGhlIHN0cmluZyB0byBiZSBlbmNvZGVkIGNvbnRhaW5zIGNoYXJhY3RlcnMgb3V0c2lkZSBvZiB0aGUgTGF0aW4xIHJhbmdlLlwiKTtvPW88PDh8bn1yZXR1cm4gZH0pLHIuYXRvYnx8KHIuYXRvYj1mdW5jdGlvbihyKXt2YXIgbz1TdHJpbmcocikucmVwbGFjZSgvPSskLyxcIlwiKTtpZihvLmxlbmd0aCU0PT0xKXRocm93IG5ldyB0KFwiJ2F0b2InIGZhaWxlZDogVGhlIHN0cmluZyB0byBiZSBkZWNvZGVkIGlzIG5vdCBjb3JyZWN0bHkgZW5jb2RlZC5cIik7Zm9yKHZhciBuLGEsaT0wLGM9MCxkPVwiXCI7YT1vLmNoYXJBdChjKyspO35hJiYobj1pJTQ/NjQqbithOmEsaSsrJTQpP2QrPVN0cmluZy5mcm9tQ2hhckNvZGUoMjU1Jm4+PigtMippJjYpKTowKWE9ZS5pbmRleE9mKGEpO3JldHVybiBkfSl9KCk7XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGF2aWRjaGFtYmVycy9CYXNlNjQuanMiLCJhbmd1bGFyXG5cdC5tb2R1bGUoJ2FwcCcpXG5cdC5mYWN0b3J5KCdlbWFpbFNlcnZpY2UnLCBlbWFpbFNlcnZpY2UpO1xuXG5mdW5jdGlvbiBlbWFpbFNlcnZpY2UoKSB7XG5cblx0cmV0dXJuIHtcblx0XHRkZWNvZGU6IGRlY29kZSxcblx0XHRlbmNvZGU6IGVuY29kZSxcblx0XHR3cml0ZUVtYWlsOiB3cml0ZUVtYWlsLFxuXHR9O1xuXG5cdGZ1bmN0aW9uIGVuY29kZShvYmplY3QpIHtcblx0XHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkob2JqZWN0KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGRlY29kZShkYXRhKSB7XG5cdFx0cmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XG5cdH1cblxuXHRmdW5jdGlvbiB3cml0ZUVtYWlsKGxpc3QpIHtcblx0XHR2YXIgcmVzdWx0cyA9IFtdO1xuXHRcdHJlc3VsdHMucHVzaChcIj09PT09PT09PT09PT09PT09PT09XCIpO1xuXHRcdHJlc3VsdHMucHVzaChsaXN0Lm5hbWUpO1xuXHRcdHJlc3VsdHMucHVzaChcIj09PT09PT09PT09PT09PT09PT09XCIpO1xuXHRcdHJlc3VsdHMucHVzaChcIlwiKTtcblx0XHRmb3IgKHZhciBpPTA7IGk8bGlzdC5pdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGl0ZW0gPSBsaXN0Lml0ZW1zW2ldO1xuXHRcdFx0cmVzdWx0cy5wdXNoKGl0ZW0udGl0bGUpO1xuXHRcdFx0cmVzdWx0cy5wdXNoKFwiXCIpO1xuXHRcdFx0aWYgKGl0ZW0ubm90ZSkgcmVzdWx0cy5wdXNoKCdOb3RlczogJytpdGVtLm5vdGUpO1xuXHRcdFx0aWYgKGl0ZW0uYXNzaWduKSByZXN1bHRzLnB1c2goJ0Fzc2lnbmVkIHRvICcraXRlbS5hc3NpZ24pO1xuXHRcdFx0cmVzdWx0cy5wdXNoKFwiLS0tLS0tLS0tLS0tLS0tLS0tLS1cIik7XG5cdFx0XHRyZXN1bHRzLnB1c2goXCJcIik7XG5cdFx0fVxuXHRcdHZhciBib2R5ID0gcmVzdWx0cy5qb2luKCclMEEnKTsgLy8gbmV3IGxpbmVcblx0XHRyZXR1cm4gJ21haWx0bzo/Ym9keT0nK2JvZHk7XG5cdH1cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=