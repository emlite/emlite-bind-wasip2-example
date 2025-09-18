import { Emlite } from "emlite";
import { makeHost } from "emlite/wasip2adapter";
import { instantiate as initApp } from "../bin/app/emlite_bind_example.js";
import { WASIShim } from "@bytecodealliance/preview2-shim/instantiation";

async function instantiateApp() {
  const getAppCore = (p) =>
    WebAssembly.compileStreaming(
      fetch(new URL(`../bin/app/${p}`, import.meta.url))
    );

  const wasiShim = new WASIShim({});
  const wasi = wasiShim.getImportObject();

  const emlite = new Emlite();

  // 1) Provide a placeholder; adapter will call this for callbacks.
  let applyImpl = () => {
    throw new Error("dyncall.apply not wired yet");
  };
  let targetImpl = () => -1;

  // 2) Build the host, injecting a delegating apply
  const host = makeHost({ emlite, apply: (...args) => applyImpl(...args), target: () => targetImpl() });

  // 3) Instantiate the app (no dyncall import needed)
  const app = await initApp(getAppCore, {
    ...wasi,
    "emlite:env/host": host,
  });

  applyImpl = app["emlite:env/dyncall@0.1.0"]?.apply;

  targetImpl = app["emlite:env/dyncall@0.1.0"]?.emliteTarget;

  return app;
}

async function main() {
  const app = await instantiateApp();
  app.run.run();
}

await main();
