import React from 'react';
import './App.css';
import TopBar from "./topBar";
import {ThemeProvider, createMuiTheme} from '@material-ui/core/styles';
import {PaletteType} from "@material-ui/core";
import userPreferences from "./userPreferences";
import ListMeta from "./ListMetaPage";
import {grey} from '@material-ui/core/colors';
import SideBar from "./SideBar";
import {createStyles, Theme, makeStyles} from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import {Route, Switch, Redirect, useLocation} from 'react-router-dom';
import DetailedBeamtime from "./DetailedBeamtimePage";

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

function App() {
    const classes = useStyles();
    const {pathname} = useLocation();
    const [activeBeamtime, SetActiveBeamtime] = React.useState("");

    const {loading, error, data} = userPreferences.useUserPreferences();
    if (loading) return <p>Loading user preferences...</p>;
    let themeType: PaletteType = "light";
    if (error) {
        console.log("cannot load user preferences, will use default");
    } else {
        themeType = data!.user.preferences.schema;
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
                <SideBar activeBeamtime={activeBeamtime}/>
                <Switch>
                    <Route exact path="/">
                        <Redirect to="/metaboard"/>
                    </Route>
                    <Route path="/metaboard" render={(props) => (
                        <ListMeta {...props} activeBeamtime={activeBeamtime} SetActiveBeamtime={SetActiveBeamtime}/>
                    )} exact/>
                    <Route key="beamtime" path={"/detailed/:id"} render={(props) => (
                        <DetailedBeamtime {...props} SetActiveBeamtime={SetActiveBeamtime} isBeamtime={true}/>
                    )} exact/>
                    <Route key="colection" path={"/detailedcollection/:id"} render={(props) => (
                        <DetailedBeamtime {...props} SetActiveBeamtime={SetActiveBeamtime} isBeamtime={false}/>
                    )} exact/>
                </Switch>
            </div>
        </ThemeProvider>
    );
}

export default App;
