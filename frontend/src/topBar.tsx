import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import UserAccount from "./userAccount";


const useStyles = makeStyles((theme) => ({
    root: {
        zIndex: theme.zIndex.drawer + 1,
    },
    userAccountButton: {
        marginLeft: 'auto',
    },
}));

export default function TopBar() {
    const classes = useStyles();
    return (
            <AppBar position="fixed" className={classes.root}>
                <Toolbar variant="dense">
                    <div className={classes.userAccountButton}>
                        <UserAccount/>
                    </div>
                </Toolbar>
            </AppBar>
    );
}
