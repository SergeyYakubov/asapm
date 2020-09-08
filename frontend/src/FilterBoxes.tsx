import React,{ useCallback } from 'react';
import Typography from '@material-ui/core/Typography';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from "@material-ui/core/Paper";
import {CollectionFilter} from "./common";
import debounce from 'lodash.debounce';


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
            background: theme.palette.lightBackground.main,
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


function BeamtimeFilterBox() {
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

type CollectionFilterBoxProps = {
    filter: CollectionFilter
    setFilter: React.Dispatch<React.SetStateAction<CollectionFilter>>
}

function CollectionFilterBox({filter,setFilter}:CollectionFilterBoxProps) {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilter({ ...filter, [event.target.name]: event.target.checked });
    };

    const handler = useCallback(debounce(setFilter, 500), []);

    const handleTextSearchChange= (event: React.ChangeEvent<HTMLInputElement>) => {
        handler({ ...filter, textSearch: event.target.value });
    }

    const classes = useStyles();
    return (
        <div className={classes.root}>
            <Grid container spacing={1}   alignItems="flex-end">
                <Grid item xs={12}>
                    <Typography variant="h6" color="textSecondary">
                        Collections
                    </Typography>
                </Grid>
                <Grid item xs={12} >
                    <Paper className={classes.paper}>
                <FormControl component="fieldset">
                    <FormLabel component="legend">Collection Type</FormLabel>
                    <FormGroup>
                        <FormControlLabel
                            control={<Checkbox checked={filter.showBeamtime} onChange={handleChange} name="showBeamtime" />}
                            label="Beamtimes"
                        />
                        <FormControlLabel
                            control={<Checkbox checked={filter.showSubcollections} onChange={handleChange} name="showSubcollections" />}
                            label="Subcollections"
                        />
                    </FormGroup>
                </FormControl>
                        <TextField id="collectionFilterTextSearch" label="Search field" type="search" onChange={handleTextSearchChange}/>
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
}

export {
    BeamtimeFilterBox,
    CollectionFilterBox
}

