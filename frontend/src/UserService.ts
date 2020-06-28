import Keycloak, {KeycloakError, KeycloakPromise} from "keycloak-js";

// @ts-ignore
const _kc  = new Keycloak(process.env.PUBLIC_URL +'/keycloak.json');


const initKeycloak = (onAuthenticatedCallback: Function) => {
    _kc.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: window.location.origin +process.env.PUBLIC_URL+ '/silent-check-sso.html'
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