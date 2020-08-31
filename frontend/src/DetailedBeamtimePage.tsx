import React, {forwardRef, useEffect} from 'react';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import {RouteComponentProps} from "react-router-dom";
import {METAS_DETAILED, Status, MetaDataDetails, MetaDetails} from "./graphQLTypes"
import {useQuery} from "@apollo/react-hooks";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import {Divider} from "@material-ui/core";
import Chip from '@material-ui/core/Chip';
import clsx from "clsx";

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import BeamtimeTabs from "./DetailedBeamtimeTabs";

const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            root: {
                flexGrow: 1,
                margin: theme.spacing(0),
                minWidth:0,
            },
            divider: {
                marginLeft: theme.spacing(0),
                marginRight: theme.spacing(0),
                margin: theme.spacing(1),
            },
            marginLeftRight: {
                marginLeft: theme.spacing(1),
                marginRight: theme.spacing(1),
            },
            title: {
                margin: theme.spacing(1),
            },
            header: {
                margin: theme.spacing(1),
                marginBottom: theme.spacing(2),
            },
            chip: {
                marginLeft: theme.spacing(2),
            },
            chipRunning: {
//            backgroundColor: '#4caf50',
//            color: '#4caf50',
                borderColor: '#4caf50',
            },
            chipCompleted: {
                borderColor: '#ff8a65',
            },
            chipScheduled: {
//            backgroundColor: '#03a9f4',
                borderColor: '#03a9f4',
            },
            switch: {
                marginLeft: 'auto',
                marginRight: theme.spacing(2),
            },
            tabs: {
                borderRight: `1px solid ${theme.palette.divider}`,
            },
        }),
);

type TParams = { id: string };

type DetailedHeaderProps = {
    meta: MetaDetails,
    rawView: boolean,
    setRawView: React.Dispatch<React.SetStateAction<boolean>>
}

type MetaViewProps = {
    meta: MetaDetails
}


function DetailedHeader({meta, rawView, setRawView}: DetailedHeaderProps) {
    const classes = useStyles();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRawView(event.target.checked);
    };

    return (
        <div className={classes.header}>
            <Grid container spacing={0}>
                <Grid item xs={12}>
                    <Typography variant="h6" color="textSecondary">
                        Detailed View
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                        <Typography variant="h5" align="center" className={classes.title}>
                            {meta.title}
                        </Typography>
                </Grid>
            </Grid>
            <Grid container direction="row" justify="space-between" alignItems="flex-end">
                <Chip label={meta.status} variant="outlined" className={clsx(classes.chip, {
                    [classes.chipRunning]: meta.status == 'Running',
                    [classes.chipCompleted]: meta.status == 'Completed',
                    [classes.chipScheduled]: meta.status == 'Scheduled',
                })}/>
                <FormControlLabel
                    control={
                        <Switch
                            checked={rawView}
                            onChange={handleChange}
                            name="checked"
                            color="primary"
                            size="small"
                        />
                    }
                    label="Raw JSON"
                />
            </Grid>
        </div>
    );
}

function replacer(key: string, value: any) {
    if (key === '__typename') {
        return undefined;
    }
    return value;
}

function RawMeta({meta}: MetaViewProps) {
    const classes = useStyles();
    return <div>
        <Divider className={classes.divider}/>
    <div className={classes.marginLeftRight}>
        <pre style={{whiteSpace: "pre-wrap"}} id="json">
            {
                JSON.stringify(meta, replacer, '\t')
            }
        </pre>
    </div>
    </div>
}

interface DetailedMetaProps extends RouteComponentProps<TParams> {
    SetActiveBeamtime: React.Dispatch<React.SetStateAction<string>>,
}

function useQueryOrErrorString(id:string) {
    const queryResult = useQuery<MetaDataDetails>(METAS_DETAILED,
        {
            pollInterval: 5000,
            variables: {filter: "beamtimeId = '" + id + "'"}});
    if (queryResult.error) {
        console.log(queryResult.error);
        return queryResult.error.message;
    }
    if (queryResult.loading) {
        return "loading ...";
    }
    if (queryResult.data!.meta.length != 1) {
        return "no data found";
    }
    return queryResult
}

function DetailedBeamtime({match, SetActiveBeamtime}: DetailedMetaProps) {
    const classes = useStyles();
    useEffect(() => {
        SetActiveBeamtime(match.params.id);
    });

    const [rawView, setRawView] = React.useState(false);

    const queryResult = useQueryOrErrorString(match.params.id);
    if (typeof queryResult == "string") {
        return (
            <div className={classes.root}>
                <Toolbar variant="dense"/>
                <Typography variant="h3">
                    {queryResult as string}
                </Typography>
            </div>)
    }

    return (
        <div className={classes.root}>
            <Toolbar variant="dense"/>
            <DetailedHeader meta={queryResult.data!.meta[0]} rawView={rawView} setRawView={setRawView}/>
            {rawView ? (
                <RawMeta meta={queryResult.data!.meta[0]}/>
            ) : (
                <BeamtimeTabs meta={queryResult.data!.meta[0]}/>
            )}
        </div>
    );
}


export default DetailedBeamtime;
