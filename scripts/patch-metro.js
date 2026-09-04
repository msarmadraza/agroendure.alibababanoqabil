const fs = require('fs');
const path = require('path');

console.log('[patch-metro] Checking Metro Windows compatibility patches...');

// 1. Patch RootPathUtils.js in metro-file-map
const rootPathUtilsFile = path.join(__dirname, '..', 'node_modules', 'metro-file-map', 'src', 'lib', 'RootPathUtils.js');
if (fs.existsSync(rootPathUtilsFile)) {
  let content = fs.readFileSync(rootPathUtilsFile, 'utf8');
  if (!content.includes('rootDrive[0].toLowerCase()')) {
    const target = '  absoluteToNormal(absolutePath) {\n    let endOfMatchingPrefix = 0;\n    let lastMatchingPartIdx = 0;\n    for (\n      let nextPart = this.#rootParts[0], nextLength = nextPart.length;\n      nextPart != null &&\n      absolutePath.startsWith(nextPart, endOfMatchingPrefix) &&\n      (absolutePath.length === endOfMatchingPrefix + nextLength ||\n        absolutePath[endOfMatchingPrefix + nextLength] === path.sep);\n\n    ) {\n      endOfMatchingPrefix += nextLength + 1;\n      nextPart = this.#rootParts[++lastMatchingPartIdx];\n      nextLength = nextPart?.length;\n    }\n    const upIndirectionsToPrepend =\n      this.#rootParts.length - lastMatchingPartIdx;';

    const replacement = `  absoluteToNormal(absolutePath) {
    if (path.sep === "\\\\" && absolutePath.length >= 2 && absolutePath[1] === ":") {
      const rootDrive = this.#rootParts[0];
      if (rootDrive && rootDrive.length >= 2 && rootDrive[1] === ":") {
        if (absolutePath[0].toLowerCase() === rootDrive[0].toLowerCase() && absolutePath[0] !== rootDrive[0]) {
          absolutePath = rootDrive[0] + absolutePath.slice(1);
        }
      }
    }
    let endOfMatchingPrefix = 0;
    let lastMatchingPartIdx = 0;
    for (
      let nextPart = this.#rootParts[0], nextLength = nextPart.length;
      nextPart != null &&
      (path.sep === "\\\\"
        ? absolutePath.slice(endOfMatchingPrefix, endOfMatchingPrefix + nextLength).toLowerCase() === nextPart.toLowerCase()
        : absolutePath.startsWith(nextPart, endOfMatchingPrefix)) &&
      (absolutePath.length === endOfMatchingPrefix + nextLength ||
        absolutePath[endOfMatchingPrefix + nextLength] === path.sep);

    ) {
      endOfMatchingPrefix += nextLength + 1;
      nextPart = this.#rootParts[++lastMatchingPartIdx];
      nextLength = nextPart?.length;
    }
    if (path.sep === "\\\\" && lastMatchingPartIdx > 0) {
      const matchedCanonical = this.#rootParts.slice(0, lastMatchingPartIdx).join(path.sep);
      absolutePath = matchedCanonical + absolutePath.slice(endOfMatchingPrefix - 1);
    }
    const upIndirectionsToPrepend =
      this.#rootParts.length - lastMatchingPartIdx;`;

    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(rootPathUtilsFile, content, 'utf8');
      console.log('[patch-metro] Successfully patched RootPathUtils.js');
    } else {
      console.warn('[patch-metro] Warning: target signature in RootPathUtils.js not found');
    }
  } else {
    console.log('[patch-metro] RootPathUtils.js is already patched');
  }
}

// 2. Patch DependencyGraph.js in metro
const depGraphFile = path.join(__dirname, '..', 'node_modules', 'metro', 'src', 'node-haste', 'DependencyGraph.js');
if (fs.existsSync(depGraphFile)) {
  let content = fs.readFileSync(depGraphFile, 'utf8');
  if (!content.includes('crypto.createHash("sha1")')) {
    const target = `  getSha1(filename) {
    const sha1 = this._fileSystem.getSha1(filename);
    if (!sha1) {
      throw new ReferenceError(\`SHA-1 for file \${filename} is not computed.
         Potential causes:
           1) You have symlinks in your project - watchman does not follow symlinks.
           2) Check \\\`blockList\\\` in your metro.config.js and make sure it isn't excluding the file path.\`);
    }
    return sha1;
  }`;

    const replacement = `  getSha1(filename) {
    let sha1 = this._fileSystem.getSha1(filename);
    if (!sha1) {
      try {
        const crypto = require("crypto");
        const content = fs.readFileSync(filename);
        sha1 = crypto.createHash("sha1").update(content).digest("hex");
      } catch (e) {
        throw new ReferenceError(\`SHA-1 for file \${filename} is not computed.
         Potential causes:
           1) You have symlinks in your project - watchman does not follow symlinks.
           2) Check \\\`blockList\\\` in your metro.config.js and make sure it isn't excluding the file path.\`);
      }
    }
    return sha1;
  }`;

    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(depGraphFile, content, 'utf8');
      console.log('[patch-metro] Successfully patched DependencyGraph.js');
    } else {
      console.warn('[patch-metro] Warning: target signature in DependencyGraph.js not found');
    }
  } else {
    console.log('[patch-metro] DependencyGraph.js is already patched');
  }
}

console.log('[patch-metro] Done.');
