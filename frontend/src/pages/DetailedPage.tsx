import React from 'react';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import {Link, RouteComponentProps} from "react-router-dom";
import {METAS_DETAILED, COLLECTION_ENTITY_DETAILED} from "../graphQLSchemes";
import {useQuery} from "@apollo/client";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import {Breadcrumbs, Divider} from "@material-ui/core";
import Chip from '@material-ui/core/Chip';
import clsx from "clsx";

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import DetailedTabs from "../components/DetailedTabs";
import {BeamtimeMeta, CollectionEntry, Query} from "../generated/graphql";

const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            root: {
                flexGrow: 1,
                margin: theme.spacing(0),
                minWidth: 0,
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

type TParams = { id: string, section: string };

type DetailedHeaderProps = {
    meta: BeamtimeMeta | CollectionEntry,
    rawView: boolean,
    setRawView: React.Dispatch<React.SetStateAction<boolean>>
    isBeamtime: boolean
}

type MetaViewProps = {
    meta: BeamtimeMeta | CollectionEntry
}

type BreadcrumbsProps = {
    meta: CollectionEntry
}


function Navmenu({meta}: BreadcrumbsProps) {
    const cols = meta.id.split(".");
    const first = cols.shift();
    const last = cols.pop();
    const btPath = "/detailed/" + meta.parentBeamtimeMeta.id + "/meta";
    const path = "/detailedcollection/" + meta.id + "/meta";
    let curPath = "/detailedcollection/"+meta.id;

    return <Breadcrumbs aria-label="breadcrumb">
        <Link color="inherit" to={btPath}>
            {first}
        </Link>
        {cols.map(value => {
            curPath+="."+value;
            return <Link color="inherit" to={curPath+"/meta"}>
                {value}
                </Link>;
        })}
        <Link
            color="textPrimary"
            to={path}
            aria-current="page"
        >
            {last}
        </Link>
    </Breadcrumbs>;
}

function DetailedHeader({meta, rawView, setRawView, isBeamtime}: DetailedHeaderProps) {
    const classes = useStyles();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRawView(event.target.checked);
    };
    return (
        <div className={classes.header}>
            <Grid container spacing={0} justify={"space-between"} alignItems="flex-end">
                <Typography variant="h6" color="textSecondary">
                    Detailed {isBeamtime ? "Beamtime" : "Collection"} View
                </Typography>
                {!isBeamtime && <Navmenu meta={meta as CollectionEntry}/>}
                <Grid item xs={12}>
                    <Typography variant="h5" align="center" className={classes.title}>
                        {isBeamtime ? meta.title : meta.title || (meta as CollectionEntry).id}
                    </Typography>
                </Grid>
            </Grid>
            <Grid container direction="row" justify={isBeamtime ? "space-between" : "flex-end"} alignItems="flex-end">
                {isBeamtime &&
                <Chip label={(meta as BeamtimeMeta).status} variant="outlined" className={clsx(classes.chip, {
                    [classes.chipRunning]: (meta as BeamtimeMeta).status === 'running',
                    [classes.chipCompleted]: (meta as BeamtimeMeta).status === 'completed',
                    [classes.chipScheduled]: (meta as BeamtimeMeta).status === 'scheduled',
                })}/>
                }
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
    </div>;
}

interface DetailedMetaProps extends RouteComponentProps<TParams> {
    isBeamtime: boolean
}

function useQueryOrErrorString(id: string, isBeamtime: boolean) {
    const queryResult = useQuery<Query>(isBeamtime ? METAS_DETAILED : COLLECTION_ENTITY_DETAILED,
        {
            pollInterval: 5000,
            variables: {filter: "id = '" + id + "'"}
        });
    if (queryResult.error) {
        console.log("meta query error " + queryResult.error);
        return queryResult.error.message;
    }
    if (queryResult.loading) {
        return "loading ...";
    }
    if (isBeamtime && queryResult.data!.meta.length !== 1) {
        return "no data found";
    }
    if (!isBeamtime && queryResult.data!.collections.length !== 1) {
        return "no data found";
    }
    return queryResult;
}

function DetailedPage({match, isBeamtime}: DetailedMetaProps): JSX.Element {
    const classes = useStyles();
    const [rawView, setRawView] = React.useState(false);
    const section = match.params.section;
    const queryResult = useQueryOrErrorString(match.params.id, isBeamtime);
    if (typeof queryResult == "string") {
        return (
            <div className={classes.root}>
                <Typography variant="h3">
                    {queryResult as string}
                </Typography>
            </div>);
    }

    const data: BeamtimeMeta | CollectionEntry = isBeamtime ? queryResult.data!.meta[0] :
        queryResult.data!.collections[0];
    return (
        <div className={classes.root}>
            <DetailedHeader meta={data} rawView={rawView} setRawView={setRawView} isBeamtime={isBeamtime}/>
            {rawView ? (
                <RawMeta meta={data}/>
            ) : (
                <DetailedTabs originalQuery={queryResult} meta={data} section={section} isBeamtime={isBeamtime}/>
            )}
        </div>
    );
}


export default DetailedPage;
