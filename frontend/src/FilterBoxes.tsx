import React, {useCallback, useEffect} from 'react';
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
import {CollectionDetails, CollectionEntitiesDetails} from "./meta";
import {useQuery} from "@apollo/client";
import {COLLECTIONS} from "./graphQLSchemes";
import {CircularProgress} from "@material-ui/core";


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
        progress: {
            marginLeft: theme.spacing(2),
            width: "30%",
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
            <Grid container spacing={1} alignItems="flex-end">
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
                        <TextField className={classes.textField} id="standard-search" margin="dense"
                                   label="Search field" type="search"/>
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}

type CollectionFilterBoxProps = {
    filter: CollectionFilter
    setFilter: React.Dispatch<React.SetStateAction<CollectionFilter>>
    setCollections: React.Dispatch<React.SetStateAction<CollectionDetails[]>>
}

function getFilterString(filter: CollectionFilter) {
    let filterString = ""
    if (filter.showBeamtime && !filter.showSubcollections) {
        filterString = "type = 'beamtime'"
    }
    if (!filter.showBeamtime && filter.showSubcollections) {
        filterString = "type = 'collection'"
    }

    if (!filter.showBeamtime && !filter.showSubcollections) {
        filterString = "type = 'bla'"
    }

    if (filter.textSearch === "") {
        return filterString
    }

    if (filterString) {
        filterString = filterString + "AND jsonString regexp '" + filter.textSearch + "'"
    } else {
        filterString = "jsonString regexp '" + filter.textSearch + "'"
    }
    return filterString
}

function CollectionFilterBox({filter, setFilter, setCollections}: CollectionFilterBoxProps) {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilter({...filter, [event.target.name]: event.target.checked});
    };

    const handler = useCallback(debounce(setFilter, 500), []);

    const handleTextSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handler({...filter, textSearch: event.target.value});
    }

    const queryResult = useQuery<CollectionEntitiesDetails>(COLLECTIONS, {
        pollInterval: 5000,
        variables: {filter: getFilterString(filter), orderBy: "id"}
    });
    if (queryResult.error) {
        setCollections([])
        console.log(queryResult.error.message)
    }

    useEffect(() => {
        if (queryResult.loading === false && queryResult.data) {
            console.log("set collection");
            setCollections(queryResult.data!.collections);
        }
    }, [queryResult.loading, queryResult.data, setCollections])


    const classes = useStyles();
    return (
        <div className={classes.root}>
            <Grid container spacing={1} alignItems="flex-end">
                <Grid item xs={12}>
                    <Box display="flex" alignItems="center">
                        <Typography variant="h6" color="textSecondary">
                            Collections
                        </Typography>
                        {
                            queryResult.loading &&
                            <CircularProgress size={20} className={classes.progress}/>
                        }
                    </Box>
                </Grid>
                <Grid item xs={12}>
                    <Paper className={classes.paper}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Collection Type</FormLabel>
                            <FormGroup>
                                <FormControlLabel
                                    control={<Checkbox checked={filter.showBeamtime} onChange={handleChange}
                                                       name="showBeamtime"/>}
                                    label="Beamtimes"
                                />
                                <FormControlLabel
                                    control={<Checkbox checked={filter.showSubcollections} onChange={handleChange}
                                                       name="showSubcollections"/>}
                                    label="Subcollections"
                                />
                            </FormGroup>
                        </FormControl>
                        <TextField id="collectionFilterTextSearch" label="Search field" type="search"
                                   onChange={handleTextSearchChange}/>
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

