import { HttpCode } from '@tenpercent/shared';

import config from '../../src/config/dbConfig';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import { closeTestApp, createUser, generateRandomEmail, generateRandomName, generateSecureRandom } from '../TestsUtils.';

const request = require('supertest');

require('dotenv').config();

const app = require('../../src/app');

let server: never;
const userIds: number[] = [];

const db = DatabaseConnection.instance(config);

let ownerId: number;
let ownerAuth: string;
let ownerEmail: string;
let ownerPublicName: string;

let memberId: number;
let memberAuth: string;
let memberEmail: string;

// Unrelated third user, for isolation / foreign-ownership checks.
let thirdId: number;
let thirdAuth: string;
let groupC: number;

let groupA: number;
let groupB: number;

const agent = () => request.agent(server);

beforeAll(async () => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    // @ts-ignore
    server = app.listen(port);

    ownerEmail = generateRandomEmail();
    ownerPublicName = generateRandomName();
    memberEmail = generateRandomEmail();

    const owner = await createUser({ agent: agent(), email: ownerEmail, publicName: ownerPublicName, databaseConnection: db });
    ownerId = owner.userId;
    ownerAuth = owner.authorization;
    userIds.push(ownerId);

    const member = await createUser({ agent: agent(), email: memberEmail, databaseConnection: db });
    memberId = member.userId;
    memberAuth = member.authorization;
    userIds.push(memberId);

    const g1 = await agent()
        .post(`/user/${ownerId}/group`)
        .set('authorization', ownerAuth)
        .send({ groupName: 'Family', description: 'Household budget' })
        .expect(HttpCode.OK);
    groupA = g1.body.data.userGroupId;

    const g2 = await agent()
        .post(`/user/${ownerId}/group`)
        .set('authorization', ownerAuth)
        .send({ groupName: 'Finance' })
        .expect(HttpCode.OK);
    groupB = g2.body.data.userGroupId;

    const third = await createUser({ agent: agent(), databaseConnection: db });
    thirdId = third.userId;
    thirdAuth = third.authorization;
    userIds.push(thirdId);

    const g3 = await agent()
        .post(`/user/${thirdId}/group`)
        .set('authorization', thirdAuth)
        .send({ groupName: 'Outsider' })
        .expect(HttpCode.OK);
    groupC = g3.body.data.userGroupId;
});

afterAll(async () => {
    await db.engine()('userconnections').whereIn('ownerUserId', userIds).orWhereIn('memberUserId', userIds).delete();
    await closeTestApp(server, userIds);
});

const invite = (email: string, userGroupId: number) =>
    agent().post(`/user/${ownerId}/sharing/invite`).set('authorization', ownerAuth).send({ email, userGroupId });

const ownerSent = () => agent().get(`/user/${ownerId}/sharing/connections/sent`).set('authorization', ownerAuth);
const memberPending = () => agent().get(`/user/${memberId}/sharing/connections/pending`).set('authorization', memberAuth);
const ownerConnections = () => agent().get(`/user/${ownerId}/sharing/connections`).set('authorization', ownerAuth);
const memberConnections = () => agent().get(`/user/${memberId}/sharing/connections`).set('authorization', memberAuth);

