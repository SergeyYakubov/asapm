import {gql} from "apollo-boost";

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
    childCollectionName
    childCollection {
      id
      title      
      eventStart
      eventEnd
    }
    customValues
  }
}
`;

export const COLLECTION_ENTITY_DETAILED = gql`
   query ($filter:String) {
    collections (filter: $filter){
    id
    title
    beamtimeId
    facility
    beamline
    eventStart
    eventEnd
    childCollectionName
    childCollection {
      id
      title
      eventStart
      eventEnd
    }
    customValues
  }
}
`;


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

export const COLLECTIONS = gql`
   query ($filter:String,$orderBy:String) {
    collections (filter: $filter,orderBy: $orderBy){
    id
    title
    beamtimeId
    facility
    beamline
    eventStart
    eventEnd
    type
    customValues
  }
}
`;