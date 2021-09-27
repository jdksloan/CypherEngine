import { INeoFunction } from './../interfaces/INeoFunction';
import { NeoSetProperty } from '../models/NeoSetProperty';
import { RelationshipDirection } from '../models/RelationshipDirection';
import { NeoProperty } from '../models/NeoProperty';
import { Cypher } from './../models/Cypher';
import { PathRange } from './../models/PathRange';

export class NeoEngine {
  private readonly _cypher: Cypher[];
  private readonly _elementsTenancy = 'Elements';
  private readonly _tenancy: string[] = [];
  private readonly _nodes: string[];
  private readonly _replace = '{#tenant#}';

  constructor(...tenancy: string[]) {
    this._cypher = [];
    for (const tenant of tenancy) {
      this._tenancy.push('`' + tenant + '`');
    }
    this._nodes = [];
  }

  public get cypher(): string {
    return `CYPHER runtime=slotted\n${this.cypherRaw}`;
  }

  public get cypherRaw(): string {
    let baseCypher: string = '';

    for (let i = 0; i < this._cypher.length; i++) {
      const cypher = this._cypher[i];
      baseCypher += i < this._cypher.length - 1 ? `${cypher.cypher}${cypher.seperator}` : cypher.cypher;
    }
    return this._tenancy.length ? this.processTenancy(baseCypher) : baseCypher;
  }

  public match(): NeoEngine {
    this._cypher.push(new Cypher('MATCH', ' '));
    return this;
  }

  public optionalMatch(): NeoEngine {
    this._cypher.push(new Cypher('OPTIONAL', ' '));
    this.match();
    return this;
  }

  public conditional(ifStatement: boolean | undefined, query: string, elseQuery: string): NeoEngine {
    if (ifStatement) {
      this.value(query);
    } else {
      this.value(elseQuery);
    }

    return this;
  }

  public conditionalFunc(ifStatement: boolean | undefined, query: INeoFunction, elseQuery: INeoFunction): NeoEngine {
    if (ifStatement) {
      query(this);
    } else {
      elseQuery(this);
    }

    return this;
  }

  public merge(): NeoEngine {
    if (this._tenancy.length > 1) {
      throw new Error('Only exactly one or none tenancy is allowed for merge');
    }
    this._cypher.push(new Cypher('MERGE', ' '));
    return this;
  }

  public create(): NeoEngine {
    if (this._tenancy.length > 1) {
      throw new Error('Only exactly one or none tenancy is allowed for create');
    }
    this._cypher.push(new Cypher('CREATE', ' '));
    return this;
  }

  public node(labels: string[], variableName?: string, ...properties: NeoProperty[]): NeoEngine {
    if (!this._tenancy || !this._tenancy.length) {
      throw new Error('Tenancy is required for this operation');
    }

    labels.unshift(this._elementsTenancy, this._replace);
    this._cypher.push(new Cypher(this.nodeString(labels, variableName, ...properties)));
    if (variableName) {
      this._nodes.push(variableName);
    }
    return this;
  }

  public declaredNode(variableName: string, ...additionalLabels: string[]): NeoEngine {
    const node = this._nodes.find((x) => x === variableName);
    if (!node) {
      throw new Error(`Could not find node ${variableName}`);
    }
    this._cypher.push(new Cypher(this.nodeString(additionalLabels, variableName)));
    return this;
  }

  public nodeTenantless(labels: string[], variableName?: string, ...properties: NeoProperty[]): NeoEngine {
    labels.unshift(this._elementsTenancy);
    this._cypher.push(new Cypher(this.nodeString(labels, variableName, ...properties)));
    if (variableName) {
      this._nodes.push(variableName);
    }
    return this;
  }

  public variable(variableName: string, property?: string): NeoEngine {
    this._cypher.push(new Cypher(this.variableString(variableName, property), ' '));
    return this;
  }

