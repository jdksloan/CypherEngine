import { CypherEngine } from '../engine/CypherEngine';

/**
 * Exposes a delegate to call a CypherFunction
 *
 * @export
 * @interface ICypherFunction
 */
export type ICypherFunction = (engine: CypherEngine) => CypherEngine;
