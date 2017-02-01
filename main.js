let interval;

const handleFiles = (files) => {
	const file = files[0];
	let chip8 = new CHIP_8();
	chip8.initialize();
	chip8.loadROM(file);
	if (interval)
		window.clearInterval(interval);
	interval = window.setInterval(() => chip8.run(), 1);
};