import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import UserAccount from "./userAccount";
import Typography from '@material-ui/core/Typography';


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
                    <Typography variant="h6" noWrap>
                        ASAP Metadata Service
                    </Typography>
                    <div className={classes.userAccountButton}>
                        <UserAccount/>
                    </div>
                </Toolbar>
            </AppBar>
    );
}
