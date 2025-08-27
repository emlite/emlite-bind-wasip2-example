import { Emlite } from "emlite";
import { makeHost } from "emlite/wasip2adapter";
import { instantiate as initApp } from "../bin/app/emlite_bind_example.js";
import { WASIShim } from "@bytecodealliance/preview2-shim/instantiation";

async function instantiateApp() {
  const getAppCore = (p) =>
  WebAssembly.compileStreaming(
    fetch(new URL(`../bin/app/${p}`, import.meta.url))
  );

  const wasiShim = new WASIShim({
    // optional:
    // args: [],
    // env: {},
    // preopens: {}, // browser FS
  });
  const wasi = wasiShim.getImportObject();

  const emlite = new Emlite();

  // 1) Provide a placeholder; adapter will call this for callbacks.
  let applyImpl = () => {
    throw new Error("dyncall.apply not wired yet");
  };

  // 2) Build the host, injecting a delegating apply
  const host = makeHost({ emlite, apply: (...args) => applyImpl(...args) });

  // 3) Instantiate the app (no dyncall import needed)
  const app = await initApp(getAppCore, {
    ...wasi,
    "emlite:env/host": host,
    "emlite:env/host@0.1.0": host,
  });

  // 4) Wire the host’s apply to the app’s exported trampoline
  const exported =
    app["emlite:env/dyncall@0.1.0"]?.apply ||
    app["emlite:env/dyncall"]?.apply;

  if (!exported) {
    throw new Error("Guest didn’t export emlite:env/dyncall.apply");
  }
  applyImpl = exported;

  return app;
}

async function main() {
  const app = await instantiateApp();
  app.iface.start([]);
}

await main();