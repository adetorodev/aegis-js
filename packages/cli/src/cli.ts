#!/usr/bin/env node

import { setupCLI, program } from './index.js';

setupCLI();
program.parseAsync(process.argv).catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`CLI error: ${message}`);
	process.exitCode = 2;
});
