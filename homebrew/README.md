# Homebrew Formula for Outfitter CLI

This directory contains the Homebrew formula for installing the Outfitter CLI via Homebrew.

## Installation

Once the formula is published to a Homebrew tap, users will be able to install with:

```bash
brew tap outfitter-dev/tap
brew install outfitter
```

## Publishing Process

1. After publishing a new version to npm, update the formula:
   - Update the `url` to point to the new version
   - Update the `sha256` checksum
2. Calculate the SHA256:

   ```bash
   curl -L https://registry.npmjs.org/outfitter/-/outfitter-VERSION.tgz | shasum -a 256
   ```

3. Submit the formula to the Homebrew tap repository

## Formula Details

The formula:

- Depends on Node.js
- Installs the npm package globally using Homebrew's Node helper
- Creates a symlink in Homebrew's bin directory
- Tests installation by running `outfitter --version`

## Alternative: npm Installation

Users can also install directly via npm:

```bash
npm install -g outfitter
```
