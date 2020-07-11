import React from 'react';
import {useQuery} from '@apollo/react-hooks';
import {gql} from 'apollo-boost';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import FilterBox from "./filterBox";
import Divider from "@material-ui/core/Divider";
import {QueryResult} from "@apollo/react-common";
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from "@material-ui/core/IconButton";
import clsx from "clsx";
import Drawer from "@material-ui/core/Drawer";
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import { useHistory } from "react-router-dom";

enum Status {
    Completed = "Completed",
    Running = "Running",
    Scheduled = "Scheduled"
}


interface Meta {
    beamtimeId: String;
    beamline: String;
    status: Status
    title: String;
}

interface MetaData {
    metas: Meta[];
}


const METAS = gql`
 {
  metas {
    beamtimeId
    beamline
    title
    status
  }
}
`;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
            margin: theme.spacing(1),
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
    status:Status
}

function MetaColumn({queryResult, status}:MetaColumnProps) {
    const classes = useStyles();
    const history = useHistory();

    if (queryResult.error) {
        console.log(queryResult.error.message)
    }
    if (queryResult.loading || queryResult.error) {
             return <Paper className={clsx(classes.paper,classes.paperNoReducedPadding)}>
            <div>
                {queryResult.loading? <CircularProgress />:<p>Internal server error, please try later...</p>}
            </div>
        </Paper>
    }

    const handleDoubleClick = () => {
        const path = process.env.PUBLIC_URL+"/detailed";
        history.push(path);
    }

    return <Paper className={classes.paper}>
        <List component="nav">
            {       queryResult.data && queryResult.data!.metas.filter(meta => meta.status == status).map(meta =>
                    <ListItem button className={classes.listItem} onDoubleClick={handleDoubleClick}>
                        <ListItemText
                            primaryTypographyProps={{noWrap: true}}
                            primary={meta.title}
                            secondary={
                                <Grid container justify="space-between">
                                    <React.Fragment>
                                        <Typography>Beamtime ID: {meta.beamtimeId}</Typography>
                                        <Typography align="right">Beamline: {meta.beamline}</Typography>
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
}

function ListMeta() {
    const queryResult = useQuery<MetaData>(METAS, {
        pollInterval: 5000,
    });

    const classes = useStyles();
    return (
        <div className={classes.root}>
            <Toolbar variant="dense"/>
            <FilterBox></FilterBox>
            <Grid container spacing={1}>
                <Grid item xs={12}>
                    <Divider></Divider>
                </Grid>
                <Grid item xs={4} >
                    <Typography variant="overline">
                        Scheduled
                    </Typography>
                </Grid>
                <Grid item xs={4} >
                    <Typography variant="overline">
                        Running
                    </Typography>
                </Grid>
                <Grid item xs={4} >
                    <Typography variant="overline">
                        Completed
                    </Typography>
                </Grid>
                <Grid item xs={4} >
                    <MetaColumn queryResult={queryResult} status = {Status.Scheduled}/>
                </Grid>
                <Grid item xs={4} >
                    <MetaColumn queryResult={queryResult} status = {Status.Running}/>
                </Grid>
                <Grid item xs={4} >
                    <MetaColumn queryResult={queryResult} status = {Status.Completed}/>
                </Grid>
            </Grid>
        </div>
    );
}


export default ListMeta;
