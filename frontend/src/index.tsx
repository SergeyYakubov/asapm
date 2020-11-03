import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import UserService from "./userService";
import userService from "./userService";
import {BrowserRouter} from 'react-router-dom';
import {cache} from './graphQLCache';
import {ApolloClient, ApolloProvider, createHttpLink} from "@apollo/client";
import {setContext} from "@apollo/client/link/context";

const api_uri = (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : (window.location.origin + process.env.PUBLIC_URL))
    + process.env.REACT_APP_API_SUFFIX + "/query";

const httpLink = createHttpLink({
    uri: api_uri,
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

const renderApp = () => ReactDOM.render(
    <ApolloProvider client={client}>
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            <App/>
        </BrowserRouter>
    </ApolloProvider>,
    document.getElementById("root"));

UserService.initKeycloak(renderApp);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
