import React, { useEffect } from 'react';
import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ReorderIcon from '@material-ui/icons/Reorder';
import DashboardIcon from '@material-ui/icons/Dashboard';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import IconButton from "@material-ui/core/IconButton";
import clsx from 'clsx';
import { NavLink as RouterLink} from 'react-router-dom';
import CollectionsBookmarkIcon from '@material-ui/icons/CollectionsBookmark';
const drawerWidth = 200;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        button: {
            marginTop: 'auto',
            marginLeft: 'auto',
            marginRight: theme.spacing(0),
        },
        hideButton: {
            transform: "rotate(-90deg)"
        },
        showButton: {
            transform: "rotate(90deg)"
        },
        drawer: {
            width: drawerWidth,
            flexShrink: 0,
            whiteSpace: 'nowrap',
        },
        drawerOpen: {
            width: drawerWidth,
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
            background: theme.palette.background.default,

        },
        hide: {
            display: 'none',
        },
        drawerClose: {
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            background: theme.palette.background.default,
            overflowX: 'hidden',
            width: theme.spacing(7) ,
        },
        listItem: {
            minWidth: '40px',
        }

    }),
);

function usePersistedState<S>(key:string, defaultValue:S) {
    let setDefaultState = () => {
        const getVariable = localStorage.getItem(key);
        if (getVariable === null) {
            return defaultValue;
        } else {
            return JSON.parse(localStorage.getItem(key) as string);
        }
    }
    const [state, setState] = React.useState(setDefaultState);
    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);
    return [state, setState];
}


export default function SideBar() {
    const classes = useStyles();
    const [open, setOpen] = usePersistedState("sidebarState",true);

    const handleButtonClick = () => {
        setOpen(!open);
    }

    return (
        <Drawer
            variant="permanent"
            className={clsx(classes.drawer, {
                [classes.drawerOpen]: open,
                [classes.drawerClose]: !open,
            })}

            classes={{
                paper: clsx({
                    [classes.drawerOpen]: open,
                    [classes.drawerClose]: !open,
                }),
            }}
        >
            <Toolbar variant="dense"/>
            <div className={classes.drawer}>
                <List>
                    <ListItem button key="Collection List" component={RouterLink} to={"/collections"} exact activeClassName="Mui-selected">
                        <ListItemIcon className={classes.listItem}><ReorderIcon/></ListItemIcon>
                        <ListItemText primary="Collection List"/>
                    </ListItem>
                    <ListItem button key="Beamtime Board" component={RouterLink} to={"/metaboard"} exact activeClassName="Mui-selected">
                        <ListItemIcon className={classes.listItem}><DashboardIcon/></ListItemIcon>
                        <ListItemText primary="Beamtime Board"/>
                    </ListItem>
                    <ListItem button key="Logbooks" component={RouterLink} to={"/logbooks"} exact activeClassName="Mui-selected">
                        <ListItemIcon className={classes.listItem}><CollectionsBookmarkIcon/></ListItemIcon>
                        <ListItemText primary="Logbooks"/>
                    </ListItem>
                </List>
            </div>
            <IconButton edge="end" className={clsx(classes.button, {
                [classes.hideButton]: open,
                [classes.showButton]: !open,
            })}
                        color="inherit" onClick={handleButtonClick}>
                <ExpandLessIcon/>
            </IconButton>
        </Drawer>
    );
}
