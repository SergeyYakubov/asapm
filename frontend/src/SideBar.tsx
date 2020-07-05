import React from 'react';
import {createStyles, Theme, makeStyles} from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ViewListIcon from '@material-ui/icons/ViewList';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Box from '@material-ui/core/Box';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import IconButton from "@material-ui/core/IconButton";
import AccountCircle from "@material-ui/icons/AccountCircle";

const drawerWidth = 200;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        drawer: {
            width: drawerWidth,
            flexShrink: 0,
        },
        drawerPaper: {
            width: drawerWidth,
        },
        drawerContainer: {
            //overflow: 'auto',
        },
        hideButton: {
            marginTop: 'auto',
            marginLeft: 'auto',
            marginRight: theme.spacing(0),
            transform: "rotate(-90deg)"
        },

    }),
);

export default function SideBar() {
    const classes = useStyles();

    return (
        <Drawer
            className={classes.drawer}
            variant="permanent"
            classes={{
                paper: classes.drawerPaper,
            }}
        >
            <Toolbar variant="dense"/>
            <div className={classes.drawerContainer}>
                <List>
                    <ListItem button key="List View">
                        <ListItemIcon><ViewListIcon/></ListItemIcon>
                        <ListItemText primary="List View"/>
                    </ListItem>
                </List>
            </div>
                <IconButton edge="end" className={classes.hideButton} color="inherit">
                    <ExpandLessIcon/>
                </IconButton>


        </Drawer>
    );
}
