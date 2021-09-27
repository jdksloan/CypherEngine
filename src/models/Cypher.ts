export class Cypher {
  public cypher: string;
  public seperator: string;

  constructor(cypher: string, seperator: string = '\n') {
    this.cypher = cypher;
    this.seperator = seperator;
  }
}
