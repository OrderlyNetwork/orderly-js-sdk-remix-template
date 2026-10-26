import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import { cjsInterop } from "vite-plugin-cjs-interop";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig(() => {
  const isProduction = process.env.NODE_ENV === "production";
  const noExternal: any[] = [
    /^@orderly.*$/,
    "@uiw/react-split",
    "use-constant",
  ];
  if (isProduction) {
    noExternal.push("ethers");
  }

  return {
    ssr: {
      noExternal,
      // noExternal: [/^@orderly.*$/, "ethers"],
    },
    plugins: [
      remix({
        ssr: true,
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_singleFetch: true,
          v3_lazyRouteDiscovery: true,
        },
      }),
      tsconfigPaths(),
      cjsInterop({
        dependencies: ["bs58", "@coral-xyz/anchor", "lodash"],
      }),
      nodePolyfills({
        include: ["buffer", "crypto"],
      }),
    ],
  };
});
