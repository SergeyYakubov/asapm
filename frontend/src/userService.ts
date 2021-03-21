import Keycloak, {KeycloakPromise} from "keycloak-js";

export const keycloak = Keycloak({
    url: process.env.REACT_APP_KEYCLOAK_ENDPOINT as string,
    realm: process.env.REACT_APP_KEYCLOAK_REALM as string,
    clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID as string,
});

const doLogin = keycloak.login;

const doLogout = keycloak.logout;

function initKeycloak(onAuthenticatedCallback: (initialized:boolean) => void): void {
    keycloak.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: window.location.origin + process.env.PUBLIC_URL+ '/silent-check-sso.html'
    }).then((authenticated:boolean) => {
            if (authenticated) {
                onAuthenticatedCallback(true);
            } else {
                console.warn("not authenticated!");
                doLogin();
            }
        }).catch(function() {
        alert('failed to initialize');
    });
}

function getToken(): string | undefined {
    return keycloak.token;
}

function updateToken(minValidity: number): KeycloakPromise<boolean, boolean> {
    return keycloak.updateToken(minValidity);
}

function getUserId(): string | undefined {
    return keycloak.tokenParsed?.sub;
}


function getUserName(): string {
    if (!keycloak.tokenParsed) {
        return "";
    }

    let preferred_username="";
    let givenName = "";
    let familyName = "";

    for (const [key, value] of Object.entries(keycloak!.tokenParsed)) {
        if (key === "name") {
            return value.toString();
        }
        if (key === "preferred_username") {
            preferred_username = value.toString();
        }
        if (key === "given_name") {
            givenName = value.toString();
        }
        if (key === "family_name") {
            familyName = value.toString();
        }
    }

    if (givenName && familyName) {
        return givenName+" "+familyName;
    }

    return preferred_username;
}

export default {
    initKeycloak,
    doLogin,
    doLogout,
    getToken,
    getUserName,
    getUserId,
    updateToken,
};
