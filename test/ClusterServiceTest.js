/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const RC = require('./RC');
const { Client } = require('../.');

describe('ClusterServiceTest', function () {

    this.timeout(25000);

    let cluster;
    let member1;
    let client;

    beforeEach(async function () {
        cluster = await RC.createCluster(null, null);
        member1 = await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            properties: {
                'hazelcast.client.heartbeat.interval': 1000,
                'hazelcast.client.heartbeat.timeout': 5000
            }
        });
    });

    afterEach(async function () {
        await client.shutdown();
        await RC.terminateCluster(cluster.id);
    });

    it('should know when a new member joins to cluster', function (done) {
        const membershipListener = {
            memberAdded: (event) => {
                expect(event.members.length).to.be.eq(2);
                expect(client.clusterService.getSize()).to.be.eq(2);
                done();
            }
        };

        client.clusterService.addMembershipListener(membershipListener);

        RC.startMember(cluster.id).catch(done);
    });

    it('should know when a member leaves cluster', function (done) {
        let member2;

        const membershipListener = {
            memberRemoved: () => {
                expect(client.getClusterService().getSize()).to.be.eq(1);
                done();
            }
        };

        client.clusterService.addMembershipListener(membershipListener);

        RC.startMember(cluster.id).then(function (res) {
            member2 = res;
            return RC.shutdownMember(cluster.id, member2.uuid);
        }).catch(done);
    });

    it('getMemberList returns correct list after a member is removed', function (done) {
        let member2, member3;

        const membershipListener = {
            memberRemoved: () => {
                const remainingMemberList = client.getClusterService().getMemberList();
                expect(remainingMemberList).to.have.length(2);
                const portList = remainingMemberList.map(function (member) {
                    return member.address.port;
                });
                expect(portList).to.have.members([member1.port, member3.port]);
                done();
            }
        };

        client.clusterService.addMembershipListener(membershipListener);

        RC.startMember(cluster.id).then(function (res) {
            member2 = res;
            return RC.startMember(cluster.id);
        }).then(function (res) {
            member3 = res;
            return RC.shutdownMember(cluster.id, member2.uuid);
        }).catch(done);
    });

    it('should throw when wrong host addresses given in config', async function () {
        await expect(Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                clusterMembers: [
                    '0.0.0.0:5709',
                    '0.0.0.1:5710'
                ]
            },
            connectionStrategy: {
                connectionRetry: {
                    clusterConnectTimeoutMillis: 2000
                }
            }
        })).to.be.rejected;
    });

    it('should throw with wrong cluster name', async function () {
        await expect(Client.newHazelcastClient({
            clusterName: 'wrong',
            connectionStrategy: {
                connectionRetry: {
                    clusterConnectTimeoutMillis: 2000
                }
            }
        })).to.be.rejected;
    });

    it('membership listener should not run once removed', function (done) {
        const membershipListener = {
            memberAdded: () => {
                done(new Error('Listener falsely fired'));
            }
        };
        const id = client.clusterService.addMembershipListener(membershipListener);
        client.clusterService.removeMembershipListener(id);

        setTimeout(done, 3000);
    });
});
