import React from 'react';
import './App.css';
import TopBar from "./components/Header/TopBar";
import {ThemeProvider, createMuiTheme} from '@material-ui/core/styles';
import {PaletteType} from "@material-ui/core";
import userPreferences from "./userPreferences";
import MetaListPage from "./pages/MetaListPage";
import CollectionListPage from "./pages/CollectionListPage";
import {grey} from '@material-ui/core/colors';
import SideBar from "./components/Sidebar/SideBar";
import {createStyles, Theme, makeStyles} from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import {Route, Switch, Redirect} from 'react-router-dom';
import DetailedPage from "./pages/DetailedPage";
import LogbooksPage from "./pages/LogbooksPage";

declare module "@material-ui/core/styles/createPalette" {
    interface Palette {
        lightBackground: Palette['primary'];
    }

    interface PaletteOptions {
        lightBackground: PaletteOptions['primary'];
    }
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            display: "flex",
        },
    }),
);

function App(): JSX.Element {
    const classes = useStyles();

    const {loading, error, data} = userPreferences.useUserPreferences();
    if (loading) return <p>Loading user preferences...</p>;
    let themeType: PaletteType = "light";
    if (error) {
        console.log("cannot load user preferences, will use default");
    } else {
        themeType = data?.user?.preferences.schema as PaletteType || themeType;
    }

    const theme = createMuiTheme({
        overrides: {
            MuiAppBar: {colorPrimary: {backgroundColor: themeType === "dark" ? "#002984" : "#5a4bff"}},
            MuiCssBaseline: {
                '@global': {
                    body: {
                        backgroundColor: themeType === "light" ? "#fff" : "#424242",
                    },
                },
            }
        },
        palette: {
            type: themeType,
            lightBackground: {
                main: themeType === "light" ? grey[100] : grey[700]
            },
        }
    });

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <div className={classes.root}>
                <TopBar/>
                <SideBar/>
                <Switch>
                    <Route exact path="/">
                        <Redirect to="/collections"/>
                    </Route>
                    <Route path="/metaboard" render={(props) => (
                        <MetaListPage/>
                    )} exact/>
                    <Route key="beamtime" path={"/detailed/:id/:section"} render={(props) => (
                        <DetailedPage {...props}  isBeamtime={true}/>
                    )} exact/>
                    <Route key="collection" path={"/detailedcollection/:id/:section"} render={(props) => (
                        <DetailedPage {...props}  isBeamtime={false}/>
                    )} exact/>
                    <Route path="/collections" render={(props) => (
                        <CollectionListPage/>
                    )} exact/>
                    <Route path="/logbooks" render={(props) => (
                        <Logbooks/>
                    )} exact/>
                </Switch>
            </div>
        </ThemeProvider>
    );
}

export default App;
