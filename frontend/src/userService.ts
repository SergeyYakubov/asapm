import Keycloak, {KeycloakPromise} from "keycloak-js";

const _kc = Keycloak({
    url: process.env.REACT_APP_KEYCLOAK_ENDPOINT as string,
    realm: process.env.REACT_APP_KEYCLOAK_REALM as string,
    clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID as string,

});

const doLogin = _kc.login;

const doLogout = _kc.logout;

function initKeycloak(onAuthenticatedCallback: () => void): void {
    _kc.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: window.location.origin + process.env.PUBLIC_URL+ '/silent-check-sso.html'
    })
        .then((authenticated:boolean) => {
            if (authenticated) {
                onAuthenticatedCallback();
            } else {
                console.warn("not authenticated!");
                doLogin();
            }
        });
}

function getToken(): string | undefined {
    return _kc.token;
}

function updateToken(minValidity: number): KeycloakPromise<boolean, boolean> {
    return _kc.updateToken(minValidity);
}

function getUserId(): string | undefined {
    return _kc.tokenParsed?.sub;
}


function getUserName(): string {
    if (!_kc.tokenParsed) {
        return "";
    }

    let preferred_username="";
    let givenName = "";
    let familyName = "";

    for (const [key, value] of Object.entries(_kc!.tokenParsed)) {
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
