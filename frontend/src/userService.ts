import Keycloak from "keycloak-js";

const _kc = Keycloak({
    url: process.env.REACT_APP_KEYCLOAK_ENDPOINT as string,
    realm: process.env.REACT_APP_KEYCLOAK_REALM as string,
    clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID as string,
});


const initKeycloak = (onAuthenticatedCallback: Function) => {
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
        })
};

const doLogin = _kc.login;

const doLogout = _kc.logout;

const getToken = function() {
    return _kc.token;
};

const updateToken = function (minValidity: number) {
    return _kc.updateToken(minValidity)
}

const getUserId = () => _kc.tokenParsed?.sub;


async function getUserName() {
    const profile = await _kc.loadUserProfile();
    return profile.firstName+" "+profile.lastName;
}

export default {
    initKeycloak,
    doLogin,
    doLogout,
    getToken,
    getUserName,
    getUserId,
    updateToken,
}