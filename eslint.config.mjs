import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // We use the mount-guard / debounce / hydrate-from-localStorage patterns
      // deliberately (client-only rendering, external-store sync). Keep as a hint.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
