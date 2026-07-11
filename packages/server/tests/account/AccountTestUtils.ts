import { Agent } from 'supertest';
import { HttpCode, IAccount } from '@tenpercent/shared';

async function patchAccount(
    agent: Agent,
    userId: number,
    authorization: string,
    id: number,
    payload: Record<string, unknown>,
): Promise<void> {
    await agent
        .patch(`/user/${userId}/account/${id}`)
        .set('authorization', authorization)
        .send(payload)
        .expect(HttpCode.NO_CONTENT);
}
async function deleteAccount(
    agent: Agent,
    userId: number,
    authorization: string,
    payload: Record<string, unknown>,
): Promise<void> {
    await agent
        .delete(`/user/${userId}/account/${payload.accountId}`)
        .set('authorization', authorization)
        .expect(HttpCode.NO_CONTENT);
}
async function getAccount(
    agent: Agent,
    userId: number,
    authorization: string,
    accountId: number,
    payload: Record<string, unknown> = {},
): Promise<IAccount> {
    const {
        body: { data },
    } = await agent.get(`/user/${userId}/account/${accountId}`).set('authorization', authorization).expect(HttpCode.OK);
    return data;
}

async function postAccount(
    agent: Agent,
    userId: number,
    authorization: string,
    payload: Record<string, unknown>,
): Promise<number> {
    const {
        body: { data },
    } = await agent.post(`/user/${userId}/account/`).set('authorization', authorization).send(payload).expect(HttpCode.CREATED);
    const { transactionId } = data;
    return transactionId;
}

async function createAccount(
    agent: Agent,
    userId: number,
    authorization: string,
    currencyCode: string,
    amount = 1000,
    accountName = 'Test account',
    iconId = 'wallet',
): Promise<number> {
    const {
        body: { data },
    } = await agent
        .post(`/user/${userId}/account/`)
        .set('authorization', authorization)
        .send({ currencyCode, accountName, amount, iconId })
        .expect(HttpCode.OK);
    return data.accountId;
}

export { patchAccount, postAccount, createAccount, deleteAccount, getAccount };
