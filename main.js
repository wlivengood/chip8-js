let cycleInterval, renderInterval;

const handleFiles = (files) => {
	const file = files[0];
	CHIP_8.initialize();
	CHIP_8.loadROM(file);
}

window.onload = function() {
	if (cycleInterval)
		window.clearInterval(cycleInterval);
	cycleInterval = window.setInterval(function() {
		CHIP_8.cycle();
	}, 1);

	if (renderInterval)
		window.clearInterval(renderInterval);
	renderInterval = window.setInterval(function() {
		if (CHIP_8.isInitialized)
			CHIP_8.render();
	}, 16);
};
