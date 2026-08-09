import type { ValueTransformer } from 'typeorm';

/**
 * mysql2 returns DECIMAL columns as strings by default (the standard,
 * correct TypeORM+MySQL behavior, since JS numbers can't safely represent
 * every decimal value) - fine for most entities, but Finance does real
 * arithmetic on these values (FinanceInvoicesService.recalculatePaidAmount
 * sums them), so leaving every read site to remember `Number(...)` is a
 * real correctness risk. Applied to every Finance amount column so a
 * fresh read from the DB returns a number, matching the value shape
 * `.save()`'s in-memory return already has.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value: number | null | undefined): number | null | undefined => value,
  from: (value: string | null): number | null =>
    value === null ? null : parseFloat(value),
};
