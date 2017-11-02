/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {AddressCodec} from './AddressCodec';
import {UUIDCodec} from './UUIDCodec';
import {MemberCodec} from './MemberCodec';
import {Data} from '../serialization/Data';
import {EntryViewCodec} from './EntryViewCodec';
import DistributedObjectInfoCodec = require('./DistributedObjectInfoCodec');
import {MapMessageType} from './MapMessageType';

var REQUEST_TYPE = MapMessageType.MAP_ASSIGNANDGETUUIDS;
var RESPONSE_TYPE = 123;
var RETRYABLE = true;


export class MapAssignAndGetUuidsCodec {


    static calculateSize() {
// Calculates the request payload size
        var dataSize: number = 0;
        return dataSize;
    }

    static encodeRequest() {
// Encode request into clientMessage
        var clientMessage = ClientMessage.newClientMessage(this.calculateSize());
        clientMessage.setMessageType(REQUEST_TYPE);
        clientMessage.setRetryable(RETRYABLE);
        clientMessage.updateFrameLength();
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage, toObjectFunction: (data: Data) => any = null) {
// Decode response from client message
        var parameters: any = {'partitionUuidList': null};

        var partitionUuidListSize = clientMessage.readInt32();
        var partitionUuidList: any = [];
        for (var partitionUuidListIndex = 0; partitionUuidListIndex < partitionUuidListSize; partitionUuidListIndex++) {
            var partitionUuidListItem: any;
            var partitionUuidListItemKey: number;
            var partitionUuidListItemVal: any;
            partitionUuidListItemKey = clientMessage.readInt32();
            partitionUuidListItemVal = UUIDCodec.decode(clientMessage, toObjectFunction);
            partitionUuidListItem = [partitionUuidListItemKey, partitionUuidListItemVal];
            partitionUuidList.push(partitionUuidListItem)
        }
        parameters['partitionUuidList'] = partitionUuidList;
        return parameters;

    }


}