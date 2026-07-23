import { Knex } from 'knex';

import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import TutorialDataAccess from 'services/tutorial/TutorialDataAccess';
import { DBError } from 'src/utils/errors/DBError';

const USER_ID = 42;

const first = jest.fn();
const where = jest.fn(() => ({ first }));
const returning = jest.fn();
const merge = jest.fn(() => ({ returning }));
const onConflict = jest.fn(() => ({ merge }));
const insert = jest.fn(() => ({ onConflict }));

const knexMock = jest.fn(() => ({ where, insert }));

const db: IDatabaseConnection = {
    engine: () => knexMock as unknown as Knex,
    close: jest.fn(),
    transaction: jest.fn(),
};

let dataAccess: TutorialDataAccess;

beforeEach(() => {
    jest.clearAllMocks();
    dataAccess = new TutorialDataAccess(db);
});

describe('get', () => {
    it('queries the tutorials table by userId and returns the row', async () => {
        const row = { userId: USER_ID, isOnBoardingTutorialView: true };
        first.mockResolvedValue(row);

        const result = await dataAccess.get(USER_ID);

        expect(knexMock).toHaveBeenCalledWith('tutorials');
        expect(where).toHaveBeenCalledWith({ userId: USER_ID });
        expect(result).toBe(row);
    });

    it('returns undefined when the user has no row', async () => {
        first.mockResolvedValue(undefined);

        await expect(dataAccess.get(USER_ID)).resolves.toBeUndefined();
    });

    it('wraps database errors into DBError', async () => {
        first.mockRejectedValue(new Error('connection lost'));

        await expect(dataAccess.get(USER_ID)).rejects.toBeInstanceOf(DBError);
    });
});

describe('patch', () => {
    it('upserts by userId and returns the updated row', async () => {
        const row = { userId: USER_ID, isOnBoardingTutorialView: true, onBoardingViewedSlidesCount: 5 };
        returning.mockResolvedValue([row]);

        const result = await dataAccess.patch(USER_ID, {
            isOnBoardingTutorialView: true,
            onBoardingViewedSlidesCount: 5,
        });

        expect(knexMock).toHaveBeenCalledWith('tutorials');
        expect(insert).toHaveBeenCalledWith({
            isOnBoardingTutorialView: true,
            onBoardingViewedSlidesCount: 5,
            userId: USER_ID,
        });
        expect(onConflict).toHaveBeenCalledWith('userId');
        expect(merge).toHaveBeenCalledWith({ isOnBoardingTutorialView: true, onBoardingViewedSlidesCount: 5 });
        expect(returning).toHaveBeenCalledWith('*');
        expect(result).toBe(row);
    });

    it('drops undefined fields so a partial update does not reset other flags', async () => {
        returning.mockResolvedValue([{ userId: USER_ID }]);

        await dataAccess.patch(USER_ID, {
            isOnBoardingTutorialView: true,
            isAccountTutorialView: undefined,
            onBoardingViewedSlidesCount: undefined,
        });

        expect(insert).toHaveBeenCalledWith({ isOnBoardingTutorialView: true, userId: USER_ID });
        expect(merge).toHaveBeenCalledWith({ isOnBoardingTutorialView: true });
    });

    it('rejects payloads with unexpected properties', async () => {
        await expect(dataAccess.patch(USER_ID, { hacked: true } as never)).rejects.toBeInstanceOf(DBError);
        expect(insert).not.toHaveBeenCalled();
    });

    it('wraps database errors into DBError', async () => {
        returning.mockRejectedValue(new Error('connection lost'));

        await expect(dataAccess.patch(USER_ID, { isOnBoardingTutorialView: true })).rejects.toBeInstanceOf(DBError);
    });
});
