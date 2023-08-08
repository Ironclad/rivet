export type TryRunTests = (
  options: { testSuiteIds?: string[]; testCaseIds?: string[]; iterationCount?: number } | undefined,
) => Promise<void>;
