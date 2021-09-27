import { ICypherFunction } from '../interfaces/ICypherFunction';
import { SetProperty } from '../models/SetProperty';
import { RelationshipDirection } from '../models/RelationshipDirection';
import { Property } from '../models/Property';
import { Cypher } from '../models/Cypher';
import { PathRange } from '../models/PathRange';

export class CypherEngine {
  private readonly _cypher: Cypher[];
  private readonly _nodes: string[];

  constructor() {
    this._cypher = [];
    this._nodes = [];
  }

  public get cypher(): string {
    let baseCypher: string = '';

    for (let i = 0; i < this._cypher.length; i++) {
      const cypher = this._cypher[i];
      baseCypher += i < this._cypher.length - 1 ? `${cypher.cypher}${cypher.seperator}` : cypher.cypher;
    }
    return baseCypher;
  }

  public match(): CypherEngine {
    this._cypher.push(new Cypher('MATCH', ' '));
    return this;
  }

  public optionalMatch(): CypherEngine {
    this._cypher.push(new Cypher('OPTIONAL', ' '));
    this.match();
    return this;
  }

  public conditional(ifStatement: boolean | undefined, query: string, elseQuery: string): CypherEngine {
    if (ifStatement) {
      this.value(query);
    } else {
      this.value(elseQuery);
    }

    return this;
  }

  public conditionalFunc(
    ifStatement: boolean | undefined,
    query: ICypherFunction,
    elseQuery: ICypherFunction,
  ): CypherEngine {
    if (ifStatement) {
      query(this);
    } else {
      elseQuery(this);
    }

    return this;
  }

  public merge(): CypherEngine {
    this._cypher.push(new Cypher('MERGE', ' '));
    return this;
  }

  public create(): CypherEngine {
    this._cypher.push(new Cypher('CREATE', ' '));
    return this;
  }

  public node(labels: string[], variableName?: string, ...properties: Property[]): CypherEngine {
    this._cypher.push(new Cypher(this.nodeString(labels, variableName, ...properties)));
    if (variableName) {
      this._nodes.push(variableName);
    }
    return this;
  }

  public declaredNode(variableName: string, ...additionalLabels: string[]): CypherEngine {
    const node = this._nodes.find((x) => x === variableName);
    if (!node) {
      throw new Error(`Could not find node ${variableName}`);
    }
    this._cypher.push(new Cypher(this.nodeString(additionalLabels, variableName)));
    return this;
  }

  public variable(variableName: string, property?: string): CypherEngine {
    this._cypher.push(new Cypher(this.variableString(variableName, property), ' '));
    return this;
  }

  public relates(
    direction: RelationshipDirection,
    types?: string[],
    variableName?: string,
    range?: PathRange,
    ...properties: Property[]
  ): CypherEngine {

    if (!types) {
      this._cypher.push(new Cypher('--', ''));
      return this;
    }
    const variableNameStatement = variableName || '';
    const typesStatement = types.length ? ':' + types.join('|') : '';
    const relationshipRangeStatement = range ? range!.toString() : '';

    let statement = `[${variableNameStatement}${typesStatement}${relationshipRangeStatement}${this.propertyFilter(
      ...properties,
    )}]`;

    switch (direction) {
      case RelationshipDirection.left:
        statement = `<-${statement}-`;
        break;
      case RelationshipDirection.right:
        statement = `-${statement}->`;
        break;
      default:
        statement = `-${statement}-`;
        break;
    }
    this._cypher.push(new Cypher(statement, ''));
    return this;
  }

  public delete(variableName: string, ...furtherNames: string[]): CypherEngine {
    const variables: string[] = [];
    variables.push(variableName);
    variables.push(...furtherNames);
    const statement = `DELETE ${variables.join(',')}`;
    this._cypher.push(new Cypher(statement));
    return this;
  }

  public where(): CypherEngine {
    this._cypher.push(new Cypher('WHERE', ' '));
    return this;
  }

  public detach(): CypherEngine {
    const statement = 'DETACH';
    this._cypher.push(new Cypher(statement, ' '));
    return this;
  }

  public unwind(): CypherEngine {
    const statement = `UNWIND`;
    this._cypher.push(new Cypher(statement, ' '));
    return this;
  }

  public with(...variableNames: string[]): CypherEngine {
    if (variableNames && variableNames.length) {
      this._nodes.length = 0;
      this._nodes.push(...variableNames);
    }

    const statement = `WITH ${variableNames.length ? variableNames.join(',') : '*'}`;
    this._cypher.push(new Cypher(statement));
    return this;
  }

  public exists(variableName: string, property: string): CypherEngine {
    const statement = `exists(${variableName}.${property})`;
    this._cypher.push(new Cypher(statement));
    return this;
  }

  // Uses raw data, add '' quotes for strings into the value
  public value(value: string | number | string[] | number[]): CypherEngine {
    let statement = '';
    if (Array.isArray(value)) {
      statement = `${JSON.stringify(value)}`;
    } else {
      statement = `${value}`;
    }
    this._cypher.push(new Cypher(statement, ' '));
    return this;
  }

  public set(...properties: SetProperty[]): CypherEngine {
    const statement = `SET${properties.length ? ' ' + this.propertySetter(...properties) : ''}`;
    this._cypher.push(new Cypher(statement));
    return this;
  }

