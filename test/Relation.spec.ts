import { Relation } from '../src/models/Relation';

describe('Test Relation', () => {
  test('Instantiation', async () => {
    const model = new Relation();
    expect(model).not.toBe(undefined);
    expect(model).toBeInstanceOf(Relation);
  });
});
