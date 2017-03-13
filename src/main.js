const {fetchFile, handleUpload} = require('./handlers');

(function () {
	document.addEventListener('DOMContentLoaded',function() {
	    document.querySelector('select[name="games"]').onchange=fetchFile;
	},false);

	document.addEventListener('DOMContentLoaded', function() {
		var fileInput = document.getElementById("fileInput");
		fileInput.addEventListener("change", handleUpload, false);
	}, false);
})();
