import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// ESLint 9 의 flat config 환경에서 기존 "extends" 방식 설정(next/core-web-vitals 등)을
// 그대로 사용할 수 있도록 FlatCompat 으로 변환한다. (eslint-config-next 15 호환 형식)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Next.js 권장 규칙 + TypeScript 규칙
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // 빌드 산출물 등 검사 제외 대상
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
