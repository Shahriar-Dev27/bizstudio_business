import { expect, it } from "vitest";
import { calculateBudget } from "@/lib/chat/budget-calculator";
it("calculates contribution and break-even from explicit BDT inputs", () => {
  expect(
    calculateBudget({ price: 100, unitCost: 60, fixedCost: 12000, units: 400 }),
  ).toEqual({
    revenue: 40000,
    variableCost: 24000,
    contributionPerUnit: 40,
    profit: 4000,
    breakEvenUnits: 300,
  });
});
it("does not invent break-even when contribution is zero or negative", () => {
  expect(
    calculateBudget({ price: 50, unitCost: 60, fixedCost: 1000, units: 20 })
      .breakEvenUnits,
  ).toBeNull();
  expect(() =>
    calculateBudget({ price: 100, unitCost: -5, fixedCost: 100, units: 10 }),
  ).toThrow();
});
