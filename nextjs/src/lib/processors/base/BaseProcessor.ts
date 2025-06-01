import { ReconciliationInput, ReconciliationResult } from '../types';

export abstract class BaseProcessor {
  abstract process(input: ReconciliationInput): Promise<ReconciliationResult>;
} 