import Keycloak, { KeycloakPromise } from 'keycloak-js';

const internalKc = Keycloak({
    url: process.env.REACT_APP_KEYCLOAK_ENDPOINT as string,
    realm: process.env.REACT_APP_KEYCLOAK_REALM as string,
    clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID as string,
});

const doLogin = internalKc.login;

const doLogout = internalKc.logout;

const initKeycloak = (onAuthenticatedCallback: () => void): void => {
    internalKc
        .init({
            onLoad: 'check-sso',
            pkceMethod: 'S256',
            silentCheckSsoRedirectUri: `${window.location.origin + process.env.PUBLIC_URL}/silent-check-sso.html`,
        })
        .then((authenticated: boolean) => {
            if (authenticated) {
                onAuthenticatedCallback();
            } else {
                console.warn('not authenticated!');
                doLogin();
            }
        });
};

function getToken(): string | undefined {
    return internalKc.token;
}

function updateToken(minValidity: number): KeycloakPromise<boolean, boolean> {
    return internalKc.updateToken(minValidity);
}

function getUserId(): string | undefined {
    return internalKc.tokenParsed?.sub;
}

function getUserName(): string {
    if (!internalKc.tokenParsed) {
        return '';
    }

    let preferred_username = '';
    let givenName = '';
    let familyName = '';

    for (const [key, value] of Object.entries(internalKc!.tokenParsed)) {
        if (key === 'name') {
            return value.toString();
        }
        if (key === 'preferred_username') {
            preferred_username = value.toString();
        }
        if (key === 'given_name') {
            givenName = value.toString();
        }
        if (key === 'family_name') {
            familyName = value.toString();
        }
    }

    if (givenName && familyName) {
        return `${givenName} ${familyName}`;
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
