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
import AppBar from "@material-ui/core/AppBar";

interface Meta {
    beamtimeId: String;
    beamline: String;
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


function ListMeta() {
    const {loading, error, data} = useQuery<MetaData>(METAS, {
        pollInterval: 500000,
    });

    const classes = useStyles();

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error.message}</p>;
    return (
        <div className={classes.root}>
            <Toolbar variant="dense"/>
            <Grid container spacing={1}>
                <Grid item xs={12} sm={4}>
                    <Paper className={classes.paper}>
                        <List component="nav">
                            {data && data.metas.map(meta =>
                                    <ListItem button className={classes.listItem}>
                                        <ListItemText
                                            primaryTypographyProps={{noWrap: true}}
                                            primary={meta.title}
                                            secondary={
                                                <Grid container justify="space-between">
                                                    <React.Fragment>
                                                        <Typography>Id: {meta.beamtimeId}</Typography>
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
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper className={classes.paper}>xs=12 sm=6</Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper className={classes.paper}>xs=6 sm=3</Paper>
                </Grid>
            </Grid>
        </div>
    );
}


export default ListMeta;
