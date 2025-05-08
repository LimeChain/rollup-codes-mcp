import { getChainSpec, listRollupsFromDocs } from "../src/helpers.js";
import { describe, it, expect } from "vitest";

const rollups = listRollupsFromDocs().map(r => r.name.toLowerCase().replace(/ /g, '-'));
const allRollups = Array.from(new Set(["ethereum", ...rollups]));

describe("getChainSpec", () => {
  for (const rollup of allRollups) {
    it(`should return the chain spec for ${rollup} (snapshot)`, () => {
      const chainSpec = getChainSpec(rollup);
      expect(chainSpec).toMatchSnapshot();
    });
  }
}); 