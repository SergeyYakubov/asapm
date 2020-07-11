import React from 'react';
import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ViewListIcon from '@material-ui/icons/ViewList';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import IconButton from "@material-ui/core/IconButton";
import clsx from 'clsx';
import { NavLink as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import Link from '@material-ui/core/Link';
import { Omit } from '@material-ui/types';

const drawerWidth = 180;

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

export default function SideBar() {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);

    const handleButtonClick = () => {
        setOpen(!open);
    }

    console.log("sidebar rendered");

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
                    <ListItem button key="Board View" component={RouterLink} to={"/metaboard"} exact activeClassName="Mui-selected">
                        <ListItemIcon className={classes.listItem}><ViewListIcon/></ListItemIcon>
                        <ListItemText primary="Board View"/>
                    </ListItem>
                    <ListItem button key="Detailed View" component={RouterLink} to={"/detailed" } activeClassName="Mui-selected">
                        <ListItemIcon className={classes.listItem}> <MenuBookIcon/></ListItemIcon>
                        <ListItemText primary="Detailed View"/>
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
