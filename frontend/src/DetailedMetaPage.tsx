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
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Container from '@material-ui/core/Container';

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
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

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
            customDataTitle: {
                marginTop: theme.spacing(3),
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

type TParams = { id: string };

type DetailedHeaderProps = {
    meta: MetaDetails,
    rawView: boolean,
    setRawView: React.Dispatch<React.SetStateAction<boolean>>
}


type MetaViewProps = {
    meta: MetaDetails
}

type StaticSectionProps = {
    meta: MetaDetails,
    section: string,
}

type CustomTableProps = {
    data: string[] | object,
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

function TableFromObject(rowData: TableEntry) {
    const disabled = !rowData.data;
    return {
        disabled: disabled,
        icon: () => <KeyboardArrowRightIcon style={disabled ? {display: 'none'} : {}}/>,
        openIcon: KeyboardArrowUpIcon,
        render: () => {
            return <MaterialTable
                icons={tableIcons}
                style={{paddingLeft: '60px', paddingBottom: '1vw', boxShadow: 'none'}}
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

function DetailedHeader({meta, rawView, setRawView}: DetailedHeaderProps) {
    const classes = useStyles();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRawView(event.target.checked);
    };

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
            <Grid container justify="flex-end">
                <FormControlLabel
                    control={
                        <Switch
                            checked={rawView}
                            onChange={handleChange}
                            name="checked"
                            color="primary"
                            size="small"
                        />
                    }
                    label="Raw JSON"
                />
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
                {name: 'Online', value: meta.onlineAnalysis ? "Requested" : "Not requested", data: meta.onlineAnalysis},
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

function Table({meta, section}: StaticSectionProps) {
    return <MaterialTable
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
}

function CustomTable({data}: CustomTableProps) {
    return <MaterialTable
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

        data={Object.entries(data).map(([key, value]) => ({
            name: key,
            value: StringFromValue(value),
        }))}
        onRowClick={OnRowClick}
    />
}


function StaticSection({meta, section}: StaticSectionProps) {
    const classes = useStyles();
    return <Paper className={classes.paper}>
        <Table meta={meta} section={section}/>
    </Paper>
}

function replacer(key: string, value: any) {
    if (key === '__typename') {
        return undefined;
    }
    return value;
}

function RawMeta({meta}: MetaViewProps) {
    return <div>
        <pre id="json">
            {
                JSON.stringify(meta, replacer, '\t')
            }
        </pre>
    </div>
}


function StaticMeta({meta}: MetaViewProps) {
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


function a11yProps(index: any) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}


interface TabPanelProps {
    children?: React.ReactNode;
    index: any;
    value: any;
    className?: any;
}

function TabPanel(props: TabPanelProps) {
    const {children, value, index, ...other} = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {value === index && (
                children
            )}
        </div>
    );
}


function CustomMeta({meta}: MetaViewProps) {
    const classes = useStyles();
    const [plainView, setPlainView] = React.useState(false);
    const [tabValue, setTabValue] = React.useState(0);

    const handleTabChange = (event: React.ChangeEvent<{}>, newTabValue: number) => {
        setTabValue(newTabValue);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPlainView(event.target.checked);
    };

    let customCategories: {[k: string]: any} = {};
    let mainCategory: {[k: string]: any} = {};
    let isMainCategory = false;
    for (const [key, value] of Object.entries(meta.customValues)) {
        if (value.constructor.name == "Object") {
            customCategories[key]=value;
        }
        else {
            isMainCategory = true;
            mainCategory[key] = value;
        }
    }

    let n=0;
    return <div>
        <Grid container alignItems={'baseline'}>
            <Typography variant="overline" align="center" className={classes.customDataTitle}>
                Custom Metadata
            </Typography>
            <FormControlLabel
                className={classes.switch}
                control={
                    <Switch
                        checked={plainView}
                        name="checked"
                        onChange={handleChange}
                        color="primary"
                        size="small"
                    />
                }
                label="Plain View"
            />
        </Grid>
        <Paper className={classes.paper}>
        <Grid container>
            <Grid item xs={2}>
                <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="Vertical tabs example"
                    className={classes.tabs}
                >
                    { isMainCategory &&
                        <Tab classes={{wrapper: classes.tabLabel}} label="general" {...a11yProps(0)}/>
                    }
                    {

                        Object.entries(customCategories).map(([key, value]) =>
                        <Tab classes={{wrapper: classes.tabLabel}} label={key} {...a11yProps(1)} />
                        )
                    }
                </Tabs>
            </Grid>
            <Grid item xs={10}>
                { isMainCategory &&
                <TabPanel value={tabValue} index={n++} className={classes.tabPanel}>
                    <CustomTable data={mainCategory} />
                </TabPanel>
                }

                {
                    Object.entries(customCategories).map(([key, value]) =>
                    <TabPanel value={tabValue} index={n++} className={classes.tabPanel}>
                        <CustomTable data={value}/>
                    </TabPanel>
                )
                }

            </Grid>
        </Grid>
        </Paper>
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

    const [rawView, setRawView] = React.useState(false);


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
            <DetailedHeader meta={queryResult.data!.meta[0]} rawView={rawView} setRawView={setRawView}/>
            {rawView ? (
                <RawMeta meta={queryResult.data!.meta[0]}/>
            ) : (
                <div>
                    <StaticMeta meta={queryResult.data!.meta[0]}/>
                    <CustomMeta meta={queryResult.data!.meta[0]}/>
                </div>
            )}
        </div>
    );
}


export default DetailedMeta;
