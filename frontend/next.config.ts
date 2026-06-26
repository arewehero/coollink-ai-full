import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 홈 디렉터리의 다른 lockfile로 워크스페이스 루트가 잘못 추론되는 것을 방지한다.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
