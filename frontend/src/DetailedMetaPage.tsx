import React, {forwardRef, useEffect} from 'react';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import {RouteComponentProps} from "react-router-dom";
import {METAS_DETAILED, Status, MetaDataDetails, MetaDetails} from "./graphQLTypes"
import {useQuery} from "@apollo/react-hooks";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import {Divider} from "@material-ui/core";
import Chip from '@material-ui/core/Chip';
import Paper from "@material-ui/core/Paper";
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import Collapse from '@material-ui/core/Collapse';
import clsx from "clsx";
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';

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
import {UnfoldLess, UnfoldMore} from "@material-ui/icons";

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
                marginTop: theme.spacing(-2),
                marginBottom: theme.spacing(2),
            },
            tableTitle: {
                marginLeft: theme.spacing(2),
            },
            chip: {
                marginTop: theme.spacing(-2),
                marginBottom: theme.spacing(2),
                marginLeft: theme.spacing(4),
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
            }
        }),
);

type TParams = { id: string };

type DetailedHeaderProps = {
    meta: MetaDetails,
}

type StaticSectionProps = {
    meta: MetaDetails,
    section: string,
}

function StringFromValue(value: any):string {
    if (!value) {
        return "undefined"
    }
    if (typeof(value) === "object") {
        return JSON.stringify(value)
    }
    return value.toString()
}

function TableFromObject(rowData: TableEntry) {
    const disabled = !rowData.data;
    return {
        disabled: disabled,
        icon: () => <KeyboardArrowRightIcon style={disabled ? {display: 'none'} : {}}/>,
        openIcon: KeyboardArrowUpIcon,
        render: () => {
            return <MaterialTable
                icons={tableIcons}
                style={{paddingLeft: '60px',paddingBottom: '1vw',boxShadow: 'none'}}
                options={{
                    filtering: false,
                    header: false,
                    showTitle: false,
                    search: false,
                    paging: false,
                    toolbar: false,
                    draggable: false,
                    tableLayout: "fixed",
                }}
                columns={[
                    {title: 'Name', field: 'name'},
                    {title: 'Value', field: 'value'},
                ]}
                data={Object.entries(rowData.data!).filter(([key, value]) => (key != "__typename")).map(([key, value]) => ({
                    name: key,
                    value: StringFromValue(value),
                }))}
            />
        }
    }
}

function DetailedHeader({meta}: DetailedHeaderProps) {
    const classes = useStyles();
    return (
        <div>
            <Grid container spacing={0}>
                <Grid item xs={12}>
                    <Typography variant="h6">
                        Detailed View
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Box display="flex" justifyContent="center" alignItems="flex-end">
                        <Typography variant="h4" align="center" className={classes.title}>
                            {meta.title}
                        </Typography>
                        <Chip label={meta.status} variant="outlined" className={clsx(classes.chip, {
                            [classes.chipRunning]: meta.status == 'Running',
                            [classes.chipCompleted]: meta.status == 'Completed',
                            [classes.chipScheduled]: meta.status == 'Scheduled',
                        })}/>
                    </Box>
                </Grid>
            </Grid>
            <Divider className={classes.divider}/>
        </div>
    );
}

function IsoDateToStr(isoDate: String) {
    if (typeof (isoDate) != "string") {
        return "undefined";
    }
    return (isoDate as string).slice(0, 16).replace('T', ' ');
}

interface TableEntry {
    name: string
    value: string
    data?: any
}

interface TableData extends Array<TableEntry> {
}

function TableDataFromMeta(meta: MetaDetails, section: string): TableData {
    switch (section) {
        case "Beamtime":
            return [
                {name: 'Beamtime ID', value: meta.beamtimeId as string},
                {name: 'Facility', value: meta.facility as string},
                {name: 'Beamline', value: meta.beamline as string},
                {name: 'Generated', value: IsoDateToStr(meta.generated)},
                {name: 'Start', value: IsoDateToStr(meta.eventStart)},
                {name: 'End', value: IsoDateToStr(meta.eventEnd)},
            ]
        case "Proposal":
            return [
                {name: 'Proposal ID', value: meta.proposalId as string},
                {name: 'Type', value: meta.proposalType as string},
                {name: 'Principal Investigator', value: meta.pi.lastname as string, data: meta.pi},
                {name: 'Leader', value: meta.leader.lastname as string, data: meta.leader},
                {name: 'Applicant', value: meta.applicant.lastname as string, data: meta.applicant},
            ]
        case "Analysis":
            return [
                {name: 'Core path', value: meta.corePath as string},
                {name: 'Online', value: meta.onlineAnalysis?"Requested":"Not requested", data: meta.onlineAnalysis},
            ]
    }
    return [];
}

