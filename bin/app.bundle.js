/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

const CHIP_8 = __webpack_require__(1);
let interval;

const handleFiles = file => {
	let chip8 = new CHIP_8();
	chip8.initialize().loadROM(file);
	if (interval) window.clearInterval(interval);
	interval = window.setInterval(() => chip8.run(), 1);
};

const handleUpload = event => {
	handleFiles(event.target.files[0]);
};

const fetchFile = event => {
	event.target.blur();
	let req = new XMLHttpRequest();
	req.open("GET", "/games/" + event.target.value);
	req.responseType = "blob";
	req.onload = e => {
		let blob = req.response;
		if (blob) {
			handleFiles(blob);
		}
	};
	req.send();
};

module.exports = { fetchFile, handleUpload };

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

const InstructionSet = __webpack_require__(2);

// A group of built-in sprites corresponding to hex digits 0-F
const HEX_SPRITES = [0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
0x20, 0x60, 0x20, 0x20, 0x70, // 1
0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
0x90, 0x90, 0xF0, 0x10, 0x10, // 4
0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
0xF0, 0x10, 0x20, 0x40, 0x40, // 7
0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
0xF0, 0x90, 0xF0, 0x90, 0x90, // A
0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
0xF0, 0x80, 0x80, 0x80, 0xF0, // C
0xE0, 0x90, 0x90, 0x90, 0xE0, // D
0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
0xF0, 0x80, 0xF0, 0x80, 0x80 // F
];

// Map keys to values on old hex keyboard
// Original | New Mapping
// ----------------------
// 1 2 3 C     1 2 3 4
// 4 5 6 D ==> Q W E R
// 7 8 9 E ==> A S D F
// A 0 B F     Z X C V
const KEY_MAP = {
	"1": 0x1,
	"2": 0x2,
	"3": 0x3,
	"4": 0xC,
	"Q": 0x4,
	"W": 0x5,
	"E": 0x6,
	"R": 0xD,
	"A": 0x7,
	"S": 0x8,
	"D": 0x9,
	"F": 0xE,
	"Z": 0xA,
	"X": 0x0,
	"C": 0xB,
	"V": 0xF
};

// Opcode class. Overridden toString prototype method returns constant-length
// string representation for easy parsing during decoding
class Opcode {
	constructor(hex) {
		this.op = hex;
	}

	toString() {
		let str = this.op.toString(16);
		while (str.length < 4) str = "0".concat(str);
		return str;
	}
}

// Class to implement CHIP-8 processor
class CHIP_8 {
	constructor() {
		// 4 KB of memory
		this.memory = new Uint8Array(4096);

		// 16 8-bit registers V0,V1,...VF. Used for most data manipulation. 
		// VF is used as a flag for arithmetic carries and collision detection
		this.V = new Uint8Array(16);

		// Stack to hold 16-bit return addresses during subroutine calls. Allows for 16 
		// layers of nested calls
		this.stack = new Uint16Array(16);

		// Holds implementation of machine operations
		this.ops = new InstructionSet();

		// Pointer to keep track of the most recent return address on the stack
		this.sp = 0;

		// 16-bit register, used to hold memory addresses
		this.I = 0;

		// Pointer to keep track of where we are in the program
		this.pc = 0;

		// Two timers, which decrement when not zero at 60Hz. Sound timer emits a tone 
		// when >0
		this.delayTimer = 0;
		this.soundTimer = 0;

		// Draw flag set to true when the graphics memory has changed
		this.drawFlag = false;

		// Buffer to hold key presses
		this.keyBoard = new Uint8Array(16);

		// Reference to interval used for timers
		this.interval = null;

		// Holds pixels, each represented by 1 bit (CHIP-8 only uses 2 colors), for 64x32 display
		this.graphics = new Uint8Array(64 * 32);

		// Screen display element
		this.display = null;

		// Start-up flag
		this.isInitialized = false;

		// Key-press flag
		this.keyPressed = false;
	}

	initialize() {

		// Clear everything
		this.memory = new Uint8Array(4096);
		this.V = new Uint8Array(16);
		this.stack = new Uint16Array(16);
		this.graphics = new Uint8Array(64 * 32);
		this.keyBoard = new Uint8Array(16);

		this.I = 0;
		this.sp = 0;
		this.drawFlag = false;

		this.delayTimer = 0;
		this.soundTimer = 0;

		// Clear interval and set to 16 (~60 Hz)
		const tick = this.tick.bind(this);
		let interval = this.interval;
		if (interval) window.clearInterval(interval);
		this.interval = window.setInterval(tick, 16);

		// Set program counter to 0x200. The first 512 bytes are reserved (originally for the 
		//interpreter itself), so most CHIP-8 programs start at 0x200
		this.pc = 0x200;

		// Load hex sprites into reserved section of memory
		this.memory = [...HEX_SPRITES, ...this.memory.slice(HEX_SPRITES.length)];

		// Add event listeners to listen for keyboard events and update internal 
		//represntation of keyboard
		document.onkeydown = document.onkeyup = this.updateKeyBoard.bind(this);

		// Hook into display canvas
		this.display = document.getElementById("display").getContext("2d");

		// Set start-up flag to true
		this.isInitialized = true;

		// Return this for method chaining
		return this;
	}

	// Load a binary game file into memory
	loadROM(ROM) {
		let fr = new FileReader();
		let that = this;
		fr.onloadend = () => {
			let buffer = new Uint8Array(fr.result);
			// Game is loaded into memory starting at 0x200 offset
			buffer.forEach((byte, i) => that.memory[i + 0x200] = byte);
		};
		fr.readAsArrayBuffer(ROM);
	}

	// Update internal representation of keyboard on key events
	updateKeyBoard(e) {
		const key = KEY_MAP[e.key.toUpperCase()];
		if (key !== undefined) this.keyBoard[key] = e.type === "keydown" ? 1 : 0;
		this.keyPressed = this.keyBoard.includes(1);
	}

	// If draw flag is set, render graphics stored in graphics memory
	render() {
		if (this.drawFlag) {
			let i, x, y;
			this.display.fillStyle = "black";
			this.display.fillRect(0, 0, 64 * 15, 32 * 15);
			this.display.fillStyle = "white";
			for (i = 0; i < this.graphics.length; i++) {
				if (this.graphics[i]) {
					y = Math.floor(i / 64);
					x = i - y * 64;
					this.display.fillRect(x * 15, y * 15, 15, 15);
				}
			}
		}
		this.drawFlag = false;
	}

	// Decrement timers at ~60 Hz
	tick() {
		if (this.delayTimer) this.delayTimer--;
		if (this.soundTimer) this.soundTimer--;
	}

	// Each instruction is 2 bytes, but memory slots hold 1 byte, so opcodes
	// must be fetched by shifting an even byte left 8 bits and ORing with
	// the next byte
	fetch() {
		return this.memory[this.pc] << 8 | this.memory[this.pc + 1];
	}

	// Decode opcode using tree structure based on byte comparisons
	decode(op) {
		return {
			"0000": () => {
				return {
					"00e0": this.ops.CLS,
					"00ee": this.ops.RET
				}[new Opcode(op)];
			},
			"1000": this.ops.JP_addr,
			"2000": this.ops.CALL_addr,
			"3000": this.ops.SE_Vx_byte,
			"4000": this.ops.SNE_Vx_byte,
			"5000": this.ops.SE_Vx_Vy,
			"6000": this.ops.LD_Vx_byte,
			"7000": this.ops.ADD_Vx_byte,
			"8000": () => {
				return {
					"0000": this.ops.LD_Vx_Vy,
					"0001": this.ops.OR_Vx_Vy,
					"0002": this.ops.AND_Vx_Vy,
					"0003": this.ops.XOR_Vx_Vy,
					"0004": this.ops.ADD_Vx_Vy,
					"0005": this.ops.SUB_Vx_Vy,
					"0006": this.ops.SHR_Vx,
					"0007": this.ops.SUBN_Vx_Vy,
					"000e": this.ops.SHL_Vx

				}[new Opcode(op & 0xF)];
			},
			"9000": this.ops.SNE_Vx_Vy,
			"a000": this.ops.LD_I_addr,
			"b000": this.ops.JP_V0_addr,
			"c000": this.ops.RND_Vx_byte,
			"d000": this.ops.DRW_Vx_Vy_nibble,
			"e000": () => {
				return {
					"009e": this.ops.SKP_Vx,
					"00a1": this.ops.SKNP_Vx
				}[new Opcode(op & 0xFF)];
			},
			"f000": () => {
				return {
					"0007": this.ops.LD_Vx_DT,
					"000a": this.ops.LD_Vx_K,
					"0015": this.ops.LD_DT_Vx,
					"0018": this.ops.LD_ST_Vx,
					"001e": this.ops.ADD_I_Vx,
					"0029": this.ops.LD_F_Vx,
					"0033": this.ops.LD_B_Vx,
					"0055": this.ops.LD_I_Vx,
					"0065": this.ops.LD_Vx_I

				}[new Opcode(op & 0xFF)];
			}
		}[new Opcode(op & 0xF000)];
	}

	// Execute machine instruction specified by opcode. 
	// (Keep calling result of function calls to move through tree)
	execute(instruction, opcode) {
		while (instruction) instruction = instruction.call(this, opcode);
	}

	// Execute one iteration of the fetch-decode-execute cycle
	cycle() {
		if (this.isInitialized) {
			let opcode = this.fetch();
			let instruction = this.decode(opcode);
			this.execute(instruction, opcode);
		}
	}

