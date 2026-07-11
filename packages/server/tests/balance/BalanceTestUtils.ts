import { Agent } from 'supertest';
import { HttpCode } from '@tenpercent/shared';

async function getBalance(agent: Agent, userId: number, authorization: string): Promise<number> {
    const {
        body: { data },
    } = await agent.get(`/user/${userId}/balance`).set('authorization', authorization).expect(HttpCode.OK);
    return Number(data.balance);
}

export { getBalance };
