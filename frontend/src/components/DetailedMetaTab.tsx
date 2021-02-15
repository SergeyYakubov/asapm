import React, {forwardRef, useRef, useState} from "react";
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import MaterialTable from "material-table";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import {TableEntry, TableData, TableFromData} from "../common";
import {TableIcons} from "../TableIcons";
import {BeamtimeMeta, CollectionEntry, Query} from "../generated/graphql";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import Fab from "@material-ui/core/Fab";
import AddBox from "@material-ui/icons/AddBox";
import { client } from"../index";
import {DELETE_ENTRY_FIELDS} from "../graphQLSchemes";
import {QueryResult} from "@apollo/client";

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
    originalQuery: QueryResult<Query>
    meta: BeamtimeMeta | CollectionEntry
}

type StaticMetaProps = {
    originalQuery: QueryResult<Query>
    meta: BeamtimeMeta | CollectionEntry
    isBeamtime: boolean
    tableFromMeta: TableFromData,
}


type StaticSectionProps = {
    meta: BeamtimeMeta | CollectionEntry
    tableFromMeta: TableFromData
    section: string
    isBeamtime:boolean
}

type CustomTableProps = {
    originalQuery: QueryResult<Query>
    suffix: string
    id: string
    data: KvObj,
}


function StringFromValue(value: any): string {
    if (!value) {
        return "";
    }

    if (value.constructor.name === "Object") {
        return JSON.stringify(value);
    }

    if (value.constructor.name === "Array") {
        return value.join(", ");
    }

    return value.toString();

}

function TableFromObject(rowData: TableEntry) {
    const disabled = !rowData.data;
    return {
        disabled: disabled,
        icon: () => <KeyboardArrowRightIcon style={disabled ? {display: 'none'} : {}}/>,
        openIcon: KeyboardArrowUpIcon,
        render: () => {
            return <MaterialTable
                icons={TableIcons}
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
                data={Object.entries(rowData.data!).filter(([key]) => (key !== "__typename")).map(([key, value]) => ({
                    name: key,
                    value: StringFromValue(value),
                }))}
            />;
        }
    };
}

function OnRowClick(event?: React.MouseEvent, rowData?: TableEntry, toggleDetailPanel?: (panelIndex?: number) => void) {
    if (!rowData!.data) {
        return {};
    }
    return toggleDetailPanel ? toggleDetailPanel() : {};
}

function Table({meta, section,tableFromMeta}: StaticSectionProps) {
    return <MaterialTable
        icons={TableIcons}
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
    />;
}


function plainDataFromObject(plainData: TableData, data: KvObj, root: string) {
    for (const [key, value] of Object.entries(data)) {
        const fullKey = (root !== "" ? root+"." : "")+key;
        if (value.constructor.name === "Object") {
            plainDataFromObject(plainData, value, fullKey);
        } else {
            plainData.push({name: fullKey, value: StringFromValue(value)});
        }
    }
}

function CustomTable({originalQuery,suffix,id,data}: CustomTableProps) {
    const plainData: TableData=[];
    plainDataFromObject(plainData,data,"");

    return <MaterialTable
        editable={{
//            onRowUpdate: (newData, oldData) =>
//                client.mutate().then(),
            onRowDelete: oldData =>  {
                return client.mutate({
                    mutation: DELETE_ENTRY_FIELDS,
                    variables: { id: id, fields: [suffix+"."+oldData.name] },
                }).then((response)=> {
                    originalQuery.refetch();
                }).catch((err)=>console.log(err))},
            onRowAddCancelled: rowData => console.log('Row adding cancelled'),
            onRowAdd: newData =>
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        /* setData([...data, newData]); */
                        resolve();
                    }, 1000);
                }),
        }}
        icons={{
            ...TableIcons, Add: forwardRef((props, ref) => (
                    <AddCircleIcon  data-mycustomid={"add-icon-handler"} color={'secondary'}/>
            ))
        }}
        options={{
            filtering: false,
            header: false,
            showTitle: false,
            search: false,
            paging: false,
            toolbar: true,
            draggable: false,
            minBodyHeight: "50vh",
            actionsColumnIndex: -1,
        }}
        columns={[
            {title: 'Name', field: 'name', editable:'onAdd'},
            {title: 'Value', field: 'value', editable:'always'},
        ]}
        data={plainData}
        onRowClick={OnRowClick}
    />;
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
    </Grid>;
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
    </div>;
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

function CategorizedMeta({originalQuery, meta}: MetaViewProps): JSX.Element {
    const classes = useStyles();

    const [tabValue, setTabValue] = React.useState(0);

    const handleTabChange = (event: React.ChangeEvent<any>, newTabValue: number) => {
        setTabValue(newTabValue);
    };

    const customCategories: { [k: string]: any } = {};
    const mainCategory: { [k: string]: any } = {};
    let isMainCategory = false;
    for (const [key, value] of Object.entries(meta.customValues as KvObj)) {
        if (value.constructor.name === "Object") {
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
                Object.entries(customCategories).map(([key]) =>
                    <Tab classes={{wrapper: classes.tabLabel}} label={key} {...a11yProps(1)} key={key}/>
                )
            }
        </Tabs>
    </Grid>
    <Grid item xs={10}>
        {isMainCategory &&
        <TabPanel value={tabValue} index={n++} className={classes.tabPanel} key={4}>
            <CustomTable originalQuery={originalQuery} suffix={"customValues"} id={meta.id} data={mainCategory}/>
        </TabPanel>
        }
        {
            Object.entries(customCategories).map(([key,value]) =>
                <TabPanel value={tabValue} index={n++} className={classes.tabPanel} key={n}>
                    <CustomTable originalQuery={originalQuery}  suffix={"customValues."+key} id={meta.id} data={value}/>
                </TabPanel>
            )
        }
    </Grid>
    </Grid>;
}

function PlainMeta({originalQuery, meta}: MetaViewProps) {
    return <Grid container>
        <Grid item xs={12}>
            <CustomTable originalQuery={originalQuery} suffix={"customValues"} id={meta.id} data={meta.customValues as KvObj}/>
        </Grid>
    </Grid>;
}

function CustomMeta({originalQuery,meta}: MetaViewProps) {
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
            ? <PlainMeta originalQuery={originalQuery} meta={meta}/>
            : <CategorizedMeta originalQuery={originalQuery} meta={meta}/>
            }
        </Paper>
    </div>;
}

function DetailedMetaTab({originalQuery, meta,tableFromMeta,isBeamtime}: StaticMetaProps): JSX.Element {
    return (
                <div>
                    <StaticMeta originalQuery={originalQuery} meta={meta} tableFromMeta={tableFromMeta} isBeamtime={isBeamtime}/>
                    { meta.customValues &&
                        <CustomMeta originalQuery={originalQuery} meta={meta}/>
                    }
                </div>
    );
}


export default DetailedMetaTab;
