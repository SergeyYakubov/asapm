import {PaletteType} from "@material-ui/core";
import {gql, useQuery,useMutation} from "@apollo/client";
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
    mutation addUser($id: ID!,$schema: String!)  {
    setUserPreferences(id:$id,input:{
        schema:$schema,
    }){
        id
        preferences{schema}
    }
}
`;

const useUserPreferences = () => {
    const id = userService.getUserId() || "";
    return useQuery<Query,QueryUserArgs>(USER_PREFERENCES,{ variables: { id: id }});
}

const useUpdateUserTheme = (theme: PaletteType) => {
    return useMutation<{response: Mutation, variables:MutationSetUserPreferencesArgs}>(SAVE_USER_PREFERENCES);
}

export default {
    useUserPreferences,
    useUpdateUserTheme
};
