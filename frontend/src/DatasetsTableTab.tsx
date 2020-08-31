import React, {forwardRef, useEffect} from 'react';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import {CollectionDetails, MetaDetails} from "./meta"
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import AddBox from '@material-ui/icons/AddBox';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';
import MaterialTable, {Action, MaterialTableProps, Icons} from "material-table";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import ListItem from "@material-ui/core/ListItem";
import {useHistory} from "react-router-dom";

const tableIcons: Icons = {
    Add: forwardRef((props, ref) => <AddBox {...props} ref={ref}/>),
    Check: forwardRef((props, ref) => <Check {...props} ref={ref}/>),
    Clear: forwardRef((props, ref) => <Clear {...props} ref={ref}/>),
    Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref}/>),
    DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref}/>),
    Edit: forwardRef((props, ref) => <Edit {...props} ref={ref}/>),
    Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref}/>),
    Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref}/>),
    FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref}/>),
    LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref}/>),
    NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref}/>),
    PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref}/>),
    ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref}/>),
    Search: forwardRef((props, ref) => <Search {...props} ref={ref}/>),
    SortArrow: forwardRef((props, ref) => <ArrowDownward {...props} ref={ref}/>),
    ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref}/>),
    ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref}/>)
};


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


type CustomTableProps = {
    data: object,
}


function StringFromValue(value: any): string {
    if (!value) {
        return "undefined"
    }

    if (value.constructor.name == "Object") {
        return JSON.stringify(value)
    }

    return value.toString()

}

function IsoDateToStr(isoDate: String) {
    if (typeof (isoDate) != "string") {
        return "undefined";
    }
    return (isoDate as string).slice(0, 16).replace('T', ' ');
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
        const path = "/detailedcollection/" + rowData?.id;
        history.push(path);
    }

    return <MaterialTable
        icons={tableIcons}
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
