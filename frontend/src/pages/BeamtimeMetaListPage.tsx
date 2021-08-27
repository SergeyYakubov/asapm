import React from 'react';
import {QueryResult, useQuery} from '@apollo/client';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import {
    BeamtimeFilterData,
    beamtimeFilterVar,
    CollectionFilterBox,
    GET_BEAMTIME_FILTER
} from "../components/FilterBoxes";
import Divider from "@material-ui/core/Divider";
import CircularProgress from '@material-ui/core/CircularProgress';
import clsx from "clsx";
import {useHistory} from "react-router-dom";
import {METAS} from "../graphQLSchemes";
import {Query, QueryCollectionsArgs} from "../generated/graphql";
import {GetFilterString, GetOrderBy, Mode} from "../common";
import {Avatar, ListItemAvatar} from "@material-ui/core";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
            margin: theme.spacing(1),
            minWidth:0,
        },
        paper: {
            paddingTop: theme.spacing(1),
            padding: theme.spacing(2),
            margin: theme.spacing(0),
            textAlign: 'center',
            color: theme.palette.text.primary,
            background: theme.palette.lightBackground.main,
            borderRadius: 0,
        },
        paperNoReducedPadding: {
            paddingTop: theme.spacing(2),
            padding: theme.spacing(2),
            margin: theme.spacing(0),
            textAlign: 'center',
            color: theme.palette.text.primary,
            background: theme.palette.lightBackground.main,
            borderRadius: 0,
        },
        listItem: {
            background: theme.palette.background.paper,
            marginTop: theme.spacing(1),
            borderRadius: 4,
            textOverflow: "ellipsis",
        },
        inline: {
            flex: 1,
            display: 'inline',
        },

    }),
);

type MetaColumnProps = {
    queryResult: QueryResult<Query>,
    status: string,
    title: string,
}

function MetaColumn({queryResult, status,title}: MetaColumnProps) {
    const classes = useStyles();
    const history = useHistory();

    if (queryResult.error) {
        console.log("column query error" + queryResult.error);
    }
    if (queryResult.loading || queryResult.error) {
        return <Paper className={clsx(classes.paper, classes.paperNoReducedPadding)}>
            <div>
                {queryResult.loading ? <CircularProgress/> : <p>{queryResult.error!.message}...</p>}
            </div>
        </Paper>;
    }

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        const path = "/detailed/" + event.currentTarget.id+"/meta";
        history.push(path);
    };

    return <Grid
        container
        direction="column"
        justify="center"
        alignItems="stretch"
    >
        <Grid  item xs={12}>
            <Typography variant="overline">
                {title}
            </Typography>
        </Grid>
        <Grid  item xs={12}>
        <Paper className={classes.paper}>
        <List component="nav">
            {queryResult.data && queryResult.data!.meta.filter(meta => meta.status === status).map(meta =>
                    <ListItem button className={classes.listItem} onClick={handleClick}
                              id={meta.id as string} key={meta.id as string} >
                        {meta.thumbnail &&
                        <ListItemAvatar>
                            <Avatar alt="" src={`data:image/png;base64,${meta.thumbnail}`}/>
                        </ListItemAvatar>
                        }
                        <ListItemText
                            primaryTypographyProps={{noWrap: true}}
                            primary={meta.title}
                            secondary={
                                <Grid container justify="space-between" alignItems={"baseline"} component="span">
                                    <Typography component="span">
                                        Beamtime ID: {meta.id || "undefined"}
                                    </Typography>
                                    <Typography component="span" align="right">
                                        Beamline: {meta.beamline || "undefined"}
                                    </Typography>
                                </Grid>
                            }
                        />
                    </ListItem>
            )
            }
        </List>
    </Paper>
        </Grid>
    </Grid>;
}

function BeamtimeMetaListPage(): JSX.Element {

    const {data} = useQuery<BeamtimeFilterData>(GET_BEAMTIME_FILTER);
    const filter = data!.beamtimeFilter;

    const queryResult = useQuery<Query, QueryCollectionsArgs>(METAS, {
        pollInterval: 5000,
        variables: {filter: GetFilterString(filter), orderBy: GetOrderBy(filter)}
    });

    const classes = useStyles();
    return (
        <div className={classes.root}>
            <CollectionFilterBox queryResult={queryResult} filter={filter} mode={Mode.Beamtimes} filterVar={beamtimeFilterVar}/>
            <Grid container spacing={1}>
                <Grid item xs={12}>
                    <Divider></Divider>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <MetaColumn  title="Running"  queryResult={queryResult} status={"running"}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <MetaColumn  title="Completed" queryResult={queryResult} status={"completed"}/>
                </Grid>
            </Grid>
        </div>
    );
}


export default BeamtimeMetaListPage;
