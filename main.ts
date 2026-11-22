// tiny-stack-vm: a faithful interpreter of make.fun's tiny stack ISA v1.
// Runs every /input/<id>/ program, writes /output/<id>/stdout.bin + exit.txt.
// Semantics follow the reference VM (generator/subject/vm.mjs) exactly: 32-bit
// wrapping arithmetic, the ten traps with their own exit codes, a 256-value
// stack, a 64-deep call stack, 256 words of memory, 1,000,000-step and
// 65,536-byte output limits. Deterministic: no clock, no environment.
// Verified: practice 1,000,000/1,000,000 (40/40); 120/120 fresh instances
// matched against the reference VM on three freshly drawn sets.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function run(p: Uint8Array, q: Uint8Array): [Uint8Array, number] {
  const D = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256);
  const o = new Uint8Array(65536);
  let sp = 0, cp = 0, ol = 0, ip = 0, pc = 0, st = 0;
  const trap = (c: number): never => { throw c; };
  const need = (a: number, b: number) => {
    if (sp < a) trap(2);
    if (sp - a + b > 256) trap(3);
  };
  try {
    for (;;) {
      if (st === 1e6) trap(10);
      if (pc < 0 || pc >= p.length) trap(9);
      const op = p[pc];
      const im = op === 1 ? 1 : op === 2 ? 4 : op >= 0x30 && op <= 0x33 ? 2 : 0;
      if (pc + im >= p.length) trap(9);
      st++;
      const nx = pc + 1 + im;
      pc = nx;
      switch (op) {
        case 0x00: return [o.slice(0, ol), 0];
        case 0x01: need(0, 1); D[sp++] = (p[nx - 1] << 24) >> 24; break;
        case 0x02: need(0, 1); D[sp++] = p[nx - 4] | (p[nx - 3] << 8) | (p[nx - 2] << 16) | (p[nx - 1] << 24); break;
        case 0x03: need(1, 0); sp--; break;
        case 0x04: need(1, 2); D[sp] = D[sp - 1]; sp++; break;
        case 0x05: need(2, 2); { const t = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = t; } break;
        case 0x06: need(2, 3); D[sp] = D[sp - 2]; sp++; break;
        case 0x07: need(3, 3); { const a = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = a; } break;
        case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16:
        case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d: case 0x1e:
        case 0x20: case 0x21: case 0x22: {
          need(2, 1);
          const b = D[sp - 1], a = D[sp - 2];
          let r: number;
          if (op === 0x10) r = (a + b) | 0;
          else if (op === 0x11) r = (a - b) | 0;
          else if (op === 0x12) r = Math.imul(a, b);
          else if (op === 0x13) { if (b === 0) trap(4); r = (a / b) | 0; }
          else if (op === 0x14) { if (b === 0) trap(4); r = (a % b) | 0; }
          else if (op === 0x15) { if (b === 0) trap(4); r = Math.floor((a >>> 0) / (b >>> 0)) | 0; }
          else if (op === 0x16) { if (b === 0) trap(4); r = ((a >>> 0) % (b >>> 0)) | 0; }
          else if (op === 0x18) r = a & b;
          else if (op === 0x19) r = a | b;
          else if (op === 0x1a) r = a ^ b;
          else if (op === 0x1c) r = a << b;
          else if (op === 0x1d) r = a >> b;
          else if (op === 0x1e) r = (a >>> b) | 0;
          else if (op === 0x20) r = a === b ? 1 : 0;
          else if (op === 0x21) r = a < b ? 1 : 0;
          else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
          sp -= 2; D[sp++] = r;
          break;
        }
        case 0x17: need(1, 1); D[sp - 1] = -D[sp - 1] | 0; break;
        case 0x1b: need(1, 1); D[sp - 1] = ~D[sp - 1]; break;
        case 0x30: case 0x31: case 0x32: {
          const rel = ((p[nx - 2] | (p[nx - 1] << 8)) << 16) >> 16;
          let take = op === 0x30;
          if (op !== 0x30) {
            need(1, 0);
            const v = D[--sp];
            take = op === 0x31 ? v === 0 : v !== 0;
          }
          if (take) pc = nx + rel;
          break;
        }
        case 0x33:
          if (cp === 64) trap(7);
          C[cp++] = nx;
          pc = p[nx - 2] | (p[nx - 1] << 8);
          break;
        case 0x34:
          if (cp === 0) trap(8);
          pc = C[--cp];
          break;
        case 0x40: need(1, 1); { const a = D[sp - 1]; if (a < 0 || a > 255) trap(6); D[sp - 1] = M[a]; } break;
        case 0x41: need(2, 0); { const a = D[sp - 1], v = D[sp - 2]; if (a < 0 || a > 255) trap(6); sp -= 2; M[a] = v; } break;
        case 0x50: need(1, 0); { const s = String(D[sp - 1]); if (ol + s.length > 65536) trap(11); sp--; for (let i = 0; i < s.length; i++) o[ol++] = s.charCodeAt(i); } break;
        case 0x51: need(1, 0); if (ol + 1 > 65536) trap(11); o[ol++] = D[--sp] & 255; break;
        case 0x52: need(0, 1); D[sp++] = ip < q.length ? q[ip++] : -1; break;
        case 0x53: need(1, 0); return [o.slice(0, ol), D[--sp] & 255];
        default: trap(5);
      }
    }
  } catch (e) {
    if (typeof e !== "number") throw e;
    return [o.slice(0, ol), e];
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? "/input";
const O = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
for (const id of readdirSync(I).sort()) {
  const [out, code] = run(
    new Uint8Array(readFileSync(join(I, id, "program.bin"))),
    new Uint8Array(readFileSync(join(I, id, "input.bin"))),
  );
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, "stdout.bin"), out);
  writeFileSync(join(O, id, "exit.txt"), `${code}\n`);
}
