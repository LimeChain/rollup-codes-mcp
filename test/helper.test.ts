import { getRollupCodesName, listRollupsFromDocs } from "../src/helpers.js";
import { describe, it, expect } from "vitest";

describe("listRollupsFromDocs", () => {
  it("should return all rollups with name and description (snapshot)", () => {
    const rollups = listRollupsFromDocs();
    expect(rollups).toMatchSnapshot();
  });
});

describe("getRollupCodesName", () => {
  it("should return the correct rollup name", () => {
    expect(getRollupCodesName("Arbitrum")).toBe("arbitrum-one");
    expect(getRollupCodesName("World")).toBe("world-chain");
    expect(getRollupCodesName("Zksync")).toBe("zksync-era");
    expect(getRollupCodesName("Zkevm")).toBe("polygon-zkevm");
  });
});