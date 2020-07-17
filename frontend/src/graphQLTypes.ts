import {gql} from "apollo-boost";

export enum Status {
    Completed = "Completed",
    Running = "Running",
    Scheduled = "Scheduled"
}


interface Meta {
    beamtimeId: String;
    beamline: String;
    status: Status
    title: String;
}

export interface MetaData {
    meta: Meta[];
}


export const METAS = gql`
 {
  meta {
    beamtimeId
    beamline
    title
    status
  }
}
`;

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


export interface MetaDataDetails {
    meta: MetaDetails[];
}

export interface MetaDetails {
    applicant: BeamtimeUser
    beamline: String
    beamlineAlias: String
    beamtimeId: String
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
}

export const METAS_DETAILED = gql`
   query ($filter:String) {
    meta (filter: $filter){
    applicant {
     email
     institute
     lastname
     userId
     username
    }
    beamline
    beamlineAlias
    beamtimeId
    status
    contact
    corePath
    eventEnd
    eventStart
    facility
    generated
    leader {
     email
     institute
     lastname
     userId
     username
    }    
    onlineAnalysis {
     asapoBeamtimeTokenPath
     reservedNodes
     slurmReservation
     slurmPartition
     sshPrivateKeyPath
     sshPublicKeyPath
     userAccount
    }
    pi {
     email
     institute
     lastname
     userId
     username
    }
    proposalId
    proposalType
    title
    unixId
    users {
     doorDb
     special
     special
    }
    customValues
  }
}
`;