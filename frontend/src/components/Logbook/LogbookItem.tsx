import React from "react";
import {Paper, Typography} from "@material-ui/core";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import LogbookItemPopover from "./LogbookItemPopover";
import {LogEntryMessage} from "../../generated/graphql";

export interface ItemDefinition {
    time: Date;
    message: string;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
            margin: theme.spacing(1),
            minWidth:0,
        },
        paper: {
            padding: theme.spacing(0.5),
            margin: theme.spacing(1),
            textAlign: 'center',
            color: theme.palette.text.primary,
            background: theme.palette.lightBackground.main,
            borderRadius: 0,
            minHeight: 150
        },
        paperNoReducedPadding: {
            paddingTop: theme.spacing(2),
            padding: theme.spacing(2),
            margin: theme.spacing(0),
            textAlign: 'center',
            color: theme.palette.text.primary,
            background: theme.palette.lightBackground.main,
            borderRadius: 0,
        },
        listItem: {
            background: theme.palette.background.paper,
            marginTop: theme.spacing(1),
            borderRadius: 4,
            textOverflow: "ellipsis",
        },
        inline: {
            flex: 1,
            display: 'inline',
        },

    }),
);

function toHumanTimestamp(dateString: string): string {
    const date = new Date(dateString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function LogbookItem({message}: {message: LogEntryMessage}): JSX.Element {
    console.log('LogbookItem', message);
    const classes = useStyles();

    return <Paper elevation={3} className={classes.paper}>
        <span style={{position: 'absolute' as const, left: 21}}>{toHumanTimestamp(message.time)}</span>
        <div style={{position: 'absolute' as const, right: 21}}><LogbookItemPopover idRef={message.id} /></div>
        <Typography>{message.message}</Typography>
    </Paper>;
}

const LogbookItemMemoed = React.memo(LogbookItem);

export default LogbookItemMemoed;
