import { CypherEngine } from '../engine/CypherEngine';

/**
 * Interface that exposes a delegate to call a CypherFunction
 *
 * @export
 * @interface ICypherFunction
 */
export interface ICypherFunction {
  (engine: CypherEngine): CypherEngine;
}