  public relates(types: string[], direction: RelationshipDirection, variableName?: string, range?: PathRange, ...properties: NeoProperty[]): NeoEngine {
    const variableNameStatement = variableName || '';
    const typesStatement = types.length ? ':' + types.join('|') : '';
    const relationshipRangeStatement = range ? range!.toString() : '';

    let statement = `[${variableNameStatement}${typesStatement}${relationshipRangeStatement}${this.propertyFilter(...properties)}]`;

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

  public delete(variableName: string, ...furtherNames: string[]): NeoEngine {
    const variables: string[] = [];
    variables.push(variableName);
    variables.push(...furtherNames);
    const statement = `DELETE ${variables.join(',')}`;
    this._cypher.push(new Cypher(statement));
    return this;
  }

  public where(): NeoEngine {
    this._cypher.push(new Cypher('WHERE', ' '));
    return this;
  }

  public detach(): NeoEngine {
    const statement = 'DETACH';
    this._cypher.push(new Cypher(statement, ' '));
    return this;
  }

  public unwind(): NeoEngine {
    const statement = `UNWIND`;
    this._cypher.push(new Cypher(statement, ' '));
    return this;
  }

  public with(...variableNames: string[]): NeoEngine {
    if (variableNames && variableNames.length) {
      this._nodes.length = 0;
      this._nodes.push(...variableNames);
    }

    const statement = `WITH ${variableNames.length ? variableNames.join(',') : '*'}`;
    this._cypher.push(new Cypher(statement));
    return this;
  }

  public exists(variableName: string, property: string): NeoEngine {
    const statement = `exists(${variableName}.${property})`;
    this._cypher.push(new Cypher(statement));
    return this;
  }

  //Uses raw data, add '' quotes for strings into the value
  public value(value: string | number | string[] | number[]): NeoEngine {
    let statement = '';
    if (Array.isArray(value)) {
      statement = `${JSON.stringify(value)}`;
    } else {
      statement = `${value}`;
    }
    this._cypher.push(new Cypher(statement, ' '));
    return this;
  }

  public set(...properties: NeoSetProperty[]): NeoEngine {
    const statement = `SET${properties.length ? ' ' + this.propertySetter(...properties) : ''}`;
    this._cypher.push(new Cypher(statement));
    return this;
  }

  public onCreate(): NeoEngine {
    this._cypher.push(new Cypher('ON CREATE', ' '));
    return this;
  }

  public onMatch(): NeoEngine {
    this._cypher.push(new Cypher('ON MATCH', ' '));
    return this;
  }

  public and(): NeoEngine {
    this._cypher.push(new Cypher('AND', ' '));
    return this;
  }

  public or(): NeoEngine {
    this._cypher.push(new Cypher('OR', ' '));
    return this;
  }

  public is(): NeoEngine {
    this._cypher.push(new Cypher('IS', ' '));
    return this;
  }

  public call(apoc: string): NeoEngine {
    this._cypher.push(new Cypher(`CALL ${apoc}`));
    return this;
  }

  public callQuery(engine: NeoEngine): NeoEngine {
    this._cypher.push(new Cypher(`CALL {${engine.cypherRaw}}`));
    return this;
  }

  public in(): NeoEngine {
    this._cypher.push(new Cypher('IN', ' '));
    return this;
  }

  public null(): NeoEngine {
    this._cypher.push(new Cypher('NULL', ' '));
    return this;
  }

  public not(): NeoEngine {
    this._cypher.push(new Cypher('NOT', ' '));
    return this;
  }

  public equals(): NeoEngine {
    this._cypher.push(new Cypher('=', ' '));
    return this;
  }

  public greaterThan(): NeoEngine {
    this._cypher.push(new Cypher('>', ' '));
    return this;
  }

  public lessThan(): NeoEngine {
    this._cypher.push(new Cypher('<', ' '));
    return this;
  }

  public startsWith(): NeoEngine {
    this._cypher.push(new Cypher('STARTS WITH', ' '));
    return this;
  }

  public endsWith(): NeoEngine {
    this._cypher.push(new Cypher('ENDS WITH', ' '));
    return this;
  }

  public contains(): NeoEngine {
    this._cypher.push(new Cypher('CONTAINS', ' '));
    return this;
  }

  public regularExpression(): NeoEngine {
    this._cypher.push(new Cypher('=~', ' '));
    return this;
  }

  public returns(...variableNames: string[]): NeoEngine {
    const statement = `RETURN ${variableNames.length ? variableNames.join(',') : '*'}`; //${limit ? `LIMIT ${limit}` : ''}
    this._cypher.push(new Cypher(statement, ' '));
    return this;
  }

  public limit(limit: number | string): NeoEngine {
    const statement = `LIMIT ${limit}`;
    this._cypher.push(new Cypher(statement, ' '));
    return this;
  }

  public skip(skip: number | string): NeoEngine {
    const statement = `SKIP ${skip}`;
    this._cypher.push(new Cypher(statement, ' '));
    return this;
  }

  public toString(): string {
    return this.cypher;
  }

  private nodeString(labels: string[], variableName?: string, ...properties: NeoProperty[]): string {
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

  private propertySetter(...properties: NeoSetProperty[]): string {
    const variableArr: string[] = [];
    for (let k = 0; k < properties.length; k++) {
      const set = properties[k];
      variableArr.push(`${set.variableName}.${set.property.name} = ${set.property.value}`);
    }
    return variableArr.join(', ');
  }

  private propertyFilter(...properties: NeoProperty[]): string {
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

  private processTenancy(baseCypher: string): string {
    let cypherBuilder: string = '';

    for (let j = 0; j < this._tenancy.length; j++) {
      const tenant = this._tenancy[j];
      cypherBuilder += baseCypher.replace(new RegExp(this._replace, 'g'), tenant);

      if (j < this._tenancy.length - 1) {
        cypherBuilder += '\nUNION ';
      }
    }
    return cypherBuilder;
  }

  public orderBy(variableNames: string[], sorts?: Array<{ prop: string; asc: boolean }>, includePhrase: boolean = true) {
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

  public case(): NeoEngine {
    this._cypher.push(new Cypher('CASE', ' '));
    return this;
  }

  public when(): NeoEngine {
    this._cypher.push(new Cypher('WHEN', ' '));
    return this;
  }

  public then(): NeoEngine {
    this._cypher.push(new Cypher('THEN', ' '));
    return this;
  }

  public remove(): NeoEngine {
    this._cypher.push(new Cypher('REMOVE', ' '));
    return this;
  }

  public else(): NeoEngine {
    this._cypher.push(new Cypher('ELSE', ' '));
    return this;
  }
}
