import {
  enableProviders,
  resolveActiveProviderRequirements,
} from "../src/features/distribution/providers";

const profiles = enableProviders([
  "INTERNAL",
  "ONERPM",
  "FUGA",
]);

const result = resolveActiveProviderRequirements(profiles);

console.dir(result, {
  depth: null,
});
