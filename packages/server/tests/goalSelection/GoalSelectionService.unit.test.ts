import GoalSelectionService from 'services/goalSelectionService/GoalSelectionService';
import { IGoalSelectionDataAccess } from 'services/goalSelectionService/GoalSelectionDataAccess';

const USER_ID = 42;

const mockDataAccess: jest.Mocked<IGoalSelectionDataAccess> = {
    get: jest.fn(),
    post: jest.fn(),
};

let service: GoalSelectionService;

beforeEach(() => {
    jest.clearAllMocks();
    service = new GoalSelectionService(mockDataAccess);
});

describe('get', () => {
    it('delegates to dataAccess.get and returns the selected goals', async () => {
        const goals = ['save', 'budget'];
        mockDataAccess.get.mockResolvedValue(goals);

        const result = await service.get(USER_ID);

        expect(mockDataAccess.get).toHaveBeenCalledTimes(1);
        expect(mockDataAccess.get).toHaveBeenCalledWith(USER_ID);
        expect(result).toBe(goals);
    });

    it('returns an empty list when the user never selected goals', async () => {
        mockDataAccess.get.mockResolvedValue([]);

        await expect(service.get(USER_ID)).resolves.toEqual([]);
    });

    it('propagates errors thrown by dataAccess.get', async () => {
        mockDataAccess.get.mockRejectedValue(new Error('DB failure'));

        await expect(service.get(USER_ID)).rejects.toThrow('DB failure');
    });
});

describe('post', () => {
    it('delegates to dataAccess.post with the selected goals', async () => {
        mockDataAccess.post.mockResolvedValue(undefined);

        await service.post(USER_ID, ['save', 'grow']);

        expect(mockDataAccess.post).toHaveBeenCalledTimes(1);
        expect(mockDataAccess.post).toHaveBeenCalledWith(USER_ID, ['save', 'grow']);
    });

    it('propagates errors thrown by dataAccess.post', async () => {
        mockDataAccess.post.mockRejectedValue(new Error('DB failure'));

        await expect(service.post(USER_ID, ['save'])).rejects.toThrow('DB failure');
    });
});
