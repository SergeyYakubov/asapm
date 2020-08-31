import React, {forwardRef, useEffect} from 'react';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
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

import {TableEntry, TableData, TableFromData} from "./common"
import {CollectionDetails, MetaDetails} from "./meta";

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

type StaticMetaProps = {
    meta: MetaDetails | CollectionDetails
    isBeamtime: boolean
    tableFromMeta: TableFromData,
}


type StaticSectionProps = {
    meta: MetaDetails | CollectionDetails
    tableFromMeta: TableFromData
    section: string
    isBeamtime:boolean
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

function OnRowClick(event?: React.MouseEvent, rowData?: TableEntry, toggleDetailPanel?: (panelIndex?: number) => void) {
    console.log(typeof rowData!.data)
    if (!rowData!.data) {
        return {};
    }
    return toggleDetailPanel ? toggleDetailPanel() : {};
}

function Table({meta, section,tableFromMeta}: StaticSectionProps) {
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
        data={tableFromMeta(meta, section)}
        detailPanel={[TableFromObject]}
        onRowClick={OnRowClick}
    />
}


function plainDataFromObject(plainData: TableData, data:object,root:string) {
    for (const [key, value] of Object.entries(data)) {
        const fullKey = (root !== "" ? root+"." : "")+key
        if (value.constructor.name === "Object") {
            plainDataFromObject(plainData,value,fullKey)
        } else {
            plainData.push({name:fullKey,value:value.toString()})
        }
    }
}

function CustomTable({data}: CustomTableProps) {
    let plainData: TableData=[]
    plainDataFromObject(plainData,data,"")
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
        data={plainData}
        onRowClick={OnRowClick}
    />
}

function StaticSection({meta, section,tableFromMeta, isBeamtime}: StaticSectionProps) {
    const classes = useStyles();
    return  <Grid
        container
        direction="column"
        justify="center"
        alignItems="stretch"
    >
        <Grid  item xs={12}>
            <Typography variant="overline" align="center" className={classes.tableTitle}>
                {section}
            </Typography>
        </Grid>
        <Grid  item xs={12}>
            <Paper className={classes.paper}>
        <Table meta={meta} tableFromMeta={tableFromMeta} section={section} isBeamtime={isBeamtime}/>
        </Paper>
        </Grid>
    </Grid>
}

function replacer(key: string, value: any) {
    if (key === '__typename') {
        return undefined;
    }
    return value;
}


function StaticMeta({meta,tableFromMeta,isBeamtime}: StaticMetaProps) {
    return <div>
        {isBeamtime?
        <Grid container direction="row" alignItems="stretch" spacing={1}>
            <Grid item xs={12} sm={12} md={4}>
                <StaticSection meta={meta} tableFromMeta={tableFromMeta} isBeamtime={isBeamtime} section="Beamtime"/>
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
                <StaticSection meta={meta}  tableFromMeta={tableFromMeta} isBeamtime={isBeamtime} section="Proposal"/>
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
                <StaticSection meta={meta}  tableFromMeta={tableFromMeta} isBeamtime={isBeamtime} section="Analysis"/>
            </Grid>
        </Grid>
            :
            <Grid container direction="row" alignItems="stretch" spacing={1}>
                <Grid item xs={12}>
                    <StaticSection meta={meta} tableFromMeta={tableFromMeta} isBeamtime={isBeamtime} section="General"/>
                </Grid>
            </Grid>
        }
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

function CategorizedMeta({meta}: MetaViewProps) {
    const classes = useStyles();

    const [tabValue, setTabValue] = React.useState(0);

    const handleTabChange = (event: React.ChangeEvent<{}>, newTabValue: number) => {
        setTabValue(newTabValue);
    };

    let customCategories: { [k: string]: any } = {};
    let mainCategory: { [k: string]: any } = {};
    let isMainCategory = false;
    for (const [key, value] of Object.entries(meta.customValues)) {
        if (value.constructor.name == "Object") {
            customCategories[key] = value;
        } else {
            isMainCategory = true;
            mainCategory[key] = value;
        }
    }


    let n = 0;
    return <Grid container>
    <Grid item xs={2}>
        <Tabs
            orientation="vertical"
            variant="scrollable"
            value={tabValue}
            onChange={handleTabChange}
            aria-label="Vertical tabs example"
            className={classes.tabs}
        >
            {isMainCategory &&
            <Tab classes={{wrapper: classes.tabLabel}} label="general" {...a11yProps(0)}/>
            }
            {
                Object.entries(customCategories).map(([key, value]) =>
                    <Tab classes={{wrapper: classes.tabLabel}} label={key} {...a11yProps(1)} key={key}/>
                )
            }
        </Tabs>
    </Grid>
    <Grid item xs={10}>
        {isMainCategory &&
        <TabPanel value={tabValue} index={n++} className={classes.tabPanel} key={4}>
            <CustomTable data={mainCategory}/>
        </TabPanel>
        }
        {
            Object.entries(customCategories).map(([key, value]) =>
                <TabPanel value={tabValue} index={n++} className={classes.tabPanel} key={n}>
                    <CustomTable data={value}/>
                </TabPanel>
            )
        }
    </Grid>
    </Grid>
}

function PlainMeta({meta}: MetaViewProps) {
    return <Grid container>
        <Grid item xs={12}>
            <CustomTable data={meta.customValues}/>
        </Grid>
    </Grid>
}

function CustomMeta({meta}: MetaViewProps) {
    const classes = useStyles();
    const [plainView, setPlainView] = React.useState(false);


    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPlainView(event.target.checked);
    };

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
            {plainView
            ? <PlainMeta meta={meta}/>
            : <CategorizedMeta meta={meta}/>
            }
        </Paper>
    </div>
}

function DetailedMetaTab({meta,tableFromMeta,isBeamtime}: StaticMetaProps) {
    return (
                <div>
                    <StaticMeta meta={meta} tableFromMeta={tableFromMeta} isBeamtime={isBeamtime}/>
                    { meta.customValues &&
                        <CustomMeta meta={meta}/>
                    }
                </div>
    );
}


export default DetailedMetaTab;
