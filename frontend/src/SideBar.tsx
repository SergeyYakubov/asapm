import React from 'react';
import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ViewListIcon from '@material-ui/icons/ViewList';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import IconButton from "@material-ui/core/IconButton";
import clsx from 'clsx';

const drawerWidth = 200;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        button: {
            marginTop: 'auto',
            marginLeft: 'auto',
            marginRight: theme.spacing(2),
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
            width: theme.spacing(7) + 1,
            [theme.breakpoints.up('sm')]: {
                width: theme.spacing(9) + 1,
            },
        },

    }),
);

export default function SideBar() {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);

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
                    <ListItem button key="Board View">
                        <ListItemIcon><ViewListIcon/></ListItemIcon>
                        <ListItemText primary="Board View"/>
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
