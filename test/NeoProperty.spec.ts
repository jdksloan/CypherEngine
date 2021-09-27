import { NeoProperty } from '../src/models/NeoProperty';

describe('Test NeoProperty', () => {
  test('Instantiation', async () => {
    const model = new NeoProperty('name', 'value');
    expect(model).not.toBe(undefined);
    expect(model).toBeInstanceOf(NeoProperty);
  });
});
