const ops = {

	// 00E0 - Clear the screen and move to next instruction
	CLS() {
		this.graphics = new Uint8Array(64 * 32);
		this.drawFlag = true;
		this.pc += 2;
	},

	// 00EE- Return from subroutine and move to next instruction
	RET() {
		this.sp--;
		this.pc = this.stack[this.sp];
		this.pc += 2;
	},

	// 1nnn - Jump to instruction located at nnn
	JP_addr(op) {
		this.pc = op & 0xFFF;
	},

	// 2nnn - Call subroutine located at nnn, saving previous location on stack
	CALL_addr(op) {
		this.stack[this.sp] = this.pc;
		this.sp++;
		this.pc = op & 0xFFF;
	},

	// 3xkk - Skip next instruction if Vx === kk
	SE_Vx_byte(op) {
		this.pc += (this.V[(op & 0xF00) >> 8] === (op & 0xFF))? 4: 2;
	},

	// 4xkk - Skip next instruction if Vx !== kk
	SNE_Vx_byte(op) {
		this.pc += (this.V[(op & 0xF00) >> 8] !== (op & 0xFF))? 4: 2;
	},

	// 5xy0 - Skip next instruction if Vx === Vy
	SE_Vx_Vy(op) {
		this.pc += (this.V[(op & 0xF00) >> 8] === this.V[(op & 0xF0) >> 4])? 4: 2;
	},

	// 6xkk - Set Vx = kk
	LD_Vx_byte (op) {
		this.V[(op & 0xF00) >> 8] = op & 0xFF;
		this.pc += 2;
	},

	// 7xkk - Set Vx = Vx + kk
	ADD_Vx_byte(op) {
		this.V[(op  & 0xF00) >> 8] += op & 0xFF;
		this.pc += 2;
	},

	// 8xy0 - Set Vx = Vy
	LD_Vx_Vy(op) {
		this.V[(op & 0xF00) >> 8] = this.V[(op & 0xF0) >> 4];
		this.pc += 2;
	},

	// 8xy1 - Set Vx = Vy OR Vx
	OR_Vx_Vy(op) {
		this.V[(op & 0xF00) >> 8] |= this.V[(op & 0xF0) >> 4];
		this.pc += 2;
	},

	// 8xy2 - Set Vx = Vy AND Vx
	AND_Vx_Vy(op) {
		this.V[(op & 0xF00) >> 8] &= this.V[(op & 0xF0) >> 4];
		this.pc += 2;
	},

	// 8xy3 - Set Vx = Vy XOR Vx
	XOR_Vx_Vy(op) {
		this.V[(op & 0xF00) >> 8] ^= this.V[(op & 0xF0) >> 4];
		this.pc += 2;
	},

	// 8xy4 - Set Vx = Vx + Vy, set Vf = 1 if Vx + Vy > 255
	ADD_Vx_Vy(op) {
		let x = (op & 0xF00) >> 8,
			y = (op & 0xF0) >> 4;
		this.V[0xF] = (this.V[x] + this.V[y] > 0xFF)? 1: 0;
		this.V[x] += this.V[y];
		this.pc += 2;
	},

	// 8xy5 - If Vx > Vy, set Vf = 0, otherwise 1. Set Vx = Vx - Vy
	SUB_Vx_Vy(op) {
		let x = (op & 0xF00) >> 8,
			y = (op & 0xF0) >> 4;
		this.V[0xF] = this.V[y] > this.V[x]? 0: 1;
		this.V[x] -= this.V[y];
		this.pc += 2;
	},

	// 8xy6 - If the least-significant bit of Vx is 1, set VF = 1, else 0. Vx /= 2
	SHR_Vx(op) {
		let x = (op & 0xF00) >> 8
		this.V[0xF] = this.V[x] & 1;
		this.V[x] >>= 1;
		this.pc += 2;
	},

	// 8xy7 - If Vy > Vx, set Vf = 1, else 0. Vx = Vy - Vx
	SUBN_Vx_Vy(op) {
		let x = (op & 0xF00) >> 8,
			y = (op & 0xF0) >> 4;
		this.V[0xF] = (this.V[x] > this.V[y])? 0: 1;
		this.V[x] = this.V[y] - this.V[x];
		this.pc += 2;
	},

	// 8xyE - If the most-significant bit of Vx is 1, set VF = 1, else 0. Vx *= 2
	SHL_Vx(op) {
		let x = (op & 0xF00) >> 8;
		this.V[0xF] = this.V[x] >> 7;
		this.V[x] <<= 1;
		this.pc += 2;
	},

	// 9xy0 - Skip next instruction if Vx !== Vy
	SNE_Vx_Vy(op) {
		this.pc += (this.V[(op & 0xF00) >> 8] === this.V[(op & 0xF0) >> 4])? 2: 4;
	},

	// Annn - Set I = nnn
	LD_I_addr(op) {
		this.I = op & 0xFFF;
		this.pc += 2;
	},

	// Bnnn - Jump to instruction located at nnn + V0
	JP_V0_addr(op) {
		this.pc = (op & 0xFFF) + this.V[0];
	},

	// Cxkk - Set Vx = to kk AND random byte
	RND_Vx_byte(op) {
		this.V[(op & 0xF00) >> 8] = (op & 0xFF) & Math.floor(Math.random() * 0xFF);
		this.pc += 2;
	},

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
				if (spriteRow & (0x80 >> row)) {
					if (this.graphics[x + row + 64*(y + col)])
						this.V[0xF] = 1;
					this.graphics[x + row + 64*(y + col)] ^= 1;
				}
			}
		}
		this.drawFlag = true;
		this.pc += 2;
	},

	// Ex9E - Skip next instruction if key with value stored in Vx is pressed
	SKP_Vx(op) {
		this.pc += this.keyBoard[this.V[(op & 0xF00) >> 8]]? 4: 2;
	},

	// ExA1 - Skip next instruction if key with value stored in Vx is NOT pressed
	SKNP_Vx(op) {
		this.pc += !this.keyBoard[this.V[(op & 0xF00) >> 8]]? 4: 2;
	},

	// Fx07 - Set Vx = value stored in delay timer
	LD_Vx_DT(op) {
		this.V[(op & 0xF00) >> 8] = this.delayTimer;
		this.pc += 2;
	},

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
	},

	// Fx15 - Set delay timer = Vx
	LD_DT_Vx(op) {
		this.delayTimer = this.V[(op & 0xF00) >> 8];
		this.pc += 2;
	},

	// Fx18 - Set sound timer = Vx
	LD_ST_Vx(op) {
		this.soundTimer = this.V[(op & 0xF00) >> 8];
		this.pc += 2;
	},

	// Fx1E - Set I = I + Vx
	ADD_I_Vx(op) {
		let x = (op & 0xF00) >> 8;
		this.V[0xF] = (this.V[x] + this.I > 0xFFF)? 1: 0;
		this.I += this.V[x];
		this.pc += 2;
	},

	// Fx29 - Set I = location of sprite for digit Vx
	LD_F_Vx(op) {
		this.I = this.V[(op & 0xF00) >> 8] * 5;
		this.pc += 2;
	},

	// Fx33 - Store BCD represntation of Vx in locations I, I+1, I+2
	LD_B_Vx(op) {
		let val = this.V[(op & 0xF00) >> 8];
		for (let i = 2; i >= 0; i--) {
			this.memory[this.I + i] = val % 10;
			val = Math.floor(val / 10);
		}
		this.pc += 2;
	},

	// Fx55 - Store registers V0 through Vx in memory starting at location I
	LD_I_Vx(op) {
		let i = 0;
		while (i <= ((op & 0xF00) >> 8)) {
			this.memory[this.I + i] = this.V[i];
			i++;
		}
		this.I += ((op & 0x0F00) >> 8) + 1;
		this.pc += 2;
	},

	// Fx65 - Read registers V0 through Vx from memory starting at location I
	LD_Vx_I(op) {
		let i = 0;
		while (i <= ((op & 0xF00) >> 8)) {
			this.V[i] = this.memory[this.I + i];
			i++;
		}
		this.I += ((op & 0x0F00) >> 8) + 1;
		this.pc += 2;
	}
};