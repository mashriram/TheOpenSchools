import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getDataSourceToken(),
          useValue: dataSource,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  describe('when the database is reachable', () => {
    it('returns ok status and runs a SELECT 1 probe', async () => {
      dataSource.query.mockResolvedValueOnce([{ '1': 1 }]);

      const result = await controller.check();

      expect(result).toEqual({ status: 'ok', database: 'connected' });
      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
      expect(dataSource.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the database is unreachable', () => {
    it('throws a ServiceUnavailableException with the underlying error message', async () => {
      dataSource.query.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));

      const error = await getThrownError(controller.check());

      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(error.getResponse()).toEqual({
        status: 'error',
        database: 'unreachable',
        message: 'connect ECONNREFUSED',
      });
    });

    it('falls back to a generic message when the thrown value is not an Error', async () => {
      dataSource.query.mockRejectedValueOnce('boom');

      const error = await getThrownError(controller.check());

      expect(error.getResponse()).toEqual({
        status: 'error',
        database: 'unreachable',
        message: 'unknown error',
      });
    });

    it('does not swallow the rejection into a resolved value', async () => {
      dataSource.query.mockRejectedValueOnce(new Error('timeout'));

      await expect(controller.check()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('also catches a synchronous throw from the driver, not just a rejected promise', async () => {
      dataSource.query.mockImplementationOnce(() => {
        throw new Error('pool exhausted');
      });

      const error = await getThrownError(controller.check());

      expect(error.getResponse()).toEqual({
        status: 'error',
        database: 'unreachable',
        message: 'pool exhausted',
      });
    });

    it('reports an empty message as-is rather than substituting the generic fallback', async () => {
      dataSource.query.mockRejectedValueOnce(new Error(''));

      const error = await getThrownError(controller.check());

      expect(error.getResponse()).toEqual({
        status: 'error',
        database: 'unreachable',
        message: '',
      });
    });
  });
});

async function getThrownError(
  promise: Promise<unknown>,
): Promise<ServiceUnavailableException> {
  try {
    await promise;
  } catch (error: unknown) {
    if (!(error instanceof ServiceUnavailableException)) {
      throw error;
    }
    return error;
  }
  throw new Error('expected the promise to reject, but it resolved');
}
