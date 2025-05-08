import { getRollupMarkdownFields, listRollupsFromDocs } from "../src/helpers.js";
import { describe, it, expect } from "vitest";

const rollups = listRollupsFromDocs().map(r => r.name.toLowerCase().replace(/ /g, '-'));

describe("getRollupMarkdownFields", () => {
  for (const rollup of rollups) {
    it(`should extract markdown fields for ${rollup} (snapshot)`, () => {
      const fields = getRollupMarkdownFields(rollup);
      expect(fields).toMatchSnapshot();
    });
  }
}); 