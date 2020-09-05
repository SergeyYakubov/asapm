import {IsoDateToStr, TableData} from "./common";

export interface MetaDataDetails {
    meta: MetaDetails[];
}

export interface CollectionEntitiesDetails {
    collections: CollectionDetails[];
}

export enum Status {
    Completed = "Completed",
    Running = "Running",
    Scheduled = "Scheduled"
}
interface Meta {
    id: String;
    beamline: String;
    status: Status
    title: String;
}

export interface MetaData {
    meta: Meta[];
}

interface BeamtimeUser {
    email: String
    institute: String
    lastname: String
    userId: String
    username: String
}

interface OnlineAnylysisMeta {
    asapoBeamtimeTokenPath: String
    reservedNodes: [String]
    slurmReservation: String
    slurmPartition: String
    sshPrivateKeyPath: String
    sshPublicKeyPath: String
    userAccount: String
}

interface Users {
    doorDb: [String]
    special: [String]
    unknown: [String]
}


interface BaseCollection {
    id: String
    eventStart: String
    eventEnd: String
    title: String
}

export interface CollectionDetails {
    id: String
    eventStart: String
    eventEnd: String
    title: String
    type: String
    childCollectionName: String
    childCollection: [BaseCollection]
    customValues: Object
    parentBeamtimeMeta: ParentMetaDetails
}

export interface ParentMetaDetails  {
    applicant: BeamtimeUser
    beamline: String
    beamlineAlias: String
    id: String
    status: Status
    contact: String
    corePath: String
    eventEnd: String
    eventStart: String
    facility: String
    generated: String
    leader: BeamtimeUser
    onlineAnalysis: OnlineAnylysisMeta
    pi: BeamtimeUser
    proposalId: String
    proposalType: String
    title: String
    unixId: String
    users: Users
}

export interface MetaDetails  {
    applicant: BeamtimeUser
    beamline: String
    beamlineAlias: String
    id: String
    status: Status
    contact: String
    corePath: String
    eventEnd: String
    eventStart: String
    facility: String
    generated: String
    leader: BeamtimeUser
    onlineAnalysis: OnlineAnylysisMeta
    pi: BeamtimeUser
    proposalId: String
    proposalType: String
    title: String
    unixId: String
    users: Users
    customValues: Object
    childCollectionName: String
    childCollection: [BaseCollection]
}


export function TableDataFromMeta(meta: MetaDetails, section: string): TableData {
    switch (section) {
        case "Beamtime":
            return [
                {name: 'Beamtime ID', value: meta.id},
                {name: 'Facility', value: meta.facility || "undefined"},
                {name: 'Beamline', value: meta.beamline || "undefined"},
                {name: 'Generated', value: IsoDateToStr(meta.generated)},
                {name: 'Start', value: IsoDateToStr(meta.eventStart)},
                {name: 'End', value: IsoDateToStr(meta.eventEnd)},
            ]
        case "Proposal":
            return [
                {name: 'Proposal ID', value: meta.proposalId || "undefined"},
                {name: 'Type', value: meta.proposalType || "undefined"},
                {name: 'Principal Investigator', value: meta.pi?.lastname || "undefined", data: meta.pi},
                {name: 'Leader', value: meta.leader?.lastname || "undefined", data: meta.leader},
                {name: 'Applicant', value: meta.applicant?.lastname || "undefined", data: meta.applicant},
            ]
        case "Analysis":
            return [
                {name: 'Core path', value: meta.corePath || "undefined"},
                {name: 'Online', value: meta.onlineAnalysis ? "Requested" : "Not requested", data: meta.onlineAnalysis},
            ]
    }
    return [];
}

export function TableDataFromCollection(meta: CollectionDetails, section: string): TableData {
            return [
                {name: 'ID', value: meta.id},
                {name: 'Beamtime ID', value: meta.parentBeamtimeMeta.id},
                {name: 'Facility', value: meta.parentBeamtimeMeta.facility || "undefined"},
                {name: 'Beamline', value: meta.parentBeamtimeMeta.beamline || "undefined"},
                {name: 'Start', value: meta.eventStart?meta.eventStart.toString():""},
                {name: 'End', value: IsoDateToStr(meta.eventEnd)},
            ]
}