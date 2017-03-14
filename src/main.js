const {fetchFile, handleUpload} = require('./handlers');

(function () {
	document.addEventListener('DOMContentLoaded',() => {
	    document.querySelector('select[name="games"]').onchange=fetchFile;
	},false);

	document.addEventListener('DOMContentLoaded', () => {
		let fileInput = document.getElementById("fileInput");
		fileInput.addEventListener("change", handleUpload, false);
	}, false);
})();
