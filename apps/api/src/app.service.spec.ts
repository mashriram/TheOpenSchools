import { AppService } from './app.service';

describe('AppService', () => {
  it('getHello returns the greeting string', () => {
    const service = new AppService();

    expect(service.getHello()).toBe('Hello World!');
  });

  it('getHello is deterministic across repeated calls', () => {
    const service = new AppService();

    expect(service.getHello()).toBe(service.getHello());
  });
});
