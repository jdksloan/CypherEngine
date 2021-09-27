import { NeoProperty } from './NeoProperty';
export class NeoSetProperty {
  public variableName: string;
  public property: NeoProperty;

  constructor(variableName: string, updateProperty: NeoProperty) {
    this.variableName = variableName;
    this.property = updateProperty;
  }
}
