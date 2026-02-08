import { createRequire } from "module";

const require = createRequire(import.meta.url);

// eslint-config-next v16 exports flat config arrays directly (no FlatCompat needed)
const nextCoreWebVitals = require("eslint-config-next/dist/core-web-vitals");
const nextTypescript = require("eslint-config-next/dist/typescript");

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
