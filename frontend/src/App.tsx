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
import {createStyles, makeStyles} from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import {Route, Switch, Redirect} from 'react-router-dom';
import DetailedPage from "./pages/DetailedPage";
import LogbooksPage from "./pages/LogbooksPage";

declare module "@material-ui/core/styles/createPalette" {
// eslint-disable-next-line
    interface Palette {
        lightBackground: Palette['primary'];
    }
// eslint-disable-next-line
    interface PaletteOptions {
        lightBackground: PaletteOptions['primary'];
    }
}

const useStyles = makeStyles(() =>
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

    const rootStyle = {
        display: 'flex',
        height: '100vh',
        flexDirection: 'column' as const,
    };

    const rootContentStyle = {
        overflowY: 'hidden' as const,
        display: 'flex',
        flex: 1,
    };

    const mainStyle = {
        overflow: 'auto' as const,
        flex: 1,
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <div className={classes.root} style={rootStyle}>
                <TopBar/>
                <div style={rootContentStyle}>
                    <aside>
                        <SideBar/>
                    </aside>
                    <main style={mainStyle}>
                        <Switch>
                            <Route exact path="/">
                                <Redirect to="/collections"/>
                            </Route>
                            <Route path="/metaboard" render={() => (
                                <MetaListPage/>
                            )} exact/>
                            <Route key="beamtime" path={"/detailed/:id/:section"} render={(props) => (
                                <DetailedPage {...props}  isBeamtime={true}/>
                            )} exact/>
                            <Route key="collection" path={"/detailedcollection/:id/:section"} render={(props) => (
                                <DetailedPage {...props}  isBeamtime={false}/>
                            )} exact/>
                            <Route path="/collections" render={() => (
                                <CollectionListPage/>
                            )} exact/>
                            <Route path="/logbooks" render={() => (
                                <LogbooksPage/>
                            )} exact/>
                        </Switch>
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}

export default App;
