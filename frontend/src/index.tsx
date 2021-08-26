import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import UserService, {keycloak} from "./userService";
import userService from "./userService";
import {BrowserRouter} from 'react-router-dom';
import {cache} from './graphQLCache';
import {ApolloClient, ApolloProvider, createHttpLink} from "@apollo/client";
import {setContext} from "@apollo/client/link/context";
import {ApplicationApiBaseUrl} from "./common";
import { createUploadLink } from 'apollo-upload-client';

const httpLink = createUploadLink({
    uri: `${ApplicationApiBaseUrl}/query`,
});

const authLink = setContext((_, {headers}) => {
    return userService.updateToken(10).then(() => {
        const token = userService.getToken();
        return {
            headers: {
                ...headers,
                authorization: token ? `Bearer ${token}` : "",
            }
        };
    });
});

export const client = new ApolloClient({
    cache: cache,
    link: authLink.concat(httpLink)
});

function Rr(): JSX.Element {
    const [, setKInitialized] = React.useState(false);
    const [kTimedOut, setTimedOut] = React.useState(false);

    React.useEffect(() => {
        setTimeout(() => {
            if (!keycloak.authenticated) setTimedOut(true);
        }, 60000);
    }, []);

    React.useEffect(() => {
        UserService.initKeycloak(setKInitialized);
    }, []);

    return keycloak.authenticated ? <ApolloProvider client={client}>
            <BrowserRouter basename={process.env.PUBLIC_URL}>
                <App/>
            </BrowserRouter>
        </ApolloProvider>
        :
        <div>{kTimedOut ? "cannot connect to the authorization server, please try later" : "authorizing ..."}</div>;
}

ReactDOM.render(
    <Rr/>,
    document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
