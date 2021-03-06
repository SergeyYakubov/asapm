import { gql } from '@apollo/client';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Upload: any;
  DateTime: string;
  Map: Object;
};

export type BeamtimeUser = {
  __typename?: 'BeamtimeUser';
  applicant: Maybe<Scalars['String']>;
  email: Maybe<Scalars['String']>;
  institute: Maybe<Scalars['String']>;
  lastname: Maybe<Scalars['String']>;
  userId: Maybe<Scalars['String']>;
  username: Maybe<Scalars['String']>;
};


export type Attachment = {
  __typename?: 'Attachment';
  id: Scalars['String'];
  entryId: Scalars['String'];
  name: Scalars['String'];
  size: Scalars['Int'];
  contentType: Scalars['String'];
};

export type UploadFile = {
  entryId: Scalars['String'];
  file: Scalars['Upload'];
};

export type InputCollectionFile = {
  name: Scalars['String'];
  size: Scalars['Int'];
};

export type CollectionFile = {
  __typename?: 'CollectionFile';
  name: Scalars['String'];
  size: Scalars['Int'];
};

export type CollectionFolderContent = {
  __typename?: 'CollectionFolderContent';
  name: Scalars['String'];
  files: Maybe<Array<CollectionFile>>;
  subfolders: Maybe<Array<Scalars['String']>>;
};

export type CollectionFilePlain = {
  __typename?: 'CollectionFilePlain';
  fullName: Scalars['String'];
  size: Scalars['Int'];
};

export type InputBeamtimeUser = {
  applicant: Maybe<Scalars['String']>;
  email: Maybe<Scalars['String']>;
  institute: Maybe<Scalars['String']>;
  lastname: Maybe<Scalars['String']>;
  userId: Maybe<Scalars['String']>;
  username: Maybe<Scalars['String']>;
};

export type AsapoMeta = {
  __typename?: 'AsapoMeta';
  beamtimeClbtTokenPath: Maybe<Scalars['String']>;
  beamtimeTokenPath: Maybe<Scalars['String']>;
  endpoint: Maybe<Scalars['String']>;
};

export type InputAsapoMeta = {
  beamtimeClbtTokenPath: Maybe<Scalars['String']>;
  beamtimeTokenPath: Maybe<Scalars['String']>;
  endpoint: Maybe<Scalars['String']>;
};

export type OnlineAnylysisMeta = {
  __typename?: 'OnlineAnylysisMeta';
  reservedNodes: Maybe<Array<Scalars['String']>>;
  slurmReservation: Maybe<Scalars['String']>;
  slurmPartition: Maybe<Scalars['String']>;
  sshPrivateKeyPath: Maybe<Scalars['String']>;
  sshPublicKeyPath: Maybe<Scalars['String']>;
  userAccount: Maybe<Scalars['String']>;
};

export type InputOnlineAnylysisMeta = {
  asapoBeamtimeTokenPath: Maybe<Scalars['String']>;
  reservedNodes: Maybe<Array<Scalars['String']>>;
  slurmReservation: Maybe<Scalars['String']>;
  slurmPartition: Maybe<Scalars['String']>;
  sshPrivateKeyPath: Maybe<Scalars['String']>;
  sshPublicKeyPath: Maybe<Scalars['String']>;
  userAccount: Maybe<Scalars['String']>;
};


export type Users = {
  __typename?: 'Users';
  doorDb: Maybe<Array<Scalars['String']>>;
  special: Maybe<Array<Scalars['String']>>;
  unknown: Maybe<Array<Scalars['String']>>;
};

export type InputUsers = {
  doorDb: Maybe<Array<Scalars['String']>>;
  special: Maybe<Array<Scalars['String']>>;
  unknown: Maybe<Array<Scalars['String']>>;
};

export type CollectionEntryInterface = {
  id: Scalars['String'];
  eventStart: Maybe<Scalars['DateTime']>;
  eventEnd: Maybe<Scalars['DateTime']>;
  title: Maybe<Scalars['String']>;
  childCollectionName: Maybe<Scalars['String']>;
  childCollection: Maybe<Array<BaseCollectionEntry>>;
  customValues: Maybe<Scalars['Map']>;
  type: Scalars['String'];
  parentBeamtimeMeta: ParentBeamtimeMeta;
  jsonString: Maybe<Scalars['String']>;
  attachments: Maybe<Array<Attachment>>;
  thumbnail: Maybe<Scalars['String']>;
};


export type CollectionEntryInterfaceCustomValuesArgs = {
  selectFields: Maybe<Array<Scalars['String']>>;
  removeFields: Maybe<Array<Scalars['String']>>;
};

export type CollectionEntry = CollectionEntryInterface & {
  __typename?: 'CollectionEntry';
  id: Scalars['String'];
  eventStart: Maybe<Scalars['DateTime']>;
  eventEnd: Maybe<Scalars['DateTime']>;
  title: Maybe<Scalars['String']>;
  childCollectionName: Maybe<Scalars['String']>;
  childCollection: Maybe<Array<BaseCollectionEntry>>;
  customValues: Maybe<Scalars['Map']>;
  type: Scalars['String'];
  parentBeamtimeMeta: ParentBeamtimeMeta;
  jsonString: Maybe<Scalars['String']>;
  nextEntry: Maybe<Scalars['String']>;
  prevEntry: Maybe<Scalars['String']>;
  parentId: Scalars['String'];
  index: Maybe<Scalars['Int']>;
  attachments: Maybe<Array<Attachment>>;
  thumbnail: Maybe<Scalars['String']>;
};


export type CollectionEntryCustomValuesArgs = {
  selectFields: Maybe<Array<Scalars['String']>>;
  removeFields: Maybe<Array<Scalars['String']>>;
};

export type ParentBeamtimeMeta = {
  __typename?: 'ParentBeamtimeMeta';
  id: Scalars['String'];
  applicant: Maybe<BeamtimeUser>;
  asapo: Maybe<AsapoMeta>;
  beamline: Maybe<Scalars['String']>;
  beamlineAlias: Maybe<Scalars['String']>;
  status: Scalars['String'];
  contact: Maybe<Scalars['String']>;
  corePath: Maybe<Scalars['String']>;
  eventEnd: Maybe<Scalars['DateTime']>;
  eventStart: Maybe<Scalars['DateTime']>;
  facility: Maybe<Scalars['String']>;
  generated: Maybe<Scalars['DateTime']>;
  leader: Maybe<BeamtimeUser>;
  onlineAnalysis: Maybe<OnlineAnylysisMeta>;
  pi: Maybe<BeamtimeUser>;
  proposalId: Maybe<Scalars['String']>;
  proposalType: Maybe<Scalars['String']>;
  title: Maybe<Scalars['String']>;
  unixId: Maybe<Scalars['String']>;
  users: Maybe<Users>;
};

export type BeamtimeMeta = CollectionEntryInterface & {
  __typename?: 'BeamtimeMeta';
  id: Scalars['String'];
  applicant: Maybe<BeamtimeUser>;
  asapo: Maybe<AsapoMeta>;
  beamline: Maybe<Scalars['String']>;
  beamlineAlias: Maybe<Scalars['String']>;
  beamlineSetup: Maybe<Scalars['String']>;
  status: Scalars['String'];
  contact: Maybe<Scalars['String']>;
  corePath: Maybe<Scalars['String']>;
  eventEnd: Maybe<Scalars['DateTime']>;
  eventStart: Maybe<Scalars['DateTime']>;
  facility: Maybe<Scalars['String']>;
  generated: Maybe<Scalars['DateTime']>;
  leader: Maybe<BeamtimeUser>;
  onlineAnalysis: Maybe<OnlineAnylysisMeta>;
  pi: Maybe<BeamtimeUser>;
  proposalId: Maybe<Scalars['String']>;
  proposalType: Maybe<Scalars['String']>;
  title: Maybe<Scalars['String']>;
  unixId: Maybe<Scalars['String']>;
  users: Maybe<Users>;
  childCollectionName: Maybe<Scalars['String']>;
  childCollection: Maybe<Array<BaseCollectionEntry>>;
  customValues: Maybe<Scalars['Map']>;
  type: Scalars['String'];
  parentBeamtimeMeta: ParentBeamtimeMeta;
  jsonString: Maybe<Scalars['String']>;
  attachments: Maybe<Array<Attachment>>;
  thumbnail: Maybe<Scalars['String']>;
  filesetSize: Maybe<Scalars['Int']>;
};


export type BeamtimeMetaCustomValuesArgs = {
  selectFields: Maybe<Array<Scalars['String']>>;
  removeFields: Maybe<Array<Scalars['String']>>;
};

export type BaseCollectionEntry = {
  __typename?: 'BaseCollectionEntry';
  id: Scalars['String'];
  eventStart: Maybe<Scalars['DateTime']>;
  eventEnd: Maybe<Scalars['DateTime']>;
  title: Maybe<Scalars['String']>;
  index: Maybe<Scalars['Int']>;
};

export type NewCollectionEntry = {
  id: Scalars['String'];
  eventStart: Maybe<Scalars['DateTime']>;
  eventEnd: Maybe<Scalars['DateTime']>;
  title: Maybe<Scalars['String']>;
  childCollectionName: Maybe<Scalars['String']>;
  index: Maybe<Scalars['Int']>;
  customValues: Maybe<Scalars['Map']>;
};

export type NewBeamtimeMeta = {
  applicant: Maybe<InputBeamtimeUser>;
  asapo: Maybe<InputAsapoMeta>;
  beamline: Maybe<Scalars['String']>;
  beamlineAlias: Maybe<Scalars['String']>;
  beamlineSetup: Maybe<Scalars['String']>;
  id: Scalars['String'];
  status: Maybe<Scalars['String']>;
  contact: Maybe<Scalars['String']>;
  corePath: Maybe<Scalars['String']>;
  eventEnd: Maybe<Scalars['DateTime']>;
  eventStart: Maybe<Scalars['DateTime']>;
  facility: Maybe<Scalars['String']>;
  generated: Maybe<Scalars['DateTime']>;
  leader: Maybe<InputBeamtimeUser>;
  onlineAnalysis: Maybe<InputOnlineAnylysisMeta>;
  pi: Maybe<InputBeamtimeUser>;
  proposalId: Maybe<Scalars['String']>;
  proposalType: Maybe<Scalars['String']>;
  title: Maybe<Scalars['String']>;
  unixId: Maybe<Scalars['String']>;
  users: Maybe<InputUsers>;
  childCollectionName: Maybe<Scalars['String']>;
  customValues: Maybe<Scalars['Map']>;
};

export type FieldsToDelete = {
  id: Scalars['String'];
  fields: Array<Scalars['String']>;
};

export type FieldsToSet = {
  id: Scalars['String'];
  fields: Scalars['Map'];
};

export type UniqueField = {
  __typename?: 'UniqueField';
  keyName: Scalars['String'];
  values: Array<Scalars['String']>;
};

export enum LogEntryType {
  Message = 'Message'
}

export type GenericLogEntry = {
  id: Scalars['ID'];
  time: Scalars['DateTime'];
  createdBy: Scalars['String'];
  entryType: LogEntryType;
  facility: Scalars['String'];
  beamtime: Maybe<Scalars['String']>;
  tags: Maybe<Array<Scalars['String']>>;
  source: Maybe<Scalars['String']>;
};

export type LogEntryMessage = GenericLogEntry & {
  __typename?: 'LogEntryMessage';
  id: Scalars['ID'];
  time: Scalars['DateTime'];
  createdBy: Scalars['String'];
  entryType: LogEntryType;
  facility: Scalars['String'];
  beamtime: Maybe<Scalars['String']>;
  tags: Maybe<Array<Scalars['String']>>;
  source: Maybe<Scalars['String']>;
  message: Scalars['String'];
  attachments: Maybe<Scalars['Map']>;
};

export type NewLogEntryMessage = {
  time: Maybe<Scalars['DateTime']>;
  facility: Scalars['String'];
  beamtime: Maybe<Scalars['String']>;
  tags: Maybe<Array<Scalars['String']>>;
  source: Maybe<Scalars['String']>;
  message: Scalars['String'];
  attachments: Maybe<Scalars['Map']>;
};

export type LogEntry = LogEntryMessage;

export type LogEntryQueryResult = {
  __typename?: 'LogEntryQueryResult';
  entries: Array<LogEntry>;
  start: Scalars['Int'];
  hasMore: Scalars['Boolean'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createMeta: Maybe<BeamtimeMeta>;
  deleteMeta: Maybe<Scalars['String']>;
  deleteSubcollection: Maybe<Scalars['String']>;
  addCollectionEntry: Maybe<CollectionEntry>;
  modifyBeamtimeMeta: Maybe<BeamtimeMeta>;
  updateCollectionEntryFields: Maybe<CollectionEntry>;
  addCollectionEntryFields: Maybe<CollectionEntry>;
  deleteCollectionEntryFields: Maybe<CollectionEntry>;
  setUserPreferences: Maybe<UserAccount>;
  uploadAttachment: Attachment;
  addCollectionFiles: Array<CollectionFilePlain>;
  addMessageLogEntry: Maybe<Scalars['ID']>;
  removeLogEntry: Maybe<Scalars['ID']>;
};


export type MutationCreateMetaArgs = {
  input: NewBeamtimeMeta;
};


export type MutationDeleteMetaArgs = {
  id: Scalars['String'];
};


export type MutationDeleteSubcollectionArgs = {
  id: Scalars['String'];
};


export type MutationAddCollectionEntryArgs = {
  input: NewCollectionEntry;
};


export type MutationModifyBeamtimeMetaArgs = {
  input: FieldsToSet;
};


export type MutationUpdateCollectionEntryFieldsArgs = {
  input: FieldsToSet;
};


export type MutationAddCollectionEntryFieldsArgs = {
  input: FieldsToSet;
};


export type MutationDeleteCollectionEntryFieldsArgs = {
  input: FieldsToDelete;
};


export type MutationSetUserPreferencesArgs = {
  id: Scalars['ID'];
  input: InputUserPreferences;
};


export type MutationUploadAttachmentArgs = {
  req: UploadFile;
};


export type MutationAddCollectionFilesArgs = {
  id: Scalars['String'];
  files: Array<InputCollectionFile>;
};


export type MutationAddMessageLogEntryArgs = {
  input: NewLogEntryMessage;
};


export type MutationRemoveLogEntryArgs = {
  id: Scalars['ID'];
};

export type Query = {
  __typename?: 'Query';
  meta: Array<BeamtimeMeta>;
  collections: Array<CollectionEntry>;
  uniqueFields: Array<UniqueField>;
  user: Maybe<UserAccount>;
  collectionFiles: Array<CollectionFilePlain>;
  collectionFolderContent: CollectionFolderContent;
  logEntry: Maybe<LogEntry>;
  logEntries: Maybe<LogEntryQueryResult>;
  logEntriesUniqueFields: Array<UniqueField>;
};


export type QueryMetaArgs = {
  filter: Maybe<Scalars['String']>;
  orderBy: Maybe<Scalars['String']>;
};


export type QueryCollectionsArgs = {
  filter: Maybe<Scalars['String']>;
  orderBy: Maybe<Scalars['String']>;
};


export type QueryUniqueFieldsArgs = {
  filter: Maybe<Scalars['String']>;
  keys: Array<Scalars['String']>;
};


export type QueryUserArgs = {
  id: Scalars['ID'];
};


export type QueryCollectionFilesArgs = {
  id: Scalars['String'];
  subcollections: Maybe<Scalars['Boolean']>;
};


export type QueryCollectionFolderContentArgs = {
  id: Scalars['String'];
  rootFolder: Maybe<Scalars['String']>;
  subcollections: Maybe<Scalars['Boolean']>;
};


export type QueryLogEntryArgs = {
  id: Scalars['ID'];
};


export type QueryLogEntriesArgs = {
  filter: Scalars['String'];
  start: Maybe<Scalars['Int']>;
  limit: Maybe<Scalars['Int']>;
};


export type QueryLogEntriesUniqueFieldsArgs = {
  filter: Maybe<Scalars['String']>;
  keys: Array<Scalars['String']>;
};


export type UserPreferences = {
  __typename?: 'UserPreferences';
  schema: Scalars['String'];
};

export type InputUserPreferences = {
  schema: Scalars['String'];
};

export type UserAccount = {
  __typename?: 'UserAccount';
  id: Scalars['ID'];
  preferences: UserPreferences;
};
