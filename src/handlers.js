const CHIP_8 = require('./CHIP_8');
let interval;

const handleFiles = (event) => {
	let file = event.target.files[0];
	let chip8 = new CHIP_8();
	chip8.initialize().loadROM(file);
	if (interval)
		window.clearInterval(interval);
	interval = window.setInterval(() => chip8.run(), 1);
};

const fetchFile = (event) => {
	event.target.blur();
	let req = new XMLHttpRequest();
	req.open("GET", "/games/" + event.target.value);
	req.responseType = "blob";
	req.onload = (e) => {
		let blob = req.response;
		if (blob) {
			handleFiles(blob);
		}
	};
	req.send();
};

export {handleFiles, fetchFile};