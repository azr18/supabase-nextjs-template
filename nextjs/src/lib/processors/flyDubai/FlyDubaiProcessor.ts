import { ReconciliationInput, ReconciliationResult } from '../types';
import { BaseProcessor } from '../base/BaseProcessor';

export class FlyDubaiProcessor extends BaseProcessor {
  async process(input: ReconciliationInput): Promise<ReconciliationResult> {
    // TODO: Implement FlyDubai specific processing logic
    console.log('FlyDubaiProcessor process method called with input:', input);
    // Placeholder implementation
    return {
      success: false,
      error: 'FlyDubaiProcessor not yet implemented.',
    };
  }
} 