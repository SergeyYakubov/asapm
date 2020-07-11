import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import ApolloClient from 'apollo-boost';
import UserService from "./userService";
import { ApolloProvider } from '@apollo/react-hooks';
import { BrowserRouter } from 'react-router-dom';


const client = new ApolloClient({
    uri: window.location.origin+process.env.PUBLIC_URL+process.env.REACT_APP_API_SUFFIX+"/query",
});

const renderApp = () => ReactDOM.render(
    <ApolloProvider client={client}>
        <BrowserRouter basename={process.env.PUBLIC_URL}>
        <App />
        </BrowserRouter>
    </ApolloProvider>,
    document.getElementById("root"));

UserService.initKeycloak(renderApp);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
