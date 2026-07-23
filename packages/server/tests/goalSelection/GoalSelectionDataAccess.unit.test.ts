import { Knex } from 'knex';

import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import GoalSelectionDataAccess from 'services/goalSelectionService/GoalSelectionDataAccess';
import { DBError } from 'src/utils/errors/DBError';

const USER_ID = 42;

// Chainable stand-in for the knex query builder used by GoalSelectionDataAccess:
//   get:  engine()('goals').where({ userId }).orderBy('createdAt', 'desc').first()
//   post: engine()('goals').insert({ userId, selectedGoals })
const first = jest.fn();
const orderBy = jest.fn(() => ({ first }));
const where = jest.fn(() => ({ orderBy }));
const insert = jest.fn();

const knexMock = jest.fn(() => ({ where, insert }));

const db: IDatabaseConnection = {
    engine: () => knexMock as unknown as Knex,
    close: jest.fn(),
    transaction: jest.fn(),
};

let dataAccess: GoalSelectionDataAccess;

beforeEach(() => {
    jest.clearAllMocks();
    dataAccess = new GoalSelectionDataAccess(db);
});

describe('get', () => {
    it('returns the goals of the latest selection for the user', async () => {
        first.mockResolvedValue({ userId: USER_ID, selectedGoals: ['save', 'budget'], createdAt: new Date() });

        const result = await dataAccess.get(USER_ID);

        expect(knexMock).toHaveBeenCalledWith('goals');
        expect(where).toHaveBeenCalledWith({ userId: USER_ID });
        expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
        expect(result).toEqual(['save', 'budget']);
    });

    it('returns an empty list when the user has no saved selection', async () => {
        first.mockResolvedValue(undefined);

        await expect(dataAccess.get(USER_ID)).resolves.toEqual([]);
    });

    it('wraps database errors into DBError', async () => {
        first.mockRejectedValue(new Error('connection lost'));

        await expect(dataAccess.get(USER_ID)).rejects.toBeInstanceOf(DBError);
    });
});

describe('post', () => {
    it('inserts a new selection row for the user', async () => {
        insert.mockResolvedValue(undefined);

        await dataAccess.post(USER_ID, ['save', 'grow']);

        expect(knexMock).toHaveBeenCalledWith('goals');
        expect(insert).toHaveBeenCalledWith({ userId: USER_ID, selectedGoals: ['save', 'grow'] });
    });

    it('wraps database errors into DBError', async () => {
        insert.mockRejectedValue(new Error('connection lost'));

        await expect(dataAccess.post(USER_ID, ['save'])).rejects.toBeInstanceOf(DBError);
    });
});
