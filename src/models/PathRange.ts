/**
 * Represents the min and max length of the path between source node and target node, in other words, how many relationships betweend the nodes.
 *
 * @export
 * @class PathRange
 */
export class PathRange {
  public min?: number;
  public max?: number;

  /**
   * Creates an instance of PathRange.
   * @param {number} [min]
   * @param {number} [max]
   * @memberof PathRange
   */
  constructor(min?: number, max?: number) {
    this.min = min;
    this.max = max;
  }

  /**
   * Converts this PathRange to Cypher Notation (*min..max).
   *
   * @returns
   * @memberof PathRange
   */
  public toString(): string {
    return `*${this.min !== undefined ? this.min : ''}..${this.max !== undefined ? this.max : ''}`;
  }
}
