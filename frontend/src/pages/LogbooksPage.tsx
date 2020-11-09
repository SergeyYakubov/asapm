import React, {createRef, useEffect, useRef, useState} from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import {useQuery} from "@apollo/client";
import {LogEntryMessage, Query, QueryCollectionsArgs} from "../generated/graphql";
import {LOG_MESSAGES} from "../graphQLSchemes";
import LogbookNewEntryCreator from "../components/Logbook/LogbookNewEntryCreator";
import LogbookSelectionTree from "../components/Logbook/LogbookSelectionTree";
import LogbookMessageLog from "../components/Logbook/LogbookMessageLog";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
            margin: theme.spacing(1),
            minWidth:0,
            display: 'flex',
        },
    }),
);

function LogbooksPage(): JSX.Element {
    const classes = useStyles();

    const queryResult = useQuery<Query, QueryCollectionsArgs>(LOG_MESSAGES, {
        pollInterval: 5000,
        //variables: {filter: GetFilterString(filter), orderBy: "id"}
    });

    const $messageLog = createRef<any>();

    const [messages, setMessages] = useState<LogEntryMessage[]>([]);
    const [currentVisibleDate, setCurrentVisibleDate] = useState('');
    useEffect(() => {
        console.log('FINDME', queryResult);
        if (queryResult.error) {
            setMessages([]);
            console.log("collection query error" + queryResult.error);
        }
        if (!queryResult.loading && queryResult.data?.logEntries?.entries) {
            const localMessages = queryResult.data!.logEntries!.entries;
            console.log('findme 2', localMessages);
            const sortedMessages = localMessages.slice().sort(((a, b) => (Number(new Date(b.time)) - Number(new Date(a.time)))));

            setMessages(sortedMessages);
        }
    }, [queryResult.error, queryResult.loading, queryResult.data]);

    const [orderBy, setOrderBy] = React.useState('datetime');

    return (
        <div className={classes.root}>
            <div style={{ flex: '1', display: 'flex' }}>
                <LogbookSelectionTree messages={messages} currentVisibleDate={currentVisibleDate} onDateSelected={(fullDate) => {
                    $messageLog.current?.scrollToGroup(fullDate);
                }} />
                <div style={{ flex: '1', display: 'flex' }}>
                    <div style={{ flex: '1', display: 'flex' }}>
                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                            <LogbookNewEntryCreator />
                            <LogbookMessageLog ref={$messageLog} messages={messages} onVisibleGroupChanged={(fullDate) => setCurrentVisibleDate(fullDate)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default LogbooksPage;
