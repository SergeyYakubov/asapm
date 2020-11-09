import React from "react";
import {Box, Paper, Typography} from "@material-ui/core";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import LogbookItemPopover from "./LogbookItemPopover";
import {LogEntryMessage} from "../../generated/graphql";
import LogbookMarkdownViewer from "./LogbookMarkdownViewer";

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
        messageHeader: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderBottom: '1px dashed #BBBBBB', // TODO: Theme border color
            '& > *:first-child': {
                display: 'flex',
                justifyContent: 'flex-start',
                width: '100%',
            },
            '& > *:last-child': {
                display: 'flex',
                justifyContent: 'flex-end',
                width: '100%',
            },
        }
    }),
);

function toHumanTimestamp(dateString: string): string {
    const date = new Date(dateString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function LogbookItem({message}: {message: LogEntryMessage}): JSX.Element {
    //console.log('LogbookItem', message);
    const classes = useStyles();

    return <Paper elevation={3} className={classes.paper}>
        <div className={classes.messageHeader}>
            <div><span style={{paddingLeft: '12px'}}>{toHumanTimestamp(message.time)}</span></div>
            <div><span style={{whiteSpace: 'nowrap'}}>{message.facility} | {message.beamtime}</span></div>
            <div><LogbookItemPopover idRef={message.id} /></div>
        </div>
        <LogbookMarkdownViewer rawMarkdown={message.message} />
    </Paper>;
}

//const LogbookItemMemoed = React.memo(LogbookItem);

export default LogbookItem;
