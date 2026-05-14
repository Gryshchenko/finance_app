import { ITransaction, TransactionType } from 'tenpercent/shared';
import { HttpCode } from 'tenpercent/shared';
import { Agent } from 'supertest';
import type { Response } from 'supertest';

async function patchTransaction(
    agent: Agent,
    userId: number,
    authorization: string,
    id: number,
    payload: Record<string, unknown>,
): Promise<void> {
    await agent
        .patch(`/user/${userId}/transaction/${id}`)
        .set('authorization', authorization)
        .send(payload)
        .expect(HttpCode.NO_CONTENT);
}
async function deleteTransaction(
    agent: Agent,
    userId: number,
    authorization: string,
    payload: Record<string, unknown>,
): Promise<void> {
    await agent
        .delete(`/user/${userId}/transaction/${payload.transactionId}`)
        .set('authorization', authorization)
        .expect(HttpCode.NO_CONTENT);
}
async function getTransaction(
    agent: Agent,
    userId: number,
    authorization: string,
    payload: Record<string, unknown>,
): Promise<ITransaction> {
    const {
        body: { data },
    } = await agent
        .get(`/user/${userId}/transaction/${payload.transactionId}`)
        .set('authorization', authorization)
        .expect(HttpCode.OK);
    return data;
}

async function tryCreateTransaction(
    agent: Agent,
    userId: number,
    authorization: string,
    payload: Record<string, unknown>,
): Promise<Response> {
    return agent.post(`/user/${userId}/transaction/`).set('authorization', authorization).send(payload);
}

async function tryPatchTransaction(
    agent: Agent,
    userId: number,
    authorization: string,
    id: number,
    payload: Record<string, unknown>,
): Promise<Response> {
    return agent.patch(`/user/${userId}/transaction/${id}`).set('authorization', authorization).send(payload);
}

async function postTransaction(
    agent: Agent,
    userId: number,
    authorization: string,
    payload: Record<string, unknown>,
): Promise<number> {
    const {
        body: { data },
    } = await agent
        .post(`/user/${userId}/transaction/`)
        .set('authorization', authorization)
        .send(payload)
        .expect(HttpCode.CREATED);
    const { transactionId } = data;
    return transactionId;
}

async function createTransferTransaction(
    agent: Agent,
    userId: number,
    authorization: string,
    accountId: number,
    targetAccountId: number,
    currencyId: number,
    amount = 100,
    createdAt?: string,
): Promise<number> {
    const id = await postTransaction(agent, userId, authorization, {
        accountId,
        currencyId,
        transactionTypeId: TransactionType.Transafer,
        targetAccountId,
        amount,
        description: 'Test transfer',
        createdAt,
    });
    return id;
}

async function createTransferTransactions(
    agent: Agent,
    userId: number,
    authorization: string,
    accountId: number,
    targetAccountId: number,
    currencyId: number,
    amount = 100,
    count = 9,
    createdAt?: string,
): Promise<number[]> {
    const transactionIds: number[] = [];
    for (const _ of Array(count)) {
        const id = await postTransaction(agent, userId, authorization, {
            accountId,
            currencyId,
            transactionTypeId: TransactionType.Transafer,
            targetAccountId,
            amount: amount,
            description: 'Test transfer',
            createdAt,
        });
        transactionIds.push(id);
    }
    return transactionIds;
}

async function createIncomeTransaction(
    agent: Agent,
    userId: number,
    authorization: string,
    accountId: number,
    incomeId: number,
    currencyId: number,
    amount = 100,
    createdAt?: string,
): Promise<number> {
    const id = await postTransaction(agent, userId, authorization, {
        accountId,
        incomeId,
        transactionTypeId: TransactionType.Income,
        amount,
        currencyId,
        description: 'Test income',
        createdAt,
    });
    return id;
}

async function createIncomeTransactions(
    agent: Agent,
    userId: number,
    authorization: string,
    accountId: number,
    incomeId: number,
    currencyId: number,
    amount = 100,
    count = 9,
    createdAt?: string,
): Promise<number[]> {
    const transactionIds: number[] = [];
    for (const _ of Array(count)) {
        const id = await postTransaction(agent, userId, authorization, {
            accountId,
            incomeId,
            transactionTypeId: TransactionType.Income,
            amount,
            currencyId,
            description: 'Test income',
            createdAt,
        });
        transactionIds.push(id);
    }
    return transactionIds;
}

async function createExpenseTransaction(
    agent: Agent,
    userId: number,
    authorization: string,
    accountId: number,
    categoryId: number,
    currencyId: number,
    amount = 100,
    createdAt?: string,
): Promise<number> {
    const id = await postTransaction(agent, userId, authorization, {
        accountId,
        categoryId,
        transactionTypeId: TransactionType.Expense,
        amount,
        currencyId,
        description: 'Test expense',
        createdAt,
    });

    return id;
}

async function patchExpenseTransaction(
    agent: Agent,
    userId: number,
    authorization: string,
    id: number,
    amount = 100,
    createdAt?: string,
): Promise<void> {
    await patchTransaction(agent, userId, authorization, id, {
        amount,
        createdAt,
    });
}

async function createExpenseTransactions(
    agent: Agent,
    userId: number,
    authorization: string,
    accountId: number,
    categoryId: number,
    currencyId: number,
    amount = 100,
    count = 9,
    createdAt?: string,
): Promise<number[]> {
    const transactionIds: number[] = [];
    for (const _ of Array(count)) {
        const id = await postTransaction(agent, userId, authorization, {
            accountId,
            categoryId,
            transactionTypeId: TransactionType.Expense,
            amount,
            currencyId,
            description: 'Test expense',
            createdAt,
        });
        transactionIds.push(id);
    }
    return transactionIds;
}

async function createAllTransactions(
    agent: Agent,
    userId: number,
    authorization: string,
    accountId: number,
    currencyId: number,
    categoryId: number,
    incomeId: number,
    targetAccountId: number,
): Promise<number[]> {
    const transferIds = await createTransferTransactions(agent, userId, authorization, accountId, targetAccountId, currencyId);
    const incomeIds = await createIncomeTransactions(agent, userId, authorization, accountId, incomeId, currencyId);
    const expenseIds = await createExpenseTransactions(agent, userId, authorization, accountId, categoryId, currencyId);
    return [...transferIds, ...incomeIds, ...expenseIds];
}
async function fetchTransactions(
    agent: Agent,
    userId: number,
    authorization: string,
    limit: number,
    cursor?: string,
    query = '',
) {
    const cursorParam = cursor ? `&cursor=${cursor}` : '';
    const {
        body: {
            data: { limit: resLimit, cursor: resCursor, data },
        },
    } = await agent
        .get(`/user/${userId}/transactions/?limit=${limit}${cursorParam}${query}`)
        .set('authorization', authorization)
        .expect(HttpCode.OK);
    return { resLimit, resCursor, data };
}

async function fetchTransactionsAll(agent: Agent, userId: number, authorization: string, limit: number, cursor?: string) {
    const cursorParam = cursor ? `&cursor=${cursor}` : '';
    const {
        body: { data: all },
    } = await agent
        .get(`/user/${userId}/transactions/?limit=${limit}${cursorParam}`)
        .set('authorization', authorization)
        .expect(HttpCode.OK);
    return all;
}

async function fetchTransactionsBad(agent: Agent, userId: number, authorization: string) {
    await agent
        .get(`/user/${userId}/transactions/?limit=3&cursor=!!!not-valid-base64-json!!!`)
        .set('authorization', authorization)
        .expect(HttpCode.BAD_REQUEST);
}

export {
    fetchTransactionsBad,
    fetchTransactionsAll,
    fetchTransactions,
    createAllTransactions,
    createExpenseTransactions,
    createIncomeTransactions,
    createIncomeTransaction,
    createTransferTransactions,
    createTransferTransaction,
    createExpenseTransaction,
    patchExpenseTransaction,
    patchTransaction,
    getTransaction,
    deleteTransaction,
    tryCreateTransaction,
    tryPatchTransaction,
};
