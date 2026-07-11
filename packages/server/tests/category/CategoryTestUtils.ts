import { Agent } from 'supertest';
import { HttpCode } from '@tenpercent/shared';

async function createCategory(
    agent: Agent,
    userId: number,
    authorization: string,
    currencyCode: string,
    categoryName = 'Test category',
    iconId = 'wallet',
): Promise<number> {
    const {
        body: { data },
    } = await agent
        .post(`/user/${userId}/category/`)
        .set('authorization', authorization)
        .send({ categoryName, currencyCode, iconId })
        .expect(HttpCode.OK);
    return data.categoryId;
}

export { createCategory };
