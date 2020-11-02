import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import UserAccount from "./UserAccount";
import Typography from '@material-ui/core/Typography';
import SvgIcon from '@material-ui/core/SvgIcon';
import { ReactComponent as DesyIcon } from "../../assets/desy_logo.svg";


const useStyles = makeStyles((theme) => ({
    root: {
        zIndex: theme.zIndex.drawer + 1,
    },
    userAccountButton: {
        marginLeft: 'auto',
    },
    logo: {
        minWidth: 40,
        minHeight: 38,
        padding: 0,
        marginRight: theme.spacing(1),
        marginLeft: -15,
    },
}));

const headerStyle = {
    flex: '0 0 auto',
    position: 'static' as const,
};

export default function TopBar(): JSX.Element {
    const classes = useStyles();
    return (
            <AppBar style={headerStyle} className={classes.root}>
                <Toolbar variant="dense">
                    <SvgIcon className={classes.logo}>
                        <DesyIcon/>
                    </SvgIcon>
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
