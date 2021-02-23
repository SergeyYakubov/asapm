import {gql} from "@apollo/client";

export const DELETE_ENTRY_FIELDS = gql`
    mutation ($id: String!,$fields: [String!]!)  {
    deleteCollectionEntryFields(input:{
        id:$id    
        fields:$fields,
    }){
        id
    }
}
`;

export const ADD_ENTRY_FIELDS = gql`
    mutation ($id: String!,$fields: Map!)  {
    addCollectionEntryFields(input:{
        id:$id    
        fields:$fields,
    }){
        id
    }
}
`;


export const UPDATE_ENTRY_FIELDS = gql`
    mutation ($id: String!,$fields: Map!)  {
    updateCollectionEntryFields(input:{
        id:$id    
        fields:$fields,
    }){
        id
    }
}
`;

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
    id
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
    parentBeamtimeMeta {
        id
        facility
        beamline
    }
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
    id
    beamline
    title
    status
  }
}
`;

export const COLLECTIONS = gql`
   query ($filter:String,$orderBy:String) {
   uniqueFields (filter: $filter, keys:["parentBeamtimeMeta.beamline","parentBeamtimeMeta.facility","parentBeamtimeMeta.users.doorDb"]){
        keyName
        values
    }
    collections (filter: $filter,orderBy: $orderBy){
    id
    title
    parentBeamtimeMeta {
        applicant {
         email
         institute
         lastname
         userId
         username
        }
        beamline
        beamlineAlias
        id
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
    }
    eventStart
    eventEnd
    type
    customValues
  }
}
`;