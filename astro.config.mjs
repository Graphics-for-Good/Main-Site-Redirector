// @ts-check
import { defineConfig } from 'astro/config';

import fetchPaths from './fetchPaths.js'

fetchPaths()

// https://astro.build/config
export default defineConfig({});
