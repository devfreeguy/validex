# Branding assets

`logo.png` is served as-is at `/favicon-32.png` and `/apple-touch-icon.png`,
and referenced as the `logo`/`logo_url` field in the `x402-merchant`
extension and `ai-plugin.json`.

If it's ever missing, `RootDiscoveryController` falls back to a plain solid
brand-color square rather than inventing a mark.

This directory is copied into `dist/well-known/assets` on build via the
`assets` glob in `nest-cli.json` - keep the file directly in this folder,
not in a subdirectory.