describe('Sharing', () => {
    it('invite: shows in owner sent and member pending', async () => {
        await invite(memberEmail, groupA).expect(HttpCode.OK);

        const sent = await ownerSent().expect(HttpCode.OK);
        expect(sent.body.data).toEqual([expect.objectContaining({ email: memberEmail, connectionId: expect.any(Number) })]);

        const pending = await memberPending().expect(HttpCode.OK);
        expect(pending.body.data).toEqual([
            expect.objectContaining({
                email: ownerEmail,
                publicName: ownerPublicName,
                connectionId: sent.body.data[0].connectionId,
            }),
        ]);
    });

    it('cancel: owner cancels sent request, member pending clears', async () => {
        const sent = await ownerSent().expect(HttpCode.OK);
        const connectionId = sent.body.data[0].connectionId;

        await agent()
            .delete(`/user/${ownerId}/sharing/connection/${connectionId}`)
            .set('authorization', ownerAuth)
            .expect(HttpCode.NO_CONTENT);

        expect((await memberPending().expect(HttpCode.OK)).body.data).toEqual([]);
        expect((await ownerSent().expect(HttpCode.OK)).body.data).toEqual([]);
    });

    it('decline: member declines, request leaves pending without connecting', async () => {
        await invite(memberEmail, groupA).expect(HttpCode.OK);
        const connectionId = (await ownerSent()).body.data[0].connectionId;

        await agent()
            .post(`/user/${memberId}/sharing/connection/${connectionId}/decline`)
            .set('authorization', memberAuth)
            .expect(HttpCode.NO_CONTENT);

        expect((await memberPending()).body.data).toEqual([]);
        expect((await ownerConnections()).body.data).toEqual([]);
        await db.engine()('userconnections').where({ connectionId }).delete();
    });

    it('accept: member accepts, both sides see a connected user', async () => {
        await invite(memberEmail, groupA).expect(HttpCode.OK);
        const connectionId = (await ownerSent()).body.data[0].connectionId;

        await agent()
            .post(`/user/${memberId}/sharing/connection/${connectionId}/accept`)
            .set('authorization', memberAuth)
            .expect(HttpCode.NO_CONTENT);

        expect((await memberPending()).body.data).toEqual([]);

        const ownerConn = await ownerConnections().expect(HttpCode.OK);
        expect(ownerConn.body.data).toEqual([
            expect.objectContaining({ connectionId, email: memberEmail, isOwner: true, userGroupId: groupA }),
        ]);
        expect(Object.keys(ownerConn.body.data[0]).sort()).toEqual([
            'connectionId',
            'email',
            'isOwner',
            'publicName',
            'userGroupId',
        ]);

        const memberConn = await memberConnections().expect(HttpCode.OK);
        expect(memberConn.body.data).toEqual([expect.objectContaining({ connectionId, email: ownerEmail, isOwner: false })]);
    });

    it('change group: owner moves the connected member to another group', async () => {
        const connectionId = (await ownerConnections()).body.data[0].connectionId;

        await agent()
            .patch(`/user/${ownerId}/sharing/connection/${connectionId}/owner`)
            .set('authorization', ownerAuth)
            .send({ userGroupId: groupB })
            .expect(HttpCode.NO_CONTENT);

        const ownerConn = await ownerConnections().expect(HttpCode.OK);
        expect(ownerConn.body.data).toEqual([expect.objectContaining({ connectionId, userGroupId: groupB })]);
    });

    it('disconnect: owner removes the connected member from both sides', async () => {
        const connectionId = (await ownerConnections()).body.data[0].connectionId;

        await agent()
            .delete(`/user/${ownerId}/sharing/connection/${connectionId}`)
            .set('authorization', ownerAuth)
            .expect(HttpCode.NO_CONTENT);

        expect((await ownerConnections()).body.data).toEqual([]);
        expect((await memberConnections()).body.data).toEqual([]);
    });

    it('invite unknown email: returns OK but creates no request (anti-enumeration)', async () => {
        await invite(generateRandomEmail(), groupA).expect(HttpCode.OK);
        expect((await ownerSent()).body.data).toEqual([]);
    });

    it('invite own email: returns OK but creates no self-connection', async () => {
        await invite(ownerEmail, groupA).expect(HttpCode.OK);
        expect((await ownerSent()).body.data).toEqual([]);
    });

    it('groups: create then delete', async () => {
        const created = await agent()
            .post(`/user/${ownerId}/group`)
            .set('authorization', ownerAuth)
            .send({ groupName: 'Temporary' })
            .expect(HttpCode.OK);
        const userGroupId = created.body.data.userGroupId;

        const listed = await agent().get(`/user/${ownerId}/groups`).set('authorization', ownerAuth).expect(HttpCode.OK);
        expect(listed.body.data).toEqual(
            expect.arrayContaining([expect.objectContaining({ userGroupId, groupName: 'Temporary' })]),
        );

        await agent().delete(`/user/${ownerId}/group/${userGroupId}`).set('authorization', ownerAuth).expect(HttpCode.NO_CONTENT);

        const after = await agent().get(`/user/${ownerId}/groups`).set('authorization', ownerAuth).expect(HttpCode.OK);
        expect(after.body.data.find((g: { userGroupId: number }) => g.userGroupId === userGroupId)).toBeUndefined();
    });

    it('delete group: blocked while a connected member is assigned, allowed after reassigning', async () => {
        await invite(memberEmail, groupA).expect(HttpCode.OK);
        const connectionId = (await ownerSent()).body.data[0].connectionId;
        await agent()
            .post(`/user/${memberId}/sharing/connection/${connectionId}/accept`)
            .set('authorization', memberAuth)
            .expect(HttpCode.NO_CONTENT);

        const temp = await agent()
            .post(`/user/${ownerId}/group`)
            .set('authorization', ownerAuth)
            .send({ groupName: 'ToRemove' })
            .expect(HttpCode.OK);
        const removableGroup = temp.body.data.userGroupId;

        await agent()
            .patch(`/user/${ownerId}/sharing/connection/${connectionId}/owner`)
            .set('authorization', ownerAuth)
            .send({ userGroupId: removableGroup })
            .expect(HttpCode.NO_CONTENT);

        // group has a connected member → deletion is rejected
        const blocked = await agent().delete(`/user/${ownerId}/group/${removableGroup}`).set('authorization', ownerAuth);
        expect(blocked.status).toBeGreaterThanOrEqual(400);
        expect((await ownerConnections()).body.data).toEqual([
            expect.objectContaining({ connectionId, userGroupId: removableGroup }),
        ]);

        // reassign the member off the group, then deletion succeeds
        await agent()
            .patch(`/user/${ownerId}/sharing/connection/${connectionId}/owner`)
            .set('authorization', ownerAuth)
            .send({ userGroupId: groupA })
            .expect(HttpCode.NO_CONTENT);
        await agent()
            .delete(`/user/${ownerId}/group/${removableGroup}`)
            .set('authorization', ownerAuth)
            .expect(HttpCode.NO_CONTENT);
    });
});

