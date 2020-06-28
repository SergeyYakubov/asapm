import Keycloak, {KeycloakError, KeycloakPromise} from "keycloak-js";

const _kc  =  Keycloak( window.location.pathname+'/keycloak.json');

const initKeycloak = (onAuthenticatedCallback: Function) => {
    _kc.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: window.location.origin + window.location.pathname+ '/silent-check-sso.html'
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

const getToken = () => _kc.token;

export default {
    initKeycloak,
    doLogin,
    doLogout,
    getToken,
}