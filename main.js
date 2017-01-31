let chip8, interval;

const handleFiles = (files) => {
	const file = files[0];
	chip8.initialize();
	chip8.loadROM(file);
};

window.onload = function() {
	chip8 = new CHIP_8();
	if (interval)
		window.clearInterval(interval);
	interval = window.setInterval(() => chip8.run(), 1);
};