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
  Time: string;
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

export type InputBeamtimeUser = {
  applicant: Maybe<Scalars['String']>;
  email: Maybe<Scalars['String']>;
  institute: Maybe<Scalars['String']>;
  lastname: Maybe<Scalars['String']>;
  userId: Maybe<Scalars['String']>;
  username: Maybe<Scalars['String']>;
};

export type OnlineAnylysisMeta = {
  __typename?: 'OnlineAnylysisMeta';
  asapoBeamtimeTokenPath: Maybe<Scalars['String']>;
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
  eventStart: Maybe<Scalars['Time']>;
  eventEnd: Maybe<Scalars['Time']>;
  title: Maybe<Scalars['String']>;
  childCollectionName: Maybe<Scalars['String']>;
  childCollection: Maybe<Array<BaseCollectionEntry>>;
  customValues: Maybe<Scalars['Map']>;
  type: Scalars['String'];
  parentBeamtimeMeta: ParentBeamtimeMeta;
  jsonString: Maybe<Scalars['String']>;
};


export type CollectionEntryInterfaceCustomValuesArgs = {
  selectFields: Maybe<Array<Scalars['String']>>;
  removeFields: Maybe<Array<Scalars['String']>>;
};

export type CollectionEntry = CollectionEntryInterface & {
  __typename?: 'CollectionEntry';
  id: Scalars['String'];
  eventStart: Maybe<Scalars['Time']>;
  eventEnd: Maybe<Scalars['Time']>;
  title: Maybe<Scalars['String']>;
  childCollectionName: Maybe<Scalars['String']>;
  childCollection: Maybe<Array<BaseCollectionEntry>>;
  customValues: Maybe<Scalars['Map']>;
  type: Scalars['String'];
  parentBeamtimeMeta: ParentBeamtimeMeta;
  jsonString: Maybe<Scalars['String']>;
};


export type CollectionEntryCustomValuesArgs = {
  selectFields: Maybe<Array<Scalars['String']>>;
  removeFields: Maybe<Array<Scalars['String']>>;
};

export type ParentBeamtimeMeta = {
  __typename?: 'ParentBeamtimeMeta';
  id: Scalars['String'];
  applicant: Maybe<BeamtimeUser>;
  beamline: Maybe<Scalars['String']>;
  beamlineAlias: Maybe<Scalars['String']>;
  status: Scalars['String'];
  contact: Maybe<Scalars['String']>;
  corePath: Maybe<Scalars['String']>;
  eventEnd: Maybe<Scalars['Time']>;
  eventStart: Maybe<Scalars['Time']>;
  facility: Maybe<Scalars['String']>;
  generated: Maybe<Scalars['Time']>;
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
  beamline: Maybe<Scalars['String']>;
  beamlineAlias: Maybe<Scalars['String']>;
  status: Scalars['String'];
  contact: Maybe<Scalars['String']>;
  corePath: Maybe<Scalars['String']>;
  eventEnd: Maybe<Scalars['Time']>;
  eventStart: Maybe<Scalars['Time']>;
  facility: Maybe<Scalars['String']>;
  generated: Maybe<Scalars['Time']>;
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
};


export type BeamtimeMetaCustomValuesArgs = {
  selectFields: Maybe<Array<Scalars['String']>>;
  removeFields: Maybe<Array<Scalars['String']>>;
};

export type BaseCollectionEntry = {
  __typename?: 'BaseCollectionEntry';
  id: Scalars['String'];
  eventStart: Maybe<Scalars['Time']>;
  eventEnd: Maybe<Scalars['Time']>;
  title: Maybe<Scalars['String']>;
};

export type NewCollectionEntry = {
  id: Scalars['String'];
  eventStart: Maybe<Scalars['Time']>;
  eventEnd: Maybe<Scalars['Time']>;
  title: Maybe<Scalars['String']>;
  childCollectionName: Maybe<Scalars['String']>;
  customValues: Maybe<Scalars['Map']>;
};

export type NewBeamtimeMeta = {
  applicant: Maybe<InputBeamtimeUser>;
  beamline: Maybe<Scalars['String']>;
  beamlineAlias: Maybe<Scalars['String']>;
  id: Scalars['String'];
  status: Scalars['String'];
  contact: Maybe<Scalars['String']>;
  corePath: Maybe<Scalars['String']>;
  eventEnd: Maybe<Scalars['Time']>;
  eventStart: Maybe<Scalars['Time']>;
  facility: Maybe<Scalars['String']>;
  generated: Maybe<Scalars['Time']>;
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

export type UniqueField = {
  __typename?: 'UniqueField';
  keyName: Scalars['String'];
  values: Array<Scalars['String']>;
};

export enum Acls {
  Write = 'WRITE',
  Read = 'READ'
}

export type Mutation = {
  __typename?: 'Mutation';
  createMeta: Maybe<BeamtimeMeta>;
  deleteMeta: Maybe<Scalars['String']>;
  addCollectionEntry: Maybe<CollectionEntry>;
  setUserPreferences: Maybe<UserAccount>;
};


export type MutationCreateMetaArgs = {
  input: NewBeamtimeMeta;
};


export type MutationDeleteMetaArgs = {
  id: Scalars['String'];
};


export type MutationAddCollectionEntryArgs = {
  input: NewCollectionEntry;
};


export type MutationSetUserPreferencesArgs = {
  id: Scalars['ID'];
  input: InputUserPreferences;
};

export type Query = {
  __typename?: 'Query';
  meta: Array<BeamtimeMeta>;
  collections: Array<CollectionEntry>;
  uniqueFields: Array<UniqueField>;
  user: Maybe<UserAccount>;
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