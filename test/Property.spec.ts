import { Property } from '../src/models/Property';

describe('Test Property', () => {
  test('Instantiation', async () => {
    const model = new Property('name', 'value');
    expect(model).not.toBe(undefined);
    expect(model).toBeInstanceOf(Property);
  });
});
