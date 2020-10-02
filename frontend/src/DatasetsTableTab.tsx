import React from 'react';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import {CollectionDetails, MetaDetails} from "./meta"
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";

import MaterialTable from "material-table";
import {useHistory} from "react-router-dom";
import {TableIcons} from "./TableIcons";
import {IsoDateToStr} from "./common";

const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            root: {
                flexGrow: 1,
                margin: theme.spacing(1),
            },
            divider: {
                marginLeft: theme.spacing(-1),
                marginRight: theme.spacing(-1),
                margin: theme.spacing(2),
            },
            title: {
                marginTop: theme.spacing(0),
                marginBottom: theme.spacing(2),
            },
            tableTitle: {
                marginLeft: theme.spacing(2),
            },
            customDataTitle: {
                marginTop: theme.spacing(3),
                marginLeft: theme.spacing(2),
            },
            chip: {
            },
            chipRunning: {
//            backgroundColor: '#4caf50',
//            color: '#4caf50',
                borderColor: '#4caf50',
            },
            chipCompleted: {
                borderColor: '#ff8a65',
            },
            chipScheduled: {
//            backgroundColor: '#03a9f4',
                borderColor: '#03a9f4',
            },
            staticMeta: {
                flexGrow: 1,
            },
            paper: {
                paddingTop: theme.spacing(1),
                padding: theme.spacing(2),
                margin: theme.spacing(0),
                textAlign: 'center',
                color: theme.palette.text.primary,
                background: theme.palette.lightBackground.main,
                borderRadius: 0,
            },
            table: {
                '& > *': {
                    borderBottom: 'unset',
                },
            },
            displayNone: {
                display: 'none',
            },
            switch: {
                marginLeft: 'auto',
                marginRight: theme.spacing(2),
            },
            tabs: {
                borderRight: `1px solid ${theme.palette.divider}`,
            },
            tabLabel: {
                textTransform: 'none',
                alignItems: "flex-start"
            },
            tabPanel: {
                marginLeft: theme.spacing(2),
            },
        }),
);


type MetaViewProps = {
    meta: MetaDetails | CollectionDetails
}

interface TableEntry {
    id: String
    title: String
    eventStart:string
    eventEnd:string
}

interface TableData extends Array<TableEntry> {
}

function TableDataFromDataset(meta: MetaDetails | CollectionDetails): TableData {
            return meta.childCollection.map(collection => {
                    return {id: collection.id, title: collection.title,eventStart:IsoDateToStr(collection.eventStart),eventEnd:IsoDateToStr(collection.eventEnd)};
                }
            )
}

function DatasetTable({meta}: MetaViewProps) {
    const history = useHistory();
    const handleClick = (
        event?: React.MouseEvent,
        rowData?: TableEntry,
        toggleDetailPanel?: (panelIndex?: number) => void
    ) => {
        const path = "/detailedcollection/" + rowData?.id+"/meta";
        history.push(path);
    }

    return <MaterialTable
        icons={TableIcons}
        onRowClick={handleClick}
        options={{
            filtering: false,
            header: true,
            showTitle: false,
            search: true,
            paging: false,
            toolbar: true,
            draggable: false,
            minBodyHeight: "50vh",
            headerStyle: {
                fontWeight: 'bold',
            }
        }}
        columns={[
            {title: 'ID', field: 'id'},
            {title: 'Title', field: 'title'},
            {title: 'Start time', field: 'eventStart'},
            {title: 'End time', field: 'eventEnd'},
        ]}
        data={TableDataFromDataset(meta)}
    />
}

function StaticMeta({meta}: MetaViewProps) {
    const classes = useStyles();
    return <div>
        <Grid container direction="row" alignItems="stretch" spacing={1}>
            <Grid item xs={12}>
                    <Paper className={classes.paper}>
                        <DatasetTable meta={meta}/>
                    </Paper>
            </Grid>
        </Grid>
    </div>
}


function DatasetsTableTab({meta}: MetaViewProps) {
    return (
        <div>
            <StaticMeta meta={meta}/>
        </div>
    );
}


export default DatasetsTableTab;