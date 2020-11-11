import React from "react";
import {Box, Paper, Typography} from "@material-ui/core";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import LogbookItemPopover from "./LogbookItemPopover";
import {LogEntryMessage} from "../../generated/graphql";
import LogbookMarkdownViewer from "./LogbookMarkdownViewer";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        logItemRoot: {
            display: 'flex',
            paddingTop: theme.spacing(1),
            paddingBottom: theme.spacing(1),
            '&:not(:hover) .visibleWhenHover': {
                display: 'none',
            },
            '&:hover': {
                background: theme.palette.lightBackground.main,
            }
        },
        messageInfo: {
            width: '100px',
            display: 'flex',
            borderRight: '2px solid',
            borderRightColor: theme.palette.text.secondary,
            flexDirection: 'column',
            fontSize: '0.75em',
        },
        messageContent: {
            flex: '1',
        },
        visibleWhenHover: {
            position: 'absolute',
            right: 0,
        }
    }),
);

function toHumanTimestamp(dateString: string): string {
    const date = new Date(dateString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function LogbookItemInfo({message}: {message: LogEntryMessage}) {
    const classes = useStyles();
    return <div className={classes.messageInfo}>
        <div><span>{toHumanTimestamp(message.time)}</span></div>
        <div><span>Beamline User 1</span></div>
        <div><span>{message.facility}</span></div>
        <div><span>{message.beamtime}</span></div>
    </div>;
}

function LogbookItem({message}: {message: LogEntryMessage}): JSX.Element {
    const classes = useStyles();

    return <div className={classes.logItemRoot}>
        <LogbookItemInfo message={message} />
        <LogbookMarkdownViewer className={classes.messageContent} rawMarkdown={message.message} />
        <div className={`${classes.visibleWhenHover} visibleWhenHover`}><LogbookItemPopover idRef={message.id} /></div>
    </div>;
}

//const LogbookItemMemoed = React.memo(LogbookItem);

export default LogbookItem;
