import { Agent } from 'supertest';
import { HttpCode } from 'tenpercent/shared';

async function createIncome(
    agent: Agent,
    userId: number,
    authorization: string,
    currencyCode: string,
    incomeName = 'Test income',
    iconId = 'bnb',
): Promise<number> {
    const {
        body: { data },
    } = await agent
        .post(`/user/${userId}/income/`)
        .set('authorization', authorization)
        .send({ incomeName, currencyCode, iconId })
        .expect(HttpCode.OK);
    return data.incomeId;
}

export { createIncome };
