import assert from "node:assert/strict";
import test from "node:test";
import { validateTargetUrl } from "../src/live-runner.js";

test("allows the local demo target", () => {
  assert.equal(validateTargetUrl("http://127.0.0.1:3210").hostname, "127.0.0.1");
});

test("blocks unconfigured external targets", () => {
  assert.throws(
    () => validateTargetUrl("https://example.com"),
    /not in RELEASEGUARD_ALLOWED_TARGETS/,
  );
});
