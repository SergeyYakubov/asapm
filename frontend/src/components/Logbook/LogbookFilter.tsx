import React from "react";
import {Paper, Theme} from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import TextField from "@material-ui/core/TextField";
import {createStyles, makeStyles} from "@material-ui/core/styles";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        paper: {
            paddingTop: theme.spacing(1),
            padding: theme.spacing(2),
            marginTop: theme.spacing(2),
            textAlign: 'center',
            color: theme.palette.text.primary,
            background: theme.palette.lightBackground.main,
            borderRadius: 0,
        },
    }),
);

interface LogbookFilterProps {
    onQuickSearchChanged?: (input: string) => void;
}

function LogbookFilter({}: LogbookFilterProps): JSX.Element {
    const classes = useStyles();
    return <Paper className={classes.paper}>
        <div>
            <Grid container spacing={1} alignItems="flex-end">
                <Grid item md={8} xs={12} />
                <Grid item md={4} xs={12}>
                    <Box
                        display="flex"
                        alignItems="flex-end"
                    >
                        <TextField id="standard-search" margin="dense" label="Search" type="search"/>
                    </Box>
                </Grid>
            </Grid>
        </div>
    </Paper>;
}

export default LogbookFilter;