function OnRowClick(event?: React.MouseEvent, rowData?: TableEntry, toggleDetailPanel?: (panelIndex?: number) => void) {
    console.log(typeof rowData!.data)
    if (!rowData!.data) {
        return {};
    }
    return toggleDetailPanel ? toggleDetailPanel() : {};
}

function StaticSection({meta, section}: StaticSectionProps) {
    const classes = useStyles();
    return <Paper className={classes.paper}>
        <MaterialTable
            icons={tableIcons}
            options={{
                filtering: false,
                header: false,
                showTitle: false,
                search: false,
                paging: false,
                toolbar: false,
                draggable: false,
                minBodyHeight: "50vh",
            }}
            columns={[
                {title: 'Name', field: 'name'},
                {title: 'Value', field: 'value'},
            ]}
            data={TableDataFromMeta(meta, section)}
            detailPanel={[TableFromObject]}
            onRowClick={OnRowClick}
        />
    </Paper>
}


function StaticMeta({meta}: DetailedHeaderProps) {
    const classes = useStyles();
    return <div>
        <Grid container spacing={1}>
            <Grid item xs>
                <Typography variant="overline" align="center" className={classes.tableTitle}>
                    Beamtime
                </Typography>
            </Grid>
            <Grid item xs>
                <Typography variant="overline" align="center" className={classes.tableTitle}>
                    Proposal
                </Typography>
            </Grid>
            <Grid item xs>
                <Typography variant="overline" align="center" className={classes.tableTitle}>
                    Analysis
                </Typography>
            </Grid>
        </Grid>
        <Grid container direction="row" alignItems="stretch" spacing={1}>
            <Grid item xs={4}>
                <StaticSection meta={meta} section={"Beamtime"}/>
            </Grid>
            <Grid item xs={4}>
                <StaticSection meta={meta} section={"Proposal"}/>
            </Grid>
            <Grid item xs={4}>
                <StaticSection meta={meta} section={"Analysis"}/>
            </Grid>
        </Grid>
    </div>
}

interface DetailedMetaProps extends RouteComponentProps<TParams> {
    SetActiveBeamtime: React.Dispatch<React.SetStateAction<string>>,
}

function DetailedMeta({match, SetActiveBeamtime}: DetailedMetaProps) {
    const classes = useStyles();
    useEffect(() => {
        SetActiveBeamtime(match.params.id);
    });

    const queryResult = useQuery<MetaDataDetails>(METAS_DETAILED,
        {variables: {filter: "beamtimeId = '" + match.params.id + "'"}});
    if (queryResult.error) {
        console.log(queryResult.error)
        return (
            <div className={classes.root}>
                <Toolbar variant="dense"/>
                <Typography variant="h3">
                    server error, please try later
                </Typography>
            </div>
        );
    }
    if (queryResult.loading) {
        return (
            <div className={classes.root}>
                <Toolbar variant="dense"/>
                <Typography variant="h3">
                    loading ...
                </Typography>
            </div>
        );
    }
    if (queryResult.data!.meta.length != 1) {
        return (
            <div className={classes.root}>
                <Toolbar variant="dense"/>
                <Typography variant="h3">
                    no data found
                </Typography>
            </div>
        );
    }
    return (
        <div className={classes.root}>
            <Toolbar variant="dense"/>
            <DetailedHeader meta={queryResult.data!.meta[0]}/>
            <StaticMeta meta={queryResult.data!.meta[0]}/>
        </div>
    );
}


export default DetailedMeta;
