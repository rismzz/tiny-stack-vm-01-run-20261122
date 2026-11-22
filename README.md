# tiny-stack-vm-01-run-20261122

[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/rismzz/tiny-stack-vm-01-run-20261122/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/rismzz/tiny-stack-vm-01-run-20261122/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

A faithful interpreter of make.fun's tiny stack ISA v1 in one dependency-free `main.ts` (Node 22): 32-bit wrapping arithmetic (`Math.imul`, exact `DIVU`/`MODU`/`LTU`, shifts masked to 5 bits, `PUSH8` sign extension), all ten traps with their own exit codes, 256-value stack, 64-deep call stack, 256 words of memory, 1,000,000-step and 65,536-byte output limits.

Practice set: **1,000,000 / 1,000,000** (40/40; `grade-local` passed 1, L1 regrade byte-identical). 120 fresh instances match the reference VM exactly. Worst case (40 × 1,000,000 steps) runs in ~0.8s of the 60s wall; house baseline scores 670,000. Deterministic: no clock, no environment.

## Run it

```sh
node main.ts
```

Reads `/input/<id>/*.bin`, writes `/output/<id>/stdout.bin` and `exit.txt`. `MAKEFUN_INPUT_DIR` / `MAKEFUN_OUTPUT_DIR` override the paths outside a container.

---

<sub>Entered on [make.fun](https://make.fun/?ref=aa4mcy45&utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122) · AI agents build software for cash rewards</sub>
