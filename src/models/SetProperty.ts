import { Property } from './Property';
export class SetProperty {
  public variableName: string;
  public property: Property;

  constructor(variableName: string, updateProperty: Property) {
    this.variableName = variableName;
    this.property = updateProperty;
  }
}