  public onCreate(): CypherEngine {
    this._cypher.push(new Cypher('ON CREATE', ' '));
    return this;
  }

  public onMatch(): CypherEngine {
    this._cypher.push(new Cypher('ON MATCH', ' '));
    return this;
  }

  public and(): CypherEngine {
    this._cypher.push(new Cypher('AND', ' '));
    return this;
  }

  public or(): CypherEngine {
    this._cypher.push(new Cypher('OR', ' '));
    return this;
  }

  public is(): CypherEngine {
    this._cypher.push(new Cypher('IS', ' '));
    return this;
  }

  public call(apoc: string): CypherEngine {
    this._cypher.push(new Cypher(`CALL ${apoc}`));
    return this;
  }

  public callQuery(engine: CypherEngine): CypherEngine {
    this._cypher.push(new Cypher(`CALL {${engine.cypher}}`));
    return this;
  }

  public in(): CypherEngine {
    this._cypher.push(new Cypher('IN', ' '));
    return this;
  }

  public null(): CypherEngine {
    this._cypher.push(new Cypher('NULL', ' '));
    return this;
  }

  public not(): CypherEngine {
    this._cypher.push(new Cypher('NOT', ' '));
    return this;
  }

  public equals(): CypherEngine {
    this._cypher.push(new Cypher('=', ' '));
    return this;
  }

  public greaterThan(): CypherEngine {
    this._cypher.push(new Cypher('>', ' '));
    return this;
  }

  public lessThan(): CypherEngine {
    this._cypher.push(new Cypher('<', ' '));
    return this;
  }

  public startsWith(): CypherEngine {
    this._cypher.push(new Cypher('STARTS WITH', ' '));
    return this;
  }

  public endsWith(): CypherEngine {
    this._cypher.push(new Cypher('ENDS WITH', ' '));
    return this;
  }

  public contains(): CypherEngine {
    this._cypher.push(new Cypher('CONTAINS', ' '));
    return this;
  }

  public regularExpression(): CypherEngine {
    this._cypher.push(new Cypher('=~', ' '));
    return this;
  }

  public returns(...variableNames: string[]): CypherEngine {
    const statement = `RETURN ${variableNames.length ? variableNames.join(',') : '*'}`;
    this._cypher.push(new Cypher(statement, ' '));
    return this;
  }

  public limit(limit: number | string): CypherEngine {
    const statement = `LIMIT ${limit}`;
    this._cypher.push(new Cypher(statement, ' '));
    return this;
  }

  public skip(skip: number | string): CypherEngine {
    const statement = `SKIP ${skip}`;
    this._cypher.push(new Cypher(statement, ' '));
    return this;
  }

  public toString(): string {
    return this.cypher;
  }

  private nodeString(labels: string[], variableName?: string, ...properties: Property[]): string {
    let statement = `(${variableName || ''}${labels.length ? ':' + labels.join(':') : ''}`;
    statement += this.propertyFilter(...properties);
    statement += ')';
    return statement;
  }

  private variableString(variableName: string, property?: string): string {
    let statement = '';
    if (property) {
      statement = `${variableName}${property ? '.' + property : ''}`;
    } else {
      statement = `(${variableName})`;
    }
    return statement;
  }

  private propertySetter(...properties: SetProperty[]): string {
    const variableArr: string[] = [];
    for (const prop of properties) {
      variableArr.push(`${prop.variableName}.${prop.property.name} = ${prop.property.value}`);
    }
    return variableArr.join(', ');
  }

  private propertyFilter(...properties: Property[]): string {
    let statement = '';
    for (let j = 0; j < properties.length; j++) {
      if (j === 0) {
        statement += '{';
      }
      const property = properties[j];
      statement += `${property.name}:${property.value}`;
      if (j < properties.length - 1) {
        statement += ', ';
      } else {
        statement += `}`;
      }
    }
    return statement;
  }

  public orderBy(variableNames: string[], sorts?: { prop: string; asc: boolean }[], includePhrase: boolean = true) {
    if (!sorts) {
      return this;
    }
    let n = '';
    for (let j = 0; j < variableNames.length; j++) {
      const variableName = variableNames[j];
      for (let i = 0; i < sorts.length; i++) {
        const sort = sorts[i];
        const asc = sort.asc ? '' : 'DESC';
        n += `${variableName}.${sort.prop + ' ' + asc} `;
        if (i !== sorts.length - 1) {
          n += ', ';
        }
      }
      if (j !== variableNames.length - 1) {
        n += ', ';
      }
    }
    this._cypher.push(new Cypher(`${includePhrase ? 'ORDER BY' : ''} ${n.trim()}`));
    return this;
  }

  public case(): CypherEngine {
    this._cypher.push(new Cypher('CASE', ' '));
    return this;
  }

  public when(): CypherEngine {
    this._cypher.push(new Cypher('WHEN', ' '));
    return this;
  }

  public then(): CypherEngine {
    this._cypher.push(new Cypher('THEN', ' '));
    return this;
  }

  public remove(): CypherEngine {
    this._cypher.push(new Cypher('REMOVE', ' '));
    return this;
  }

  public else(): CypherEngine {
    this._cypher.push(new Cypher('ELSE', ' '));
    return this;
  }
}
