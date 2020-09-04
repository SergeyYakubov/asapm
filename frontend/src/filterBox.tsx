import React from 'react';
import Typography from '@material-ui/core/Typography';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
        },
        paper: {
            paddingTop: theme.spacing(1),
            padding: theme.spacing(2),
            margin: theme.spacing(0),
            textAlign: 'center',
            color: theme.palette.text.primary,
        },

        inline: {
            flex: 1,
            display: 'inline',
        },
        textField: {
            marginLeft: theme.spacing(2),
            marginRight: theme.spacing(1),
            width: '60%',
        },


    }),
);


function FilterBox() {
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <Grid container spacing={1}   alignItems="flex-end">
                <Grid item xs={12}>
                    <Typography variant="h6" color="textSecondary">
                        Beamtimes
                    </Typography>
                </Grid>
                <Grid item md={6} sm={12} xs={12}>
                    <Typography variant="overline">
                        Quick Filters:
                    </Typography>
                </Grid>
                <Grid item md={6} xs={12}>
                    <Box
                        display="flex"
                        alignItems="flex-end"
                    >
                    <Typography noWrap={true} variant="overline" align={"right"}>
                        Quick Search :
                    </Typography>
                    <TextField  className={classes.textField} id="standard-search" margin="dense" label="Search field" type="search"  />
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}

function CollectionFilterBox() {
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <Grid container spacing={1}   alignItems="flex-end">
                <Grid item xs={12}>
                    <Typography variant="h6" color="textSecondary">
                        Collections
                    </Typography>
                </Grid>
            </Grid>
        </div>
    );
}



export {
    FilterBox,
    CollectionFilterBox
}

