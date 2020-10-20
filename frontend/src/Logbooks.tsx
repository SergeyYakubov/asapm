import Toolbar from "@material-ui/core/Toolbar";
import Grid from "@material-ui/core/Grid";
import React from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
            margin: theme.spacing(1),
            minWidth:0,
        },
    }),
);


function Logbooks(): JSX.Element {
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <Toolbar variant="dense"/>
            <Grid container spacing={1}>
                <Grid item xs={12}>
                    very cool logbooks
                </Grid>
            </Grid>
        </div>
    );
}


export default Logbooks;
