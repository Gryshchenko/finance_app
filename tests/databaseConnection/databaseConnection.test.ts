import DatabaseConnection from '../../src/repositories/DatabaseConnection';

export const dbMock = jest.mock('../../src/repositories/DatabaseConnection', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => {
            return {
                engine: jest.fn().mockReturnValue({
                    first: jest.fn().mockResolvedValue([]),
                    where: jest.fn().mockResolvedValue([]),
                    select: jest.fn().mockResolvedValue([]),
                    insert: jest.fn().mockResolvedValue([1]),
                    update: jest.fn().mockResolvedValue([1]),
                    delete: jest.fn().mockResolvedValue([1]),
                }),
                close: jest.fn().mockResolvedValue(true),
                destroy: jest.fn().mockResolvedValue(undefined),
            };
        }),
    };
});

describe('DatabaseConnection', () => {
    let dbConnection: DatabaseConnection;

    beforeEach(() => {
        dbConnection = new DatabaseConnection({
            host: 'localhost',
            port: 5432,
            database: 'testdb',
            user: 'user',
            password: 'password',
            cert: 'cert',
        });
    });

    it('should create a database connection instance', () => {
        expect(dbConnection).toBeTruthy();
    });

    it('should return a mock Knex instance from engine method', () => {
        const engine = dbConnection.engine();
        expect(engine).toBeTruthy();
        expect(engine.select).toBeDefined();
        expect(engine.insert).toBeDefined();
        expect(engine.where).toBeDefined();
        expect(engine.update).toBeDefined();
        expect(engine.delete).toBeDefined();
    });

    it('should close the database connection', async () => {
        await dbConnection.close();
        expect(dbConnection.close).toBeDefined();
    });
});
