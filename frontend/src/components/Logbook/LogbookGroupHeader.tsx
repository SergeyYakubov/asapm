import * as React from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import {Chip} from "@material-ui/core";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        groupRoot: {
            width: '100%',
            display: 'flex',
            placeItems: 'center',
            paddingTop: 3,
            paddingBottom: 3,
            transform: 'translateY(-1px)', // Fix text that is appearing over a fixed header
        },
        bar: {
            borderBottom: '1px dashed',
            borderBottomColor: theme.palette.text.secondary,
            flex: '1',
        },
        label: {
            marginLeft: 10,
            marginRight: 10,
            fontWeight: 'bold',
        },
        whitemaker: {
            position: 'absolute',
            width: '100%',
            height: '50%',
            top: 0,
            backgroundColor: theme.palette.background.paper,
            zIndex: -1,
        }
    })
);
function LogbookGroupHeader({label}: {label: string}): JSX.Element {
    const classes = useStyles();

    console.log('header');

    return <div className={classes.groupRoot}>
        <div className={classes.whitemaker}></div>
        <div className={classes.bar}></div>
        <div className={classes.label}><Chip size="small" label={label} /></div>
        <div className={classes.bar}></div>
    </div>;
}

export default LogbookGroupHeader;
