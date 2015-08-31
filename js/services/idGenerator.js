angular
	.module('app')
	.factory('idGenerator', idGenerator);

function idGenerator() {

	return {
		get: getUniqId,
	};

	function getUniqId(length) {
		return (Math.floor(Math.random()*Math.pow(36,length)).toString(36)).slice(-length);
	}
}