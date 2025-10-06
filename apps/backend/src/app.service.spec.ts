import { AppService } from './app.service';

describe('AppService', () => {
  it('returns healthy status payload', () => {
    const service = new AppService();

    expect(service.healthCheck()).toEqual({ status: 'ok' });
  });
});
