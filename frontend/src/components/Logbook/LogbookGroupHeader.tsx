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
        }
    })
);
function LogbookGroupHeader({label}: {label: string}): JSX.Element {
    const classes = useStyles();

    console.log('header');

    return <div className={classes.groupRoot}>
        <div className={classes.bar}></div>
        <div className={classes.label}><Chip size="small" label={label} /></div>
        <div className={classes.bar}></div>
    </div>;
}

export default LogbookGroupHeader;