	// Run a CPU cycle and, if necessary, update the display
	run() {
		this.cycle();
		this.render();
	}
};

module.exports = CHIP_8;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

class InstructionSet {

	// 00E0 - Clear the screen and move to next instruction
	CLS() {
		this.graphics = new Uint8Array(64 * 32);
		this.drawFlag = true;
		this.pc += 2;
	}

	// 00EE- Return from subroutine and move to next instruction
	RET() {
		this.sp--;
		this.pc = this.stack[this.sp];
		this.pc += 2;
	}

	// 1nnn - Jump to instruction located at nnn
	JP_addr(op) {
		this.pc = op & 0xFFF;
	}

	// 2nnn - Call subroutine located at nnn, saving previous location on stack
	CALL_addr(op) {
		this.stack[this.sp] = this.pc;
		this.sp++;
		this.pc = op & 0xFFF;
	}

	// 3xkk - Skip next instruction if Vx === kk
	SE_Vx_byte(op) {
		this.pc += this.V[(op & 0xF00) >> 8] === (op & 0xFF) ? 4 : 2;
	}

	// 4xkk - Skip next instruction if Vx !== kk
	SNE_Vx_byte(op) {
		this.pc += this.V[(op & 0xF00) >> 8] !== (op & 0xFF) ? 4 : 2;
	}

	// 5xy0 - Skip next instruction if Vx === Vy
	SE_Vx_Vy(op) {
		this.pc += this.V[(op & 0xF00) >> 8] === this.V[(op & 0xF0) >> 4] ? 4 : 2;
	}

	// 6xkk - Set Vx = kk
	LD_Vx_byte(op) {
		this.V[(op & 0xF00) >> 8] = op & 0xFF;
		this.pc += 2;
	}

	// 7xkk - Set Vx = Vx + kk
	ADD_Vx_byte(op) {
		this.V[(op & 0xF00) >> 8] += op & 0xFF;
		this.pc += 2;
	}

	// 8xy0 - Set Vx = Vy
	LD_Vx_Vy(op) {
		this.V[(op & 0xF00) >> 8] = this.V[(op & 0xF0) >> 4];
		this.pc += 2;
	}

	// 8xy1 - Set Vx = Vy OR Vx
	OR_Vx_Vy(op) {
		this.V[(op & 0xF00) >> 8] |= this.V[(op & 0xF0) >> 4];
		this.pc += 2;
	}

	// 8xy2 - Set Vx = Vy AND Vx
	AND_Vx_Vy(op) {
		this.V[(op & 0xF00) >> 8] &= this.V[(op & 0xF0) >> 4];
		this.pc += 2;
	}

	// 8xy3 - Set Vx = Vy XOR Vx
	XOR_Vx_Vy(op) {
		this.V[(op & 0xF00) >> 8] ^= this.V[(op & 0xF0) >> 4];
		this.pc += 2;
	}

	// 8xy4 - Set Vx = Vx + Vy, set Vf = 1 if Vx + Vy > 255
	ADD_Vx_Vy(op) {
		let x = (op & 0xF00) >> 8,
		    y = (op & 0xF0) >> 4;
		this.V[0xF] = this.V[x] + this.V[y] > 0xFF ? 1 : 0;
		this.V[x] += this.V[y];
		this.pc += 2;
	}

	// 8xy5 - If Vx > Vy, set Vf = 0, otherwise 1. Set Vx = Vx - Vy
	SUB_Vx_Vy(op) {
		let x = (op & 0xF00) >> 8,
		    y = (op & 0xF0) >> 4;
		this.V[0xF] = this.V[y] > this.V[x] ? 0 : 1;
		this.V[x] -= this.V[y];
		this.pc += 2;
	}

	// 8xy6 - If the least-significant bit of Vx is 1, set VF = 1, else 0. Vx /= 2
	SHR_Vx(op) {
		let x = (op & 0xF00) >> 8;
		this.V[0xF] = this.V[x] & 1;
		this.V[x] >>= 1;
		this.pc += 2;
	}

	// 8xy7 - If Vy > Vx, set Vf = 1, else 0. Vx = Vy - Vx
	SUBN_Vx_Vy(op) {
		let x = (op & 0xF00) >> 8,
		    y = (op & 0xF0) >> 4;
		this.V[0xF] = this.V[x] > this.V[y] ? 0 : 1;
		this.V[x] = this.V[y] - this.V[x];
		this.pc += 2;
	}

	// 8xyE - If the most-significant bit of Vx is 1, set VF = 1, else 0. Vx *= 2
	SHL_Vx(op) {
		let x = (op & 0xF00) >> 8;
		this.V[0xF] = this.V[x] >> 7;
		this.V[x] <<= 1;
		this.pc += 2;
	}

