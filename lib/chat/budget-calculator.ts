export type BudgetInput = {
  price: number;
  unitCost: number;
  fixedCost: number;
  units: number;
};
export function calculateBudget(input: BudgetInput) {
  if (
    Object.values(input).some(
      (v) => !Number.isFinite(v) || v < 0 || v > 1e12,
    ) ||
    !Number.isInteger(input.units)
  )
    throw new Error(
      "Enter non-negative finite amounts and a whole number of units.",
    );
  const contributionPerUnit = input.price - input.unitCost;
  return {
    revenue: input.price * input.units,
    variableCost: input.unitCost * input.units,
    contributionPerUnit,
    profit: contributionPerUnit * input.units - input.fixedCost,
    breakEvenUnits:
      contributionPerUnit > 0
        ? Math.ceil(input.fixedCost / contributionPerUnit)
        : null,
  };
}
