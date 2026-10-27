import { describe, expect, it } from "vitest";
import { computeRowWindow } from "@/components/shared/DataTable";

describe("computeRowWindow", () => {
  it("has no window for an empty table or an unmeasured row height", () => {
    expect(computeRowWindow(0, 0, 560, 46)).toEqual({ start: 0, end: 0 });
    expect(computeRowWindow(140, 0, 560, 0)).toEqual({ start: 0, end: 0 });
  });

  it("renders only the viewport plus overscan at the top of the list", () => {
    const window = computeRowWindow(140, 0, 560, 46);
    expect(window.start).toBe(0);
    expect(window.end).toBe(Math.ceil(560 / 46) + 8);
    expect(window.end).toBeLessThan(140);
  });

  it("advances the window as the container scrolls", () => {
    const top = computeRowWindow(140, 460, 560, 46);
    expect(top.start).toBe(Math.floor(460 / 46) - 8);
    expect(top.end).toBeGreaterThan(top.start);
    expect(top.end - top.start).toBe(Math.ceil(560 / 46) + 16);
  });

  it("clamps to the last row when scrolled past the content", () => {
    expect(computeRowWindow(20, 100_000, 560, 46)).toEqual({ start: 19, end: 20 });
  });

  it("always returns at least one visible row", () => {
    const single = computeRowWindow(1, 0, 560, 46);
    expect(single.start).toBe(0);
    expect(single.end).toBe(1);
  });
});
