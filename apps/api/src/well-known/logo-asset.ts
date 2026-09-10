import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// __dirname is src/well-known in dev (ts-node keeps source paths) and
// dist/well-known in production - nest-cli.json's `assets` glob copies this
// folder into dist alongside the compiled JS, so the same relative path
// resolves correctly either way. See ./assets/README.md.
const LOGO_PNG_PATH = join(__dirname, 'assets', 'logo.png');

/** Real logo PNG bytes if present, otherwise null. */
export function loadLogoPng(): Buffer | null {
  return existsSync(LOGO_PNG_PATH) ? readFileSync(LOGO_PNG_PATH) : null;
}
