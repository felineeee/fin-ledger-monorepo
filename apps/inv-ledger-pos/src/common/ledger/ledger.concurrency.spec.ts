import { Test, TestingModule } from '@nestjs/testing';
import { Pool, PoolClient } from 'pg';
import { AppModule } from '@/app.module.js';
import { LedgerService } from '@/common/ledger/ledger.service.js';
import * as crypto from 'crypto';
import { PG_POOL } from '@inv-ledger/database';

describe('Ledger Engine Adversarial Concurrency Test', () => {
  let ledgerService: LedgerService;
  let pool: Pool;
  let aliceUserId: string;
  let aliceAccountId: string;
  let bobAccountId: string;

  beforeAll(async () => {
    // const moduleFixture: TestingModule = await Test.createTestingModule({
    //   imports: [AppModule],
    // }).compile();

    // ledgerService = moduleFixture.get<LedgerService>(LedgerService);
    // pool = moduleFixture.get<Pool>(PG_POOL);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .useMocker((token) => {
        if (token === 'REDIS_CLIENT') {
          return {
            connect: jest.fn().mockResolvedValue(null),
            disconnect: jest.fn().mockResolvedValue(null),
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(null),
            del: jest.fn().mockResolvedValue(null),
          };
        }
      })
      .compile();

    ledgerService = moduleRef.get<LedgerService>(LedgerService);
    pool = moduleRef.get<Pool>(PG_POOL);

    aliceUserId = crypto.randomUUID();
    const bobUserId = crypto.randomUUID();

    const client: PoolClient = await pool.connect();
    try {
      await client.query('DELETE FROM ledger_entries;');
      await client.query('DELETE FROM account_snapshots;');

      const aliceRes = await client.query(
        `INSERT INTO account_snapshots (user_id, balance, currency) VALUES ($1, 10000, 'USD') RETURNING id;`,
        [aliceUserId],
      );
      aliceAccountId = aliceRes.rows[0].id;

      const bobRes = await client.query(
        `INSERT INTO account_snapshots (user_id, balance, currency) VALUES ($1, 0, 'USD') RETURNING id;`,
        [bobUserId],
      );
      bobAccountId = bobRes.rows[0].id;
    } finally {
      client.release();
    }
  });

  it('should process exactly 5 transfers successfully and reject 5 due to row-level balance locks', async () => {
    const totalThreads = 10;
    const transferAmount = BigInt(2000);
    const executionPromises: Promise<any>[] = [];

    for (let i = 0; i < totalThreads; i++) {
      executionPromises.push(
        ledgerService.executeTransfer(
          aliceUserId,
          bobAccountId,
          aliceAccountId,
          transferAmount,
          `Adversarial Parallel Stress Thread Block #${i}`,
        ),
      );
    }

    const outcomes = await Promise.allSettled(executionPromises);

    const successfullTransfers = outcomes.filter(
      (o) => o.status === 'fulfilled',
    );
    const failedTransfers = outcomes.filter((o) => o.status === 'rejected');

    expect(successfullTransfers.length).toBe(5);
    expect(failedTransfers.length).toBe(5);

    const client = await pool.connect();
    try {
      const aliceSnapshot = await client.query(
        'SELECT balance FROM account_snapshots WHERE id = $1',
        [aliceAccountId],
      );
      const bobSnapshot = await client.query(
        'SELECT balance from account_snapshots WHERE id = $1',
        [bobAccountId],
      );

      const finalAliceBalance = BigInt(aliceSnapshot.rows[0].balance);
      const finalBobBalance = BigInt(bobSnapshot.rows[0].balance);

      expect(finalAliceBalance).toBe(BigInt(0));
      expect(finalBobBalance).toBe(BigInt(10000));

      const ledgerCount = await client.query(
        'SELECT COUNT(*) FROM ledger_entries;',
      );
      expect(parseInt(ledgerCount.rows[0].count, 10)).toBe(10);
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });
});
