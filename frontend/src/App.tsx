import React from 'react';
import './App.css';
import TopBar from "./topBar";
import {ThemeProvider, createMuiTheme} from '@material-ui/core/styles';
import {PaletteType} from "@material-ui/core";

function App() {
    const [themeType, setThemeType] = React.useState<PaletteType>("light");

    const theme = createMuiTheme({
        overrides: {MuiAppBar: {colorPrimary: {backgroundColor: themeType==="dark"?"#002984":"#53c4f7"}}},
        palette: {type:themeType }
    });

    return (
        <ThemeProvider theme={theme}>
            <div className="App">
                <TopBar themeType={themeType} onChangeThemeType={setThemeType}/>
            </div>
        </ThemeProvider>
    );
}

export default App;
