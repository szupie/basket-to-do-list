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