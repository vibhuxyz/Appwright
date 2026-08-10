"""CLI harness for the agent.

V0 placeholder. Right now it echoes the prompt and prints the event shape we are
heading towards, so you can see the plumbing works end to end.

You replace this in V0 Slice 6, once the loop exists. It will wire `emit` to
stdout and call agent_core.run_agent_loop — see docs/versions/V0_AGENT_LOOP.md.
"""

import asyncio
import sys


async def main() -> int:
    prompt = " ".join(sys.argv[1:]).strip()
    if not prompt:
        print('usage: make agent ARGS=\'"your prompt here"\'')
        return 1

    print(f"\n  prompt: {prompt}\n")
    print("  ● (no tools yet — the loop lands in V0 Slice 4)")
    print("  ✓ python toolchain works\n")
    return 0


def run() -> None:
    raise SystemExit(asyncio.run(main()))


if __name__ == "__main__":
    run()
