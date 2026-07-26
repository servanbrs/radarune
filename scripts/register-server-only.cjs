/* eslint-disable @typescript-eslint/no-require-imports */
const Module = require("node:module");
const path = require("node:path");

const originalResolveFilename = Module._resolveFilename;
const emptyServerOnlyPath = path.join(__dirname, "server-only-empty.cjs");

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request === "server-only") {
    return emptyServerOnlyPath;
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
