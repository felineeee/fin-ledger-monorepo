import { Test, TestingModule } from '@nestjs/testing';
// You can even import from your packages directly to ensure the mapping works!
// import { LoggerModule } from '@inv-ledger/loggers';

describe('Sanity Check', () => {
  it('should compile and run standard math', () => {
    expect(1 + 1).toBe(2);
  });
});
