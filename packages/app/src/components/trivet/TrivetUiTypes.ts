import { TrivetTestCase, TrivetTestSuite } from '@ironclad/trivet';

export namespace TrivetUiTypes {
  export type TrivetTestCaseWithId = TrivetTestCase & { id: string };
  export type TrivetTestSuiteWithId = Omit<TrivetTestSuite, 'testCases'> & { id: string, testCases: TrivetTestCaseWithId[] };
}