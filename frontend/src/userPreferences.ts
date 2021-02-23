import {gql, useQuery, useMutation, QueryResult, MutationTuple} from "@apollo/client";
import userService from "./userService";
import {Mutation, MutationSetUserPreferencesArgs, Query, QueryUserArgs} from "./generated/graphql";

const USER_PREFERENCES = gql`
  query getUserPreferences($id: ID!) {
  user(id: $id) {
    id
    preferences {
      schema
    }
  }
}
`;

const SAVE_USER_PREFERENCES = gql`
mutation addUser($id: ID!,$schema: String!) {
    setUserPreferences(id:$id,input:{
        schema:$schema,
    }){
        id
        preferences{schema}
    }
}
`;

function useUserPreferences(): QueryResult<Query, QueryUserArgs> {
    const id = userService.getUserId() || '';
    return useQuery<Query, QueryUserArgs>(USER_PREFERENCES, {
        variables: { id },
    });
}

type UserPreferencesMutationData = { response: Mutation; variables: MutationSetUserPreferencesArgs };
type UserPreferencesMutationType = MutationTuple<UserPreferencesMutationData, any>;
function useUpdateUserTheme(): UserPreferencesMutationType {
    return useMutation<UserPreferencesMutationData>(SAVE_USER_PREFERENCES);
}


export default {
    useUserPreferences,
    useUpdateUserTheme,
};
