import { NeoKeyModel } from '../src/models/NeoKeyModel';

describe('Test NeoKeyModel', () => {
  test('Instantiation', async () => {
    const model = new NeoKeyModel('url', 'user', 'password', 'encrypted', 'trust', 'timeout');
    expect(model).not.toBe(undefined);
    expect(model).toBeInstanceOf(NeoKeyModel);
  });
});
