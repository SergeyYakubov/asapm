import React from 'react';
import './App.css';
import TopBar from "./topBar";
import {ThemeProvider, createMuiTheme} from '@material-ui/core/styles';
import {PaletteType} from "@material-ui/core";
import {useQuery} from '@apollo/react-hooks';
import {gql} from 'apollo-boost';
import userPreferences from "./userPreferences";

interface Meta {
    beamtimeId: number;
    customValues: Object;
}

interface MetaData {
    metas: Meta[];
}


const METAS = gql`
 {
  metas {
    beamtimeId
    customValues
  }
}
`;

function ExchangeRates() {
    const {loading, error, data} = useQuery<MetaData>(METAS, {
        pollInterval: 5000,
    });

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error :( {error.message}</p>;
    return (
        <p>
            {data && data.metas.map(meta =>
                    Object.entries(meta.customValues).map(([key, value]) =>
                    {
                    switch (typeof value) {
                        case "object":
                            return <p key={key}> {key}: {JSON.stringify(value)}</p>
                        default:
                            return <p key={key}> {key}: {value}</p>
                        }
                    }
                    )
            )
            }
        </p>
    );
}



function App() {
    const {loading, error, data} = userPreferences.useUserPreferences();
    if (loading) return <p>Loading user preferences...</p>;
    let themeType : PaletteType = "light";
    if (error)  {
        console.log("cannot load user preferences, will use default");
    } else {
        themeType = data!.user.preferences.schema;
    };

    const theme = createMuiTheme({
        overrides: {MuiAppBar: {colorPrimary: {backgroundColor: themeType === "dark" ? "#002984" : "#53c4f7"}}},
        palette: {type: themeType}
    });

    return (
        <ThemeProvider theme={theme}>
            <div className="App">
                <TopBar/>
            </div>
            <div>
                <ExchangeRates/>
            </div>
        </ThemeProvider>
    );
}

export default App;