const accept = (auth: string, uid: number, connectionId: number) =>
    agent().post(`/user/${uid}/sharing/connection/${connectionId}/accept`).set('authorization', auth);

const wipeConnections = () =>
    db
        .engine()('userconnections')
        .whereIn('ownerUserId', [ownerId, memberId, thirdId])
        .orWhereIn('memberUserId', [ownerId, memberId, thirdId])
        .delete();

const createPending = async (): Promise<number> => {
    await invite(memberEmail, groupA).expect(HttpCode.OK);
    return (await ownerSent()).body.data[0].connectionId;
};

const createConnected = async (): Promise<number> => {
    const connectionId = await createPending();
    await accept(memberAuth, memberId, connectionId).expect(HttpCode.NO_CONTENT);
    return connectionId;
};

describe('Sharing- authorization & edge cases', () => {
    beforeEach(async () => {
        await wipeConnections();
    });

    it('owner cannot accept their own sent request', async () => {
        const connectionId = await createPending();
        const res = await accept(ownerAuth, ownerId, connectionId);
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect((await ownerConnections()).body.data).toEqual([]);
    });

    it('member cannot change the group (owner-only action)', async () => {
        const connectionId = await createConnected();
        const res = await agent()
            .patch(`/user/${memberId}/sharing/connection/${connectionId}/owner`)
            .set('authorization', memberAuth)
            .send({ userGroupId: groupB });
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect((await ownerConnections()).body.data).toEqual([expect.objectContaining({ connectionId, userGroupId: groupA })]);
    });

    it('member cannot remove the connection (owner-only action)', async () => {
        const connectionId = await createConnected();
        const res = await agent().delete(`/user/${memberId}/sharing/connection/${connectionId}`).set('authorization', memberAuth);
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect((await ownerConnections()).body.data).toHaveLength(1);
    });

    it('owner cannot leave the connection (member-only action)', async () => {
        const connectionId = await createConnected();
        const res = await agent()
            .delete(`/user/${ownerId}/sharing/connection/${connectionId}/leave`)
            .set('authorization', ownerAuth);
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect((await ownerConnections()).body.data).toHaveLength(1);
    });

    it('member can leave the connection', async () => {
        const connectionId = await createConnected();
        await agent()
            .delete(`/user/${memberId}/sharing/connection/${connectionId}/leave`)
            .set('authorization', memberAuth)
            .expect(HttpCode.NO_CONTENT);
        expect((await ownerConnections()).body.data).toEqual([]);
        expect((await memberConnections()).body.data).toEqual([]);
    });

    it('a third user cannot see or act on a foreign connection', async () => {
        const connectionId = await createConnected();
        const thirdConnections = await agent()
            .get(`/user/${thirdId}/sharing/connections`)
            .set('authorization', thirdAuth)
            .expect(HttpCode.OK);
        expect(thirdConnections.body.data).toEqual([]);

        const acc = await accept(thirdAuth, thirdId, connectionId);
        expect(acc.status).toBeGreaterThanOrEqual(400);
        const del = await agent().delete(`/user/${thirdId}/sharing/connection/${connectionId}`).set('authorization', thirdAuth);
        expect(del.status).toBeGreaterThanOrEqual(400);
        expect((await ownerConnections()).body.data).toHaveLength(1);
    });

    it('owner cannot assign a group owned by another user', async () => {
        const connectionId = await createConnected();
        const res = await agent()
            .patch(`/user/${ownerId}/sharing/connection/${connectionId}/owner`)
            .set('authorization', ownerAuth)
            .send({ userGroupId: groupC });
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect((await ownerConnections()).body.data).toEqual([expect.objectContaining({ connectionId, userGroupId: groupA })]);
    });

    it('owner cannot invite into a group owned by another user', async () => {
        const res = await invite(memberEmail, groupC);
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect((await memberPending()).body.data).toEqual([]);
    });

    it('cross-user path is forbidden', async () => {
        const res = await agent().get(`/user/${memberId}/sharing/connections`).set('authorization', ownerAuth);
        expect(res.status).toStrictEqual(HttpCode.FORBIDDEN);
    });

    it('double accept is rejected', async () => {
        const connectionId = await createConnected();
        const res = await accept(memberAuth, memberId, connectionId);
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('changing group of a not-yet-connected (pending) connection is rejected', async () => {
        const connectionId = await createPending();
        const res = await agent()
            .patch(`/user/${ownerId}/sharing/connection/${connectionId}/owner`)
            .set('authorization', ownerAuth)
            .send({ userGroupId: groupB });
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('acting on a non-existent connection returns an error', async () => {
        const res = await agent().delete(`/user/${ownerId}/sharing/connection/999999999`).set('authorization', ownerAuth);
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it.failing('re-inviting the same member while a request is pending creates no duplicate', async () => {
        await createPending();
        await invite(memberEmail, groupA).expect(HttpCode.OK);
        expect((await ownerSent()).body.data).toHaveLength(1);
        expect((await memberPending()).body.data).toHaveLength(1);
    });

    it('member can be re-invited after declining a previous request', async () => {
        const connectionId = await createPending();
        await agent()
            .post(`/user/${memberId}/sharing/connection/${connectionId}/decline`)
            .set('authorization', memberAuth)
            .expect(HttpCode.NO_CONTENT);
        expect((await memberPending()).body.data).toEqual([]);

        await invite(memberEmail, groupA).expect(HttpCode.OK);
        expect((await memberPending()).body.data).toHaveLength(1);
    });

    it('invite with an invalid email is rejected by validation', async () => {
        const res = await invite('not-an-email', groupA);
        expect(res.status).toStrictEqual(HttpCode.BAD_REQUEST);
    });

    it('pending and sent responses expose no foreign userId', async () => {
        await createPending();
        const pending = (await memberPending()).body.data[0];
        expect(Object.keys(pending).sort()).toEqual(['connectionId', 'createdAt', 'email', 'publicName']);
        const sent = (await ownerSent()).body.data[0];
        expect(Object.keys(sent).sort()).toEqual(['connectionId', 'createdAt', 'email']);
    });
});

describe('Sharing- groups', () => {
    it('rename a group and read it back', async () => {
        const created = await agent()
            .post(`/user/${ownerId}/group`)
            .set('authorization', ownerAuth)
            .send({ groupName: 'Before' })
            .expect(HttpCode.OK);
        const userGroupId = created.body.data.userGroupId;

        await agent()
            .patch(`/user/${ownerId}/group/${userGroupId}`)
            .set('authorization', ownerAuth)
            .send({ groupName: 'After', description: 'renamed' })
            .expect(HttpCode.NO_CONTENT);

        const one = await agent()
            .get(`/user/${ownerId}/group/${userGroupId}`)
            .set('authorization', ownerAuth)
            .expect(HttpCode.OK);
        expect(one.body.data).toEqual(expect.objectContaining({ userGroupId, groupName: 'After', description: 'renamed' }));

        await agent().delete(`/user/${ownerId}/group/${userGroupId}`).set('authorization', ownerAuth).expect(HttpCode.NO_CONTENT);
    });

    it('memberCount reflects connected members', async () => {
        await wipeConnections();
        const connectionId = await createConnected();

        const listed = await agent().get(`/user/${ownerId}/groups`).set('authorization', ownerAuth).expect(HttpCode.OK);
        const group = listed.body.data.find((g: { userGroupId: number }) => g.userGroupId === groupA);
        expect(group.memberCount).toStrictEqual(1);

        await agent()
            .delete(`/user/${ownerId}/sharing/connection/${connectionId}`)
            .set('authorization', ownerAuth)
            .expect(HttpCode.NO_CONTENT);
        const after = await agent().get(`/user/${ownerId}/groups`).set('authorization', ownerAuth).expect(HttpCode.OK);
        const groupAfter = after.body.data.find((g: { userGroupId: number }) => g.userGroupId === groupA);
        expect(groupAfter.memberCount).toStrictEqual(0);
    });

    it('cannot delete a group owned by another user', async () => {
        const res = await agent().delete(`/user/${thirdId}/group/${groupA}`).set('authorization', thirdAuth);
        expect(res.status).toBeGreaterThanOrEqual(400);
        const listed = await agent().get(`/user/${ownerId}/groups`).set('authorization', ownerAuth).expect(HttpCode.OK);
        expect(listed.body.data.find((g: { userGroupId: number }) => g.userGroupId === groupA)).toBeTruthy();
    });
});