	// 9xy0 - Skip next instruction if Vx !== Vy
	SNE_Vx_Vy(op) {
		this.pc += this.V[(op & 0xF00) >> 8] === this.V[(op & 0xF0) >> 4] ? 2 : 4;
	}

	// Annn - Set I = nnn
	LD_I_addr(op) {
		this.I = op & 0xFFF;
		this.pc += 2;
	}

	// Bnnn - Jump to instruction located at nnn + V0
	JP_V0_addr(op) {
		this.pc = (op & 0xFFF) + this.V[0];
	}

	// Cxkk - Set Vx = to kk AND random byte
	RND_Vx_byte(op) {
		this.V[(op & 0xF00) >> 8] = op & 0xFF & Math.floor(Math.random() * 0xFF);
		this.pc += 2;
	}

	// Dxyn - Display at coordinate (Vx, Vy) n-byte sprite starting at 
	// location stored in I. Set Vf = 1 if collision occurs, else 0.
	// Set draw flag to true
	DRW_Vx_Vy_nibble(op) {
		const x = this.V[(op & 0xF00) >> 8];
		const y = this.V[(op & 0xF0) >> 4];
		const height = op & 0xF;
		let row, spriteRow, col;
		this.V[0xF] = 0;
		for (col = 0; col < height; col++) {
			spriteRow = this.memory[this.I + col];
			for (row = 0; row < 8; row++) {
				if (spriteRow & 0x80 >> row) {
					if (this.graphics[x + row + 64 * (y + col)]) this.V[0xF] = 1;
					this.graphics[x + row + 64 * (y + col)] ^= 1;
				}
			}
		}
		this.drawFlag = true;
		this.pc += 2;
	}

	// Ex9E - Skip next instruction if key with value stored in Vx is pressed
	SKP_Vx(op) {
		this.pc += this.keyBoard[this.V[(op & 0xF00) >> 8]] ? 4 : 2;
	}

	// ExA1 - Skip next instruction if key with value stored in Vx is NOT pressed
	SKNP_Vx(op) {
		this.pc += !this.keyBoard[this.V[(op & 0xF00) >> 8]] ? 4 : 2;
	}

	// Fx07 - Set Vx = value stored in delay timer
	LD_Vx_DT(op) {
		this.V[(op & 0xF00) >> 8] = this.delayTimer;
		this.pc += 2;
	}

	// Fx0A - Wait for a key press, store value of the key in Vx
	LD_Vx_K(op) {
		this.keyBoard.forEach((val, idx) => {
			if (val) {
				console.log(val);
				this.V[(op & 0xF00) >> 8] = idx;
				this.pc += 2;
				return;
			}
		});
	}

	// Fx15 - Set delay timer = Vx
	LD_DT_Vx(op) {
		this.delayTimer = this.V[(op & 0xF00) >> 8];
		this.pc += 2;
	}

	// Fx18 - Set sound timer = Vx
	LD_ST_Vx(op) {
		this.soundTimer = this.V[(op & 0xF00) >> 8];
		this.pc += 2;
	}

	// Fx1E - Set I = I + Vx
	ADD_I_Vx(op) {
		let x = (op & 0xF00) >> 8;
		this.V[0xF] = this.V[x] + this.I > 0xFFF ? 1 : 0;
		this.I += this.V[x];
		this.pc += 2;
	}

	// Fx29 - Set I = location of sprite for digit Vx
	LD_F_Vx(op) {
		this.I = this.V[(op & 0xF00) >> 8] * 5;
		this.pc += 2;
	}

	// Fx33 - Store BCD represntation of Vx in locations I, I+1, I+2
	LD_B_Vx(op) {
		let val = this.V[(op & 0xF00) >> 8];
		for (let i = 2; i >= 0; i--) {
			this.memory[this.I + i] = val % 10;
			val = Math.floor(val / 10);
		}
		this.pc += 2;
	}

	// Fx55 - Store registers V0 through Vx in memory starting at location I
	LD_I_Vx(op) {
		let i = 0;
		while (i <= (op & 0xF00) >> 8) {
			this.memory[this.I + i] = this.V[i];
			i++;
		}
		this.pc += 2;
	}

	// Fx65 - Read registers V0 through Vx from memory starting at location I
	LD_Vx_I(op) {
		let i = 0;
		while (i <= (op & 0xF00) >> 8) {
			this.V[i] = this.memory[this.I + i];
			i++;
		}
		this.pc += 2;
	}
};

module.exports = InstructionSet;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

const { fetchFile, handleUpload } = __webpack_require__(0);

(function () {
	document.addEventListener('DOMContentLoaded', function () {
		document.querySelector('select[name="games"]').onchange = fetchFile;
	}, false);

	document.addEventListener('DOMContentLoaded', function () {
		var fileInput = document.getElementById("fileInput");
		fileInput.addEventListener("change", handleUpload, false);
	}, false);
})();

/***/ })
/******/ ]);