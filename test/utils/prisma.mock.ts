/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export type PrismaMock = ReturnType<typeof createPrismaMock>;

export function createPrismaMock() {
  const mock = {
    item: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    loan: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    reservation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    categorie: {},
    // Unterstützt Array- und Callback-Signatur
    $transaction: jest.fn((arg: any) => {
      if (typeof arg === 'function') {
        // tx-Objekt referenziert dieselben Mocks
        const tx = {
          item: mock.item,
          loan: mock.loan,
          reservation: mock.reservation,
          auditLog: mock.auditLog,
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return arg(tx);
      }
      return Promise.all(arg);
    }),
  };
  return mock;
}
