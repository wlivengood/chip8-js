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
const getByteString = (instr) => {
	let str = (instr).toString(16);
	while (str.length < 4)
		str = "0".concat(str);
	return str;
}

// Class to hold CHIP-8 processor
let CHIP_8 = {
	// ROM and RAM
	memory: new Uint8Array(4096),

	// 8-bit registers V0,V1,...VF. Used for most data manipulation. 
	// VF is used as a flag (mostly for carries)
	V: new Uint8Array(16),

	// Stack to keep track of previous program counter during subroutine calls. Allows for 16 
	// layers of nested calls
	stack: new Uint16Array(16),

	// 16-bit register, used to hold memory addresses
	I: 0,

	// Pointer to keep track of where we are in the program
	pc: 0,

	// Pointer to keep track of previous point during subroutine calls
	sp: 0,

	// Exposes 2 timers, which decrement when not zero at 60Hz. Sound timer emits a tone 
	// when >0
	delayTimer: 0,
	soundTimer: 0,

	// Draw flag set to true when the display has changed
	drawFlag: false,

	// Buffer to hold key presses
	keyBoard: new Uint8Array(16),

	// Key currently pressed
	currentKey: null,

	// Reference to interval used for timers
	interval: null,

	// Holds pixels, each represented by 1 bit (CHIP-8 only uses 2 colors), for 64x32 display
	graphics: new Uint8Array(64 * 32),

	// Screen display element
	display: null,

	// Start-up flag
	isInitialized: false,

	// Key-press flag
	keyPressed: false,

	initialize() {

		// Clear memory
		this.memory = new Uint8Array(4096);

		// Clear registers
		this.V = new Uint8Array(16);

		// Clear stack
		this.stack = new Uint16Array(16);

		// Clear graphics memory
		this.graphics = new Uint8Array(64 * 32);

		// Clear keyboard
		this.keyBoard = new Uint8Array(16);

		// Reset register I to 0
		this.I = 0;

		// Reset stack pointer to 0
		this.sp = 0;

		// Reset drawFlag to false;
		this.drawFlag = false;

		// Reset timers
		this.delayTimer = 0;
		this.soundTimer = 0;

		// Clear interval and reset to 16 (~60 Hz)
		const tick = this.tick.bind(this);
		if (this.interval)
			window.clearInterval(that.interval);
		this.interval = window.setInterval(tick, 16);

		// Set program counter to 0x200. The first 512 bytes are reserved (originally for the 
		//interpreter itself), so most CHIP-8 programs start at 0x200
		this.pc = 0x200;

		// Load hex sprites into memory. I am using the reserved section because why not.
		this.memory = [...HEX_SPRITES, ...this.memory.slice(HEX_SPRITES.length)];

		console.log(this.memory.slice(0, 0x1FF).map((val) => val.toString(16)));

		// Add event listeners to listen for keyboard events and update internal 
		//represntation of keyboard
		document.onkeyup = this.updateKeyBoard.bind(this);
		document.onkeydown = this.updateKeyBoard.bind(this);

		// Hook into display canvas
		this.display = document.getElementById("display").getContext("2d");

		// Set start-up flag to true
		this.isInitialized = true;
	},

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
	},

	// Update internal representation of keyboard on key events
	updateKeyBoard (e) {
		let key = KEY_MAP[e.key.toUpperCase()];
		if (key)
			this.keyBoard[key] = e.type === "keydown"? true: false;
		this.keyPressed = this.keyBoard.includes(1);
	},

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
	},

	// Decrement timers at ~60 Hz
	tick () {
		if (this.delayTimer)
			this.delayTimer--;
		if (this.soundTimer)
			this.soundTimer--;
	},

	// Each instruction is 2 bytes, but memory slots hold 1 byte, so opcodes
	// must be fetched by shifting an even byte left 8 bits and ORing with
	// the next byte
	fetch () {
		return (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
	},

	// Decode opcode using tree structure based on byte comparisons
	decode (op) {
		return {
			"0000": () => {
				return {
					"00e0": ops.CLS,
					"00ee": ops.RET,
				}[getByteString(op)];
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

				}[getByteString(op & 0xF)];
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
				}[getByteString(op & 0xFF)];
			},
			"f000": () => {
				return {
					"0007": ops.LD_Vx_DT,
					"000A": ops.LD_Vx_K,
					"0015": ops.LD_DT_Vx,
					"0018": ops.LD_ST_Vx,
					"001e": ops.ADD_I_Vx,
					"0029": ops.LD_F_Vx,
					"0033": ops.LD_B_Vx,
					"0055": ops.LD_I_Vx,
					"0065": ops.LD_Vx_I,

				}[getByteString(op & 0xFF)]
			}

		}[getByteString(op & 0xF000)];
	},

	// Execute machine instruction specified by opcode
	execute (instruction, opcode) {
		while (instruction)
			instruction = instruction(opcode);
	},

	cycle () {
		let opcode = this.fetch();
		let instruction = this.decode(opcode);
		this.execute(instruction, opcode);
	}
};