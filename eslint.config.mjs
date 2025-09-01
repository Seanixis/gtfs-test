import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  compat.config({
    rules: {
      "@typescript-eslint/no-unused-vars": "off"
    }
  }) // delete ts later, when you are ready to remove the test function for production build. but really it does not matter.
];

export default eslintConfig;
