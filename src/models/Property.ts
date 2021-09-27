export class Property {
  public name: string;
  public value: string | number | boolean;

  constructor(name: string, value: string | number | boolean) {
    this.name = name;
    this.value = value;
  }
}
