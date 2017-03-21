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

"use strict";


var CHIP_8 = __webpack_require__(1);
var interval = void 0;

var handleFiles = function handleFiles(file) {
	var chip8 = new CHIP_8();
	chip8.initialize().loadROM(file);
	if (interval) window.clearInterval(interval);
	interval = window.setInterval(function () {
		return chip8.run();
	}, 1);
};

var handleUpload = function handleUpload(event) {
	handleFiles(event.target.files[0]);
};

var fetchFile = function fetchFile(event) {
	event.target.blur();
	var req = new XMLHttpRequest();
	req.open("GET", "/games/" + event.target.value);
	req.responseType = "blob";
	req.onload = function (e) {
		var blob = req.response;
		if (blob) {
			handleFiles(blob);
		}
	};
	req.send();
};

module.exports = { fetchFile: fetchFile, handleUpload: handleUpload };

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var InstructionSet = __webpack_require__(2);

// A group of built-in sprites corresponding to hex digits 0-F
var HEX_SPRITES = [0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
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
var KEY_MAP = {
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

var Opcode = function () {
	function Opcode(hex) {
		_classCallCheck(this, Opcode);

		this.op = hex;
	}

	_createClass(Opcode, [{
		key: "toString",
		value: function toString() {
			var str = this.op.toString(16);
			while (str.length < 4) {
				str = "0".concat(str);
			}return str;
		}
	}]);

	return Opcode;
}();

// Class to implement CHIP-8 processor


var CHIP_8 = function () {
	function CHIP_8() {
		_classCallCheck(this, CHIP_8);

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

	_createClass(CHIP_8, [{
		key: "initialize",
		value: function initialize() {

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
			var tick = this.tick.bind(this);
			var interval = this.interval;
			if (interval) window.clearInterval(interval);
			this.interval = window.setInterval(tick, 16);

			// Set program counter to 0x200. The first 512 bytes are reserved (originally for the 
			//interpreter itself), so most CHIP-8 programs start at 0x200
			this.pc = 0x200;

			// Load hex sprites into reserved section of memory
			this.memory = [].concat(HEX_SPRITES, _toConsumableArray(this.memory.slice(HEX_SPRITES.length)));

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

	}, {
		key: "loadROM",
		value: function loadROM(ROM) {
			var fr = new FileReader();
			var that = this;
			fr.onloadend = function () {
				var buffer = new Uint8Array(fr.result);
				// Game is loaded into memory starting at 0x200 offset
				buffer.forEach(function (byte, i) {
					return that.memory[i + 0x200] = byte;
				});
			};
			fr.readAsArrayBuffer(ROM);
		}

		// Update internal representation of keyboard on key events

	}, {
		key: "updateKeyBoard",
		value: function updateKeyBoard(e) {
			var key = KEY_MAP[e.key.toUpperCase()];
			if (key !== undefined) this.keyBoard[key] = e.type === "keydown" ? 1 : 0;
			this.keyPressed = this.keyBoard.includes(1);
		}

		// If draw flag is set, render graphics stored in graphics memory

	}, {
		key: "render",
		value: function render() {
			if (this.drawFlag) {
				var i = void 0,
				    x = void 0,
				    y = void 0;
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

	}, {
		key: "tick",
		value: function tick() {
			if (this.delayTimer) this.delayTimer--;
			if (this.soundTimer) this.soundTimer--;
		}

		// Each instruction is 2 bytes, but memory slots hold 1 byte, so opcodes
		// must be fetched by shifting an even byte left 8 bits and ORing with
		// the next byte

	}, {
		key: "fetch",
		value: function fetch() {
			return this.memory[this.pc] << 8 | this.memory[this.pc + 1];
		}

		// Decode opcode using tree structure based on byte comparisons

	}, {
		key: "decode",
		value: function decode(op) {
			var _this = this;

			return {
				"0000": function _() {
					return {
						"00e0": _this.ops.CLS,
						"00ee": _this.ops.RET
					}[new Opcode(op)];
				},
				"1000": this.ops.JP_addr,
				"2000": this.ops.CALL_addr,
				"3000": this.ops.SE_Vx_byte,
				"4000": this.ops.SNE_Vx_byte,
				"5000": this.ops.SE_Vx_Vy,
				"6000": this.ops.LD_Vx_byte,
				"7000": this.ops.ADD_Vx_byte,
				"8000": function _() {
					return {
						"0000": _this.ops.LD_Vx_Vy,
						"0001": _this.ops.OR_Vx_Vy,
						"0002": _this.ops.AND_Vx_Vy,
						"0003": _this.ops.XOR_Vx_Vy,
						"0004": _this.ops.ADD_Vx_Vy,
						"0005": _this.ops.SUB_Vx_Vy,
						"0006": _this.ops.SHR_Vx,
						"0007": _this.ops.SUBN_Vx_Vy,
						"000e": _this.ops.SHL_Vx

					}[new Opcode(op & 0xF)];
				},
				"9000": this.ops.SNE_Vx_Vy,
				"a000": this.ops.LD_I_addr,
				"b000": this.ops.JP_V0_addr,
				"c000": this.ops.RND_Vx_byte,
				"d000": this.ops.DRW_Vx_Vy_nibble,
				"e000": function e000() {
					return {
						"009e": _this.ops.SKP_Vx,
						"00a1": _this.ops.SKNP_Vx
					}[new Opcode(op & 0xFF)];
				},
				"f000": function f000() {
					return {
						"0007": _this.ops.LD_Vx_DT,
						"000a": _this.ops.LD_Vx_K,
						"0015": _this.ops.LD_DT_Vx,
						"0018": _this.ops.LD_ST_Vx,
						"001e": _this.ops.ADD_I_Vx,
						"0029": _this.ops.LD_F_Vx,
						"0033": _this.ops.LD_B_Vx,
						"0055": _this.ops.LD_I_Vx,
						"0065": _this.ops.LD_Vx_I

					}[new Opcode(op & 0xFF)];
				}
			}[new Opcode(op & 0xF000)];
		}

		// Execute machine instruction specified by opcode. 
		// (Keep calling result of function calls to move through tree)

	}, {
		key: "execute",
		value: function execute(instruction, opcode) {
			while (instruction) {
				instruction = instruction.call(this, opcode);
			}
		}

		// Execute one iteration of the fetch-decode-execute cycle

	}, {
		key: "cycle",
		value: function cycle() {
			if (this.isInitialized) {
				var opcode = this.fetch();
				var instruction = this.decode(opcode);
				this.execute(instruction, opcode);
			}
		}

		// Run a CPU cycle and, if necessary, update the display

	}, {
		key: "run",
		value: function run() {
			this.cycle();
			this.render();
		}
	}]);

	return CHIP_8;
}();

;

module.exports = CHIP_8;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var InstructionSet = function () {
	function InstructionSet() {
		_classCallCheck(this, InstructionSet);
	}

	_createClass(InstructionSet, [{
		key: "CLS",


		// 00E0 - Clear the screen and move to next instruction
		value: function CLS() {
			this.graphics = new Uint8Array(64 * 32);
			this.drawFlag = true;
			this.pc += 2;
		}

		// 00EE- Return from subroutine and move to next instruction

	}, {
		key: "RET",
		value: function RET() {
			this.sp--;
			this.pc = this.stack[this.sp];
			this.pc += 2;
		}

		// 1nnn - Jump to instruction located at nnn

	}, {
		key: "JP_addr",
		value: function JP_addr(op) {
			this.pc = op & 0xFFF;
		}

		// 2nnn - Call subroutine located at nnn, saving previous location on stack

	}, {
		key: "CALL_addr",
		value: function CALL_addr(op) {
			this.stack[this.sp] = this.pc;
			this.sp++;
			this.pc = op & 0xFFF;
		}

		// 3xkk - Skip next instruction if Vx === kk

	}, {
		key: "SE_Vx_byte",
		value: function SE_Vx_byte(op) {
			this.pc += this.V[(op & 0xF00) >> 8] === (op & 0xFF) ? 4 : 2;
		}

		// 4xkk - Skip next instruction if Vx !== kk

	}, {
		key: "SNE_Vx_byte",
		value: function SNE_Vx_byte(op) {
			this.pc += this.V[(op & 0xF00) >> 8] !== (op & 0xFF) ? 4 : 2;
		}

		// 5xy0 - Skip next instruction if Vx === Vy

	}, {
		key: "SE_Vx_Vy",
		value: function SE_Vx_Vy(op) {
			this.pc += this.V[(op & 0xF00) >> 8] === this.V[(op & 0xF0) >> 4] ? 4 : 2;
		}

		// 6xkk - Set Vx = kk

	}, {
		key: "LD_Vx_byte",
		value: function LD_Vx_byte(op) {
			this.V[(op & 0xF00) >> 8] = op & 0xFF;
			this.pc += 2;
		}

		// 7xkk - Set Vx = Vx + kk

	}, {
		key: "ADD_Vx_byte",
		value: function ADD_Vx_byte(op) {
			this.V[(op & 0xF00) >> 8] += op & 0xFF;
			this.pc += 2;
		}

		// 8xy0 - Set Vx = Vy

	}, {
		key: "LD_Vx_Vy",
		value: function LD_Vx_Vy(op) {
			this.V[(op & 0xF00) >> 8] = this.V[(op & 0xF0) >> 4];
			this.pc += 2;
		}

		// 8xy1 - Set Vx = Vy OR Vx

	}, {
		key: "OR_Vx_Vy",
		value: function OR_Vx_Vy(op) {
			this.V[(op & 0xF00) >> 8] |= this.V[(op & 0xF0) >> 4];
			this.pc += 2;
		}

		// 8xy2 - Set Vx = Vy AND Vx

	}, {
		key: "AND_Vx_Vy",
		value: function AND_Vx_Vy(op) {
			this.V[(op & 0xF00) >> 8] &= this.V[(op & 0xF0) >> 4];
			this.pc += 2;
		}

		// 8xy3 - Set Vx = Vy XOR Vx

	}, {
		key: "XOR_Vx_Vy",
		value: function XOR_Vx_Vy(op) {
			this.V[(op & 0xF00) >> 8] ^= this.V[(op & 0xF0) >> 4];
			this.pc += 2;
		}

		// 8xy4 - Set Vx = Vx + Vy, set Vf = 1 if Vx + Vy > 255

	}, {
		key: "ADD_Vx_Vy",
		value: function ADD_Vx_Vy(op) {
			var x = (op & 0xF00) >> 8,
			    y = (op & 0xF0) >> 4;
			this.V[0xF] = this.V[x] + this.V[y] > 0xFF ? 1 : 0;
			this.V[x] += this.V[y];
			this.pc += 2;
		}

		// 8xy5 - If Vx > Vy, set Vf = 0, otherwise 1. Set Vx = Vx - Vy

	}, {
		key: "SUB_Vx_Vy",
		value: function SUB_Vx_Vy(op) {
			var x = (op & 0xF00) >> 8,
			    y = (op & 0xF0) >> 4;
			this.V[0xF] = this.V[y] > this.V[x] ? 0 : 1;
			this.V[x] -= this.V[y];
			this.pc += 2;
		}

		// 8xy6 - If the least-significant bit of Vx is 1, set VF = 1, else 0. Vx /= 2

	}, {
		key: "SHR_Vx",
		value: function SHR_Vx(op) {
			var x = (op & 0xF00) >> 8;
			this.V[0xF] = this.V[x] & 1;
			this.V[x] >>= 1;
			this.pc += 2;
		}

		// 8xy7 - If Vy > Vx, set Vf = 1, else 0. Vx = Vy - Vx

	}, {
		key: "SUBN_Vx_Vy",
		value: function SUBN_Vx_Vy(op) {
			var x = (op & 0xF00) >> 8,
			    y = (op & 0xF0) >> 4;
			this.V[0xF] = this.V[x] > this.V[y] ? 0 : 1;
			this.V[x] = this.V[y] - this.V[x];
			this.pc += 2;
		}

		// 8xyE - If the most-significant bit of Vx is 1, set VF = 1, else 0. Vx *= 2

	}, {
		key: "SHL_Vx",
		value: function SHL_Vx(op) {
			var x = (op & 0xF00) >> 8;
			this.V[0xF] = this.V[x] >> 7;
			this.V[x] <<= 1;
			this.pc += 2;
		}

		// 9xy0 - Skip next instruction if Vx !== Vy

	}, {
		key: "SNE_Vx_Vy",
		value: function SNE_Vx_Vy(op) {
			this.pc += this.V[(op & 0xF00) >> 8] === this.V[(op & 0xF0) >> 4] ? 2 : 4;
		}

		// Annn - Set I = nnn

	}, {
		key: "LD_I_addr",
		value: function LD_I_addr(op) {
			this.I = op & 0xFFF;
			this.pc += 2;
		}

		// Bnnn - Jump to instruction located at nnn + V0

	}, {
		key: "JP_V0_addr",
		value: function JP_V0_addr(op) {
			this.pc = (op & 0xFFF) + this.V[0];
		}

		// Cxkk - Set Vx = to kk AND random byte

	}, {
		key: "RND_Vx_byte",
		value: function RND_Vx_byte(op) {
			this.V[(op & 0xF00) >> 8] = op & 0xFF & Math.floor(Math.random() * 0xFF);
			this.pc += 2;
		}

		// Dxyn - Display at coordinate (Vx, Vy) n-byte sprite starting at 
		// location stored in I. Set Vf = 1 if collision occurs, else 0.
		// Set draw flag to true

	}, {
		key: "DRW_Vx_Vy_nibble",
		value: function DRW_Vx_Vy_nibble(op) {
			var x = this.V[(op & 0xF00) >> 8];
			var y = this.V[(op & 0xF0) >> 4];
			var height = op & 0xF;
			var row = void 0,
			    spriteRow = void 0,
			    col = void 0;
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

	}, {
		key: "SKP_Vx",
		value: function SKP_Vx(op) {
			this.pc += this.keyBoard[this.V[(op & 0xF00) >> 8]] ? 4 : 2;
		}

		// ExA1 - Skip next instruction if key with value stored in Vx is NOT pressed

	}, {
		key: "SKNP_Vx",
		value: function SKNP_Vx(op) {
			this.pc += !this.keyBoard[this.V[(op & 0xF00) >> 8]] ? 4 : 2;
		}

		// Fx07 - Set Vx = value stored in delay timer

	}, {
		key: "LD_Vx_DT",
		value: function LD_Vx_DT(op) {
			this.V[(op & 0xF00) >> 8] = this.delayTimer;
			this.pc += 2;
		}

		// Fx0A - Wait for a key press, store value of the key in Vx

	}, {
		key: "LD_Vx_K",
		value: function LD_Vx_K(op) {
			var _this = this;

			this.keyBoard.forEach(function (val, idx) {
				if (val) {
					console.log(val);
					_this.V[(op & 0xF00) >> 8] = idx;
					_this.pc += 2;
					return;
				}
			});
		}

		// Fx15 - Set delay timer = Vx

	}, {
		key: "LD_DT_Vx",
		value: function LD_DT_Vx(op) {
			this.delayTimer = this.V[(op & 0xF00) >> 8];
			this.pc += 2;
		}

		// Fx18 - Set sound timer = Vx

	}, {
		key: "LD_ST_Vx",
		value: function LD_ST_Vx(op) {
			this.soundTimer = this.V[(op & 0xF00) >> 8];
			this.pc += 2;
		}

		// Fx1E - Set I = I + Vx

	}, {
		key: "ADD_I_Vx",
		value: function ADD_I_Vx(op) {
			var x = (op & 0xF00) >> 8;
			this.V[0xF] = this.V[x] + this.I > 0xFFF ? 1 : 0;
			this.I += this.V[x];
			this.pc += 2;
		}

		// Fx29 - Set I = location of sprite for digit Vx

	}, {
		key: "LD_F_Vx",
		value: function LD_F_Vx(op) {
			this.I = this.V[(op & 0xF00) >> 8] * 5;
			this.pc += 2;
		}

		// Fx33 - Store BCD represntation of Vx in locations I, I+1, I+2

	}, {
		key: "LD_B_Vx",
		value: function LD_B_Vx(op) {
			var val = this.V[(op & 0xF00) >> 8];
			for (var i = 2; i >= 0; i--) {
				this.memory[this.I + i] = val % 10;
				val = Math.floor(val / 10);
			}
			this.pc += 2;
		}

		// Fx55 - Store registers V0 through Vx in memory starting at location I

	}, {
		key: "LD_I_Vx",
		value: function LD_I_Vx(op) {
			var i = 0;
			while (i <= (op & 0xF00) >> 8) {
				this.memory[this.I + i] = this.V[i];
				i++;
			}
			this.pc += 2;
		}

		// Fx65 - Read registers V0 through Vx from memory starting at location I

	}, {
		key: "LD_Vx_I",
		value: function LD_Vx_I(op) {
			var i = 0;
			while (i <= (op & 0xF00) >> 8) {
				this.V[i] = this.memory[this.I + i];
				i++;
			}
			this.pc += 2;
		}
	}]);

	return InstructionSet;
}();

;

module.exports = InstructionSet;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _require = __webpack_require__(0),
    fetchFile = _require.fetchFile,
    handleUpload = _require.handleUpload;

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