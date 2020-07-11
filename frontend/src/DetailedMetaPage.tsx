import React from 'react';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import FilterBox from "./filterBox";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
            margin: theme.spacing(1),
        },
    }),
);


function DetailedMeta() {
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <Toolbar variant="dense"/>
            <FilterBox/>
        </div>
    );
}


export default DetailedMeta;
