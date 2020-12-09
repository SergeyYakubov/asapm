import React, {createRef, useEffect, useState} from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import {useQuery} from "@apollo/client";
import {
    BeamtimeMeta,
    LogEntryMessage,
    Query
} from "../generated/graphql";
import {LOG_MESSAGES} from "../graphQLSchemes";
import LogbookNewEntryCreator from "../components/Logbook/LogbookNewEntryCreator";
import LogbookSelectionTree from "../components/Logbook/LogbookSelectionTree";
import LogbookMessageLog from "../components/Logbook/LogbookMessageLog";
import LogbookFilter from "../components/Logbook/LogbookFilter";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        logbookPageRoot: {
            flexGrow: 1,
            margin: theme.spacing(1),
            minWidth:0,
            display: 'flex',
        },
    }),
);


interface LogbooksPageProps {
    prefilledBeamtimeId?: BeamtimeMeta['id'];
}

function LogbooksPage(props: LogbooksPageProps): JSX.Element {
    const classes = useStyles();

    const queryResult = useQuery<Query, { filter: string }>(LOG_MESSAGES, {
        pollInterval: 5000,
        variables: {filter: props.prefilledBeamtimeId ? `beamtime="${props.prefilledBeamtimeId}"`: ''}//GetFilterString(filter), orderBy: "id"
    });

    const $messageLog = createRef<any>();

    const [messages, setMessages] = useState<LogEntryMessage[]>([]);
    const [currentVisibleDate, setCurrentVisibleDate] = useState('');

    useEffect(() => {
        if (queryResult.error) {
            setMessages([]);
            console.log("collection query error" + queryResult.error);
        }
        if (!queryResult.loading) {
            if (queryResult.data?.logEntries?.entries) {
                const localMessages = queryResult.data!.logEntries!.entries;
                const sortedMessages = localMessages.slice().sort(((a, b) => (Number(new Date(b.time)) - Number(new Date(a.time)))));

                console.log('setMessages', sortedMessages);
                setMessages(sortedMessages);
            }
        }


    }, [queryResult.error, queryResult.loading, queryResult.data]);


    const hasPrefilledCondition = !!props.prefilledBeamtimeId;

    //const [orderBy, setOrderBy] = React.useState('datetime');

    return <div className={classes.logbookPageRoot}>
            <div style={{ flex: '1', display: 'flex' }}>
                { hasPrefilledCondition ? null :
                    <LogbookSelectionTree messages={messages} currentVisibleDate={currentVisibleDate} onDateSelected={(fullDate) => {
                        $messageLog.current?.scrollToGroup(fullDate);
                    }} />
                }
                <div style={{ flex: '1', display: 'flex' }}>
                    <div style={{ flex: '1', display: 'flex' }}>
                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                            <LogbookNewEntryCreator prefilledBeamtime={props.prefilledBeamtimeId} />
                            <LogbookFilter />
                            <LogbookMessageLog ref={$messageLog} messages={messages} onVisibleGroupChanged={(fullDate) => setCurrentVisibleDate(fullDate)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>;
}


export default LogbooksPage;
