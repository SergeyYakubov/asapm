import React from "react";
import {Avatar, Chip, Link} from "@material-ui/core";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import LogbookItemPopover from "./LogbookItemPopover";
import {LogEntryMessage} from "../../generated/graphql";
import LogbookMarkdownViewer from "./LogbookMarkdownViewer";
import GetAppIcon from '@material-ui/icons/GetApp';
import {ApplicationApiBaseUrl} from "../../common";
import {lightGreen} from "@material-ui/core/colors";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        logItemRoot: {
            display: 'flex',
            flexDirection: 'column',
            paddingTop: theme.spacing(1),
            paddingBottom: theme.spacing(1),
            '&:not(:hover) $visibleWhenHover': {
                display: 'none',
            },
            '&:hover': {
                background: theme.palette.lightBackground.main,
            }
        },
        messageInfo: {
            width: '100px',
            display: 'flex',
            flexDirection: 'row',
            fontSize: '0.75em',
            color: '#878787',
        },
        messageDownloads: {
            //marginLeft: theme.spacing(4),
        },
        visibleWhenHover: {
            position: 'absolute',
            right: 0,
        },



        leftSide: {
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            paddingLeft: theme.spacing(1),
        },
        dateText: {
            display: 'block',
            fontSize: '0.5em',
            color: '#444444',
        },
        timeText: {
            fontSize: '1em',
            color: '#444444',
        },
        mainSide: {
            display: 'flex',
            flex: '1',
            flexDirection: 'column',
        },
        infoText: {
            fontSize: '0.8em',
            marginLeft: '1em',
        },
        mainContent: {
            display: 'flex',
            flex: '1',
        },
        messageContent: {
            flex: '1',
            flexDirection: 'column',
            display: 'flex',
        },
        messageContentInner: {
            flex: '1',
        },

        systemAvatarColor: {
            color: theme.palette.getContrastText(lightGreen[700]),
            backgroundColor: lightGreen[700],
        }
    }),
);

function toHumanTimestamp(dateString: string): string {
    const date = new Date(dateString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    // :${String(date.getSeconds()).padStart(2, '0')}`;
}

function toHumanDate(dateString: string): string {
    const date = new Date(dateString);
    return `${String(date.getDay()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
}

function LogbookItem({message, displayDate}: {message: LogEntryMessage, displayDate?: boolean}): JSX.Element {
    const classes = useStyles();

    return <div className={classes.logItemRoot}>
        <div className={classes.mainContent}>
            <div className={classes.leftSide}>
                <div title={message.time}>
                    { displayDate && <span className={classes.dateText}>{ toHumanDate(message.time) }</span> }
                    <span className={classes.timeText}>{toHumanTimestamp(message.time)}</span>
                </div>
                {
                    message.createdBy === 'System'
                        ? <Avatar className={classes.systemAvatarColor}>S</Avatar>
                        : <Avatar/>
                }
            </div>
            <div className={classes.mainSide}>
                <div className={classes.infoText}><span>{message.createdBy}</span>{ message.source && <span> @ Source '{message.source}'</span> }<span> @ {message.facility}</span>{ message.beamtime && <span> @ Beamtime {message.beamtime}{ message.subCollection && `.${message.subCollection}` }</span> }</div>
                <div className={classes.messageContent}>
                    <LogbookMarkdownViewer className={classes.messageContentInner} rawMarkdown={message.message} />
                </div>

                <div className={classes.messageDownloads}>
                    {message.attachments && Object.entries(message.attachments).map(([name, fileId]) =>
                        <Link key={name} download={name} href={`${ApplicationApiBaseUrl}/attachments/raw/${fileId}`}>
                            <Chip
                                color="primary"
                                size="small"
                                icon={<GetAppIcon/>}
                                label={name}
                            />
                        </Link>
                    )}
                </div>
            </div>
        </div>
        <div className={`${classes.visibleWhenHover}`}><LogbookItemPopover idRef={message.id} /></div>
    </div>;
}

//const LogbookItemMemoed = React.memo(LogbookItem);

export default LogbookItem;
