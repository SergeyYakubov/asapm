import React from 'react';
import {useQuery} from '@apollo/react-hooks';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import {BeamtimeFilterBox} from "./FilterBoxes";
import Divider from "@material-ui/core/Divider";
import {QueryResult} from "@apollo/react-common";
import CircularProgress from '@material-ui/core/CircularProgress';
import clsx from "clsx";
import {useHistory} from "react-router-dom";
import {METAS } from "./graphQLSchemes"
import {MetaData, Status } from  "./meta"

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
    queryResult: QueryResult<MetaData>,
    status: Status,
    title: string,
}

function MetaColumn({queryResult, status,title}: MetaColumnProps) {
    const classes = useStyles();
    const history = useHistory();

    if (queryResult.error) {
        console.log(queryResult.error.message)
    }
    if (queryResult.loading || queryResult.error) {
        return <Paper className={clsx(classes.paper, classes.paperNoReducedPadding)}>
            <div>
                {queryResult.loading ? <CircularProgress/> : <p>{queryResult.error!.message}...</p>}
            </div>
        </Paper>
    }

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        const path = "/detailed/" + event.currentTarget.id+"/meta";
        history.push(path);
    }

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
                        <ListItemText
                            primaryTypographyProps={{noWrap: true}}
                            primary={meta.title}
                            secondary={
                                <Grid container justify="space-between" component="span">
                                    <React.Fragment>
                                        <Typography component="span">
                                            Beamtime ID: {meta.id}
                                        </Typography>
                                        <Typography component="span" align="right">
                                            Beamline: {meta.beamline || "undefined"}
                                        </Typography>
                                    </React.Fragment>
                                </Grid>
                            }
                        />
                    </ListItem>
                /*      Object.entries(meta.customValues).map(([key, value]) => {
                              switch (typeof value) {
                                  case "object":
                                      return <Typography variant="h5" component="h2">
                                          {key}: {JSON.stringify(value)}
                                      </Typography>
                                  default:
                                      return <Typography variant="h5" component="h2">
                                          {key}: {value}
                                      </Typography>
                              }
                          }
                      )*/
            )
            }
        </List>
    </Paper>
        </Grid>
    </Grid>
}

function MetaListPage() {
    const queryResult = useQuery<MetaData>(METAS, {
        pollInterval: 5000,
    });

    const classes = useStyles();
    return (
        <div className={classes.root}>
            <Toolbar variant="dense"/>
            <BeamtimeFilterBox/>
            <Grid container spacing={1}>
                <Grid item xs={12}>
                    <Divider></Divider>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <MetaColumn  title="Running"  queryResult={queryResult} status={Status.Running}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <MetaColumn  title="Completed" queryResult={queryResult} status={Status.Completed}/>
                </Grid>
            </Grid>
        </div>
    );
}


export default MetaListPage;
