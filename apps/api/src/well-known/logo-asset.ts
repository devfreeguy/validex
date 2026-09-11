import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// __dirname is src/well-known in dev (ts-node keeps source paths) and
// dist/well-known in production - nest-cli.json's `assets` glob copies this
// folder into dist alongside the compiled JS, so the same relative path
// resolves correctly either way. See ./assets/README.md.
const LOGO_PNG_PATH = join(__dirname, 'assets', 'logo.png');
const OG_IMAGE_PATH = join(__dirname, 'assets', 'og-image.png');

/** Real logo PNG bytes if present, otherwise null. */
export function loadLogoPng(): Buffer | null {
  return existsSync(LOGO_PNG_PATH) ? readFileSync(LOGO_PNG_PATH) : null;
}

/**
 * Real OG image PNG bytes if present, otherwise null.
 * Placed in well-known/assets/ (not public/) so it is included in the
 * compiled dist/ output via nest-cli.json's assets glob and served by
 * RootDiscoveryController rather than a static file server.
 */
export function loadOgImagePng(): Buffer | null {
  return existsSync(OG_IMAGE_PATH) ? readFileSync(OG_IMAGE_PATH) : null;
}

