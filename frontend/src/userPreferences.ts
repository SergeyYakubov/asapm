import {PaletteType} from "@material-ui/core";
import {gql, useQuery,useMutation} from "@apollo/client";
import userService from "./userService";

interface UserData {
    user: {
        id: string;
        preferences: {
            schema: PaletteType
        }
    }
}

interface UserVars {
    id  : string;
}

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
    mutation addUser($id: ID!,$schema: String)  {
    setUserPreferences(id:$id,input:{
        schema:$schema,
    }){
        id
        preferences{schema}
    }
}
`;

interface NewPreferences {
    id: string
    schema: string;
}

interface NewPreferencesResponse {
    setUserPreferences: {
        id: string;
        preferences: {
            schema: PaletteType
        }
    }
}

const useUserPreferences = () => {
    const id = userService.getUserId() || "";
    return useQuery<UserData,UserVars>(USER_PREFERENCES,{ variables: { id: id }});
}

const useUpdateUserTheme = (theme: PaletteType) => {
    return useMutation<{response: NewPreferencesResponse, variables:NewPreferences}>(SAVE_USER_PREFERENCES);
}

export default {
    useUserPreferences,
    useUpdateUserTheme
};
