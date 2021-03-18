import {Box, FormControl, InputLabel, MenuItem, Select} from "@material-ui/core";
import React, {ChangeEvent} from "react";
import {LogEntryMessage} from "../../../generated/graphql";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import {OrderType} from "../../../pages/LogbooksPage";
import {TreeBodyByBeamtime} from "./LogbookSelectionTreeByBeamtime";
import {TreeBodyByDatetime} from "./LogbookSelectionTreeByDatetime";

const useStyles = makeStyles(() =>
    createStyles({
        treeRoot: {
            width: '100%',
        },
    }),
);

interface LogbookSelectionTreeProps {
    messages: LogEntryMessage[];
    currentVisibleGroup: string;
    onGroupSelected: (fullDate: string) => void;
    orderBy: OrderType;
    onOrderByChanged: (newOrderType: OrderType) => void;
}

function LogbookSelectionTree({ messages, currentVisibleGroup, onGroupSelected, orderBy, onOrderByChanged }: LogbookSelectionTreeProps): JSX.Element {
    // const classes = useStyles();

    return <div style={{ minWidth: '220px', marginRight: '8px', overflowY: 'auto' }}>
        <Box style={{ marginBottom: '8px' }}>
            <FormControl fullWidth={true}>
                <InputLabel id="order-by-label">Order by</InputLabel>
                <Select
                    labelId="order-by-label"
                    id="order-by"
                    value={orderBy}
                    onChange={(e: ChangeEvent<{ value: unknown }>) => onOrderByChanged(e.target.value as OrderType)}
                >
                    <MenuItem value={'datetime'}>Datetime</MenuItem>
                    <MenuItem value={'beamtime'}>Beamtime</MenuItem>
                </Select>
            </FormControl>
        </Box>
        {
            {
            ['datetime']: <TreeBodyByDatetime messages={messages} currentVisibleGroup={currentVisibleGroup} onDateSelected={onGroupSelected} />,
            //['facility']: <TreeBodyByFacility messages={messages} currentVisibleDate={currentVisibleDate} onDateSelected={onDateSelected} />,
            ['beamtime']: <TreeBodyByBeamtime messages={messages} currentVisibleGroup={currentVisibleGroup} onGroupSelected={onGroupSelected} />,
            }[orderBy]
        }
    </div>;
}

export default LogbookSelectionTree;
