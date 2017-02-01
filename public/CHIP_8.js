// A group of built-in sprites corresponding to hex digits 0-F
const HEX_SPRITES = [
	  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
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
	  0xF0, 0x80, 0xF0, 0x80, 0x80  // F
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
}

// Returns constant-length string representation of hex instruction
// const getByteString = (instr) => {
// 	let str = (instr).toString(16);
// 	while (str.length < 4)
// 		str = "0".concat(str);
// 	return str;
// }
class Opcode {
	constructor(hex) {
		this.op = hex;
	}

	toString() {
		let str = (this.op).toString(16);
		while (str.length < 4)
			str = "0".concat(str);
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
		if (this.interval)
			window.clearInterval(that.interval);
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
	}

	// Load a binary game file into memory
	loadROM (ROM) {
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
	updateKeyBoard (e) {
		const key = KEY_MAP[e.key.toUpperCase()];
		if (key !== undefined)
			this.keyBoard[key] = e.type === "keydown"? 1: 0;
		this.keyPressed = this.keyBoard.includes(1);
	}

	// If draw flag is set, render graphics stored in graphics memory
	render () {
		if (this.drawFlag) {
			let i, x, y;
			this.display.fillStyle = "black";
			this.display.fillRect(0, 0, 64*15, 32*15);
			this.display.fillStyle = "white";
			for (i = 0; i < this.graphics.length; i++) {
				if (this.graphics[i]) {
					y = Math.floor(i / 64);
					x = (i - y * 64);
					this.display.fillRect(x*15, y*15, 15, 15);
				}
			}
		}
		this.drawFlag = false;
	}

	// Decrement timers at ~60 Hz
	tick () {
		if (this.delayTimer)
			this.delayTimer--;
		if (this.soundTimer)
			this.soundTimer--;
	}

	// Each instruction is 2 bytes, but memory slots hold 1 byte, so opcodes
	// must be fetched by shifting an even byte left 8 bits and ORing with
	// the next byte
	fetch () {
		return (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
	}

	// Decode opcode using tree structure based on byte comparisons
	decode (op) {
		return {
			"0000": () => {
				return {
					"00e0": ops.CLS,
					"00ee": ops.RET,
				}[new Opcode(op)];
			},
			"1000": ops.JP_addr,
			"2000": ops.CALL_addr,
			"3000": ops.SE_Vx_byte,
			"4000": ops.SNE_Vx_byte,
			"5000": ops.SE_Vx_Vy,
			"6000": ops.LD_Vx_byte,
			"7000": ops.ADD_Vx_byte,
			"8000": () => {
				return {
					"0000": ops.LD_Vx_Vy,
					"0001": ops.OR_Vx_Vy,
					"0002": ops.AND_Vx_Vy,
					"0003": ops.XOR_Vx_Vy,
					"0004": ops.ADD_Vx_Vy,
					"0005": ops.SUB_Vx_Vy,
					"0006": ops.SHR_Vx,
					"0007": ops.SUBN_Vx_Vy,
					"000e": ops.SHL_Vx

				}[new Opcode(op & 0xF)];
			},
			"9000": ops.SNE_Vx_Vy,
			"a000": ops.LD_I_addr,
			"b000": ops.JP_V0_addr,
			"c000": ops.RND_Vx_byte,
			"d000": ops.DRW_Vx_Vy_nibble,
			"e000": () => {
				return {
					"009e": ops.SKP_Vx,
					"00a1": ops.SKNP_Vx
				}[new Opcode(op & 0xFF)];
			},
			"f000": () => {
				return {
					"0007": ops.LD_Vx_DT,
					"000a": ops.LD_Vx_K,
					"0015": ops.LD_DT_Vx,
					"0018": ops.LD_ST_Vx,
					"001e": ops.ADD_I_Vx,
					"0029": ops.LD_F_Vx,
					"0033": ops.LD_B_Vx,
					"0055": ops.LD_I_Vx,
					"0065": ops.LD_Vx_I,

				}[new Opcode(op & 0xFF)];
			}
		}[new Opcode(op & 0xF000)];
	}

	// Execute machine instruction specified by opcode. 
	// (Keep calling result of function calls to move through tree)
	execute (instruction, opcode) {
		while (instruction) {
			console.log(instruction);
			instruction = instruction.call(this, opcode);
		}
	}

	// Execute one iteration of the fetch-decode-execute cycle
	cycle () {
		if (this.isInitialized) {
			let opcode = this.fetch();
			let instruction = this.decode.call(this, opcode);
			this.execute(instruction, opcode);
		}
	}

	// Run a CPU cycle and, if necessary, update the display
	run () {
		this.cycle();
		this.render();
	}
};