#!/usr/bin/env node

import { setupCLI, program } from './index.js';

setupCLI();
program.parse(process.argv);
