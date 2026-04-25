import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", ".claude/**"],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
  {
    // ===== 프로젝트 컨벤션 강제 (CLAUDE.md "필수 규칙"과 짝) =====
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "no-alert": "error",
      "no-console": ["warn", { allow: ["error", "warn"] }],
      "prefer-const": "error",
      "react/jsx-key": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // src/lib/는 React 무관 (도메인/UI 분리)
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              message: "lib/는 React 무관해야 함. components/ 또는 hooks/로 이동.",
            },
          ],
        },
      ],
    },
  },
  {
    // API 라우트에서 타입 단언 금지 (zod 사용)
    files: ["src/app/api/**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
    },
  },
];

export default config;
