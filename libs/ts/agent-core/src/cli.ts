
const prompt = process.argv.slice(2).join(" ").trim();

if (!prompt) {
	console.error('usage: bun devian "your prompt here"');
	process.exit(1);
}

console.log(`\n  prompt: ${prompt}\n`);
console.log("  ● (no tools yet — the loop lands in V0 Slice 4)");
console.log("  ✓ toolchain works\n");
