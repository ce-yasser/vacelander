import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { baseConfig } from "./base.js";

/** Shared ESLint flat config for React libraries. */
export const reactConfig = [
  ...baseConfig,
  reactHooks.configs.flat["recommended-latest"],
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
];

export default reactConfig;
