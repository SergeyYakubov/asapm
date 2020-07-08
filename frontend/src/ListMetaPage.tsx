import React from 'react';
import {useQuery} from '@apollo/react-hooks';
import {gql} from 'apollo-boost';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import FilterBox from "./filterBox";
import Divider from "@material-ui/core/Divider";
import {FixedSizeList, ListChildComponentProps} from 'react-window';

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
    data: MetaData | undefined,
    status: Status
}

function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
        width,
        height
    };
}

function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = React.useState(getWindowDimensions());

    React.useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}


function renderRow(props: ListChildComponentProps) {
    let {index, style, data} = props;
    const meta = data.data[index];
    // @ts-ignore
    style = {
        ...style,
        top: style.top as number + 10,
        height: style.height as number - 10
    };
    return (
        <ListItem button className={data.classes.listItem} style={style} key={index}>
            <ListItemText
                primaryTypographyProps={{noWrap: true}}
                primary={meta.title}
                secondary={
                    <Grid container justify="space-between">
                        <React.Fragment>
                            <Typography noWrap={true}> Beamtime ID: {meta.beamtimeId}</Typography>
                            <Typography noWrap={true} align="right">Beamline: {meta.beamline}</Typography>
                        </React.Fragment>
                    </Grid>
                }
            />
        </ListItem>
    );
}

/*
{data && data.metas.filter(meta => meta.status == status).map(meta =>
    <ListItem button className={classes.listItem}>
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
)
}
 */

function MetaColumn({data, status}: MetaColumnProps) {
    const classes = useStyles();
    const { height, width } = useWindowDimensions();

    if (!data) {
        return <Paper className={classes.paper}>
        </Paper>
    }
    const matchedMeta = data.metas.filter(meta => meta.status === status).map(meta => meta);
    return <Paper className={classes.paper}>
                <FixedSizeList height={height*0.7} width={"100%"} itemSize={100}
                               itemData={{classes: classes, data: matchedMeta}} itemCount={matchedMeta.length}>
                    {renderRow}
                </FixedSizeList>
    </Paper>
}

function ListMeta() {
    const {loading, error, data} = useQuery<MetaData>(METAS, {
        pollInterval: 60000, // one minute
    });

    const classes = useStyles();

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error.message}</p>;
    return (
        <div className={classes.root}>
            <Toolbar variant="dense"/>
            <FilterBox></FilterBox>
            <Grid container spacing={1}>
                <Grid item xs={12}>
                    <Divider></Divider>
                </Grid>
                <Grid item xs={4}>
                    <Typography variant="overline">
                        Scheduled
                    </Typography>
                </Grid>
                <Grid item xs={4}>
                    <Typography variant="overline">
                        Running
                    </Typography>
                </Grid>
                <Grid item xs={4}>
                    <Typography variant="overline">
                        Completed
                    </Typography>
                </Grid>
                <Grid item xs={4}>
                    <MetaColumn data={data} status={Status.Scheduled}/>
                </Grid>
                <Grid item xs={4}>
                    <MetaColumn data={data} status={Status.Running}/>
                </Grid>
                <Grid item xs={4}>
                    <MetaColumn data={data} status={Status.Completed}/>
                </Grid>
            </Grid>
        </div>
    );
}


export default ListMeta;
