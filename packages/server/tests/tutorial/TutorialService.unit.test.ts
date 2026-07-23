import { ITutorialRequest, ITutorialResponse } from '@tenpercent/shared';

import TutorialService from 'services/tutorial/TutorialService';
import { ITutorialDataAccess } from 'services/tutorial/TutorialDataAccess';

const USER_ID = 42;

const makeTutorials = (overrides: Partial<ITutorialResponse> = {}): ITutorialResponse => ({
    id: '1',
    userId: USER_ID,
    isOnBoardingTutorialView: false,
    isDashboardTutorialView: false,
    isAccountTutorialView: false,
    isCategoryTutorialView: false,
    isIncomeTutorialView: false,
    isBalanceInsightsTutorialView: false,
    isSharingTutorialView: false,
    onBoardingViewedSlidesCount: null,
    ...overrides,
});

const mockDataAccess: jest.Mocked<ITutorialDataAccess> = {
    get: jest.fn(),
    patch: jest.fn(),
};

let service: TutorialService;

beforeEach(() => {
    jest.clearAllMocks();
    service = new TutorialService(mockDataAccess);
});

describe('get', () => {
    it('delegates to dataAccess.get and returns the result', async () => {
        const tutorials = makeTutorials();
        mockDataAccess.get.mockResolvedValue(tutorials);

        const result = await service.get(USER_ID);

        expect(mockDataAccess.get).toHaveBeenCalledTimes(1);
        expect(mockDataAccess.get).toHaveBeenCalledWith(USER_ID);
        expect(result).toBe(tutorials);
    });

    it('returns undefined when the user has no tutorials record', async () => {
        mockDataAccess.get.mockResolvedValue(undefined);

        const result = await service.get(USER_ID);

        expect(result).toBeUndefined();
    });

    it('propagates errors thrown by dataAccess.get', async () => {
        mockDataAccess.get.mockRejectedValue(new Error('DB failure'));

        await expect(service.get(USER_ID)).rejects.toThrow('DB failure');
    });
});

describe('patch', () => {
    it('delegates to dataAccess.patch and returns the updated record', async () => {
        const payload: ITutorialRequest = { isOnBoardingTutorialView: true, onBoardingViewedSlidesCount: 5 };
        const updated = makeTutorials({ isOnBoardingTutorialView: true, onBoardingViewedSlidesCount: 5 });
        mockDataAccess.patch.mockResolvedValue(updated);

        const result = await service.patch(USER_ID, payload);

        expect(mockDataAccess.patch).toHaveBeenCalledTimes(1);
        expect(mockDataAccess.patch).toHaveBeenCalledWith(USER_ID, payload);
        expect(result).toBe(updated);
    });

    it('propagates errors thrown by dataAccess.patch', async () => {
        mockDataAccess.patch.mockRejectedValue(new Error('DB failure'));

        await expect(service.patch(USER_ID, { isOnBoardingTutorialView: true })).rejects.toThrow('DB failure');
    });
});
