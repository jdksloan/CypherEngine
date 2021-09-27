import { NeoEngine } from '../engine/NeoEngine';

/**
 * Interface that exposes a delegate to call a neoFunction
 *
 * @export
 * @interface INeoFunction
 */
export interface INeoFunction {
  (engine: NeoEngine): NeoEngine;
}
