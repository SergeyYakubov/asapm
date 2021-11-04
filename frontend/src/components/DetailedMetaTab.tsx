import React, {forwardRef, useState} from "react";
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import MaterialTable, {EditComponentProps} from "material-table";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import {TableEntry, TableData, TableFromData, ApplicationApiBaseUrl} from "../common";
import {TableIcons} from "../TableIcons";
import {BeamtimeMeta, CollectionEntry, Query} from "../generated/graphql";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import {client} from "../index";
import {DELETE_ENTRY_FIELDS, ADD_ENTRY_FIELDS, UPDATE_ENTRY_FIELDS} from "../graphQLSchemes";
import {QueryResult} from "@apollo/client";
import {FormControl, InputLabel, MenuItem, Select, TextField} from "@material-ui/core";
import ImageList from "@material-ui/core/ImageList";
import ImageListItem from "@material-ui/core/ImageListItem";

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
            typedField: {
                marginLeft: theme.spacing(2),
                marginRight: theme.spacing(1),
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
            chip: {},
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
            imageList: {
                flexWrap: 'nowrap',
                // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
                transform: 'translateZ(0)',
            },
            image: {
                height: '100%',
                width: '100%',
                objectFit: 'contain',
            },
            imageBox: {
                justifyContent: 'space-around',
                overflow: 'hidden',
                backgroundColor: theme.palette.background.paper,
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
    isBeamtime: boolean
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

function Table({meta, section, tableFromMeta}: StaticSectionProps) {
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
    if (!data) {
        return;
    }
    for (const [key, value] of Object.entries(data)) {
        const fullKey = (root !== "" ? root + "." : "") + key;
        if (value.constructor.name === "Object") {
            plainDataFromObject(plainData, value, fullKey);
        } else {
            plainData.push({name: fullKey, value: StringFromValue(value), data: value});
        }
    }
}

type TypedInputProps = {
    props: EditComponentProps<TableEntry>
}

function ValueType(val: any): string {
    const res: string = typeof (val);
    switch (res) {
        case "number":
        case "string":
            return res;
        case "object":
            if (Array.isArray(val) && Array.from(val).length > 0) {
                if (ValueType(Array.from(val)[0]) == "string") {
                    return "slist";
                } else {
                    return "nlist";
                }
            } else {
                return "string";
            }
        default:
            return "string";
    }
}

function rowDataFromTypedInput(name: string, valueType: string, value: string): [TableEntry, string] {
    const entry: TableEntry = {
        name: name,
        data: value,
        value: value
    };
    switch (valueType) {
        case "string":
            return [entry, ""];
        case "number":
            const num = Number(value);
            if (isNaN(num)) {
                return [entry, "input number"];
            }
            entry.data = num;
            return [entry, ""];
        case "slist":
            let arr = value?value.split(','):[];
            arr = arr.map(val => val.trim()).filter(val => val!=="");
            entry.data = arr; 
            return [entry, ""];
        case "nlist":
            let arrS = value?value.split(','):[];
            arrS = arrS.map(val => val.trim()).filter(val => val!=="");
            const arrN : number[]=[];
            for (const elem of arrS){
                const n = Number(elem);
                if (isNaN(n)) {
                    return [entry, "list should be numerical"];
                }
                arrN.push(n);
            }
            entry.data = arrN;
            return [entry, ""];
    }
    return [entry, "wrong type"];
}

function updateRowValue(error:string, setError: React.Dispatch<React.SetStateAction<string>>, valueType: string, value: string, props: EditComponentProps<TableEntry>) {
    const [data, err] = rowDataFromTypedInput(props.rowData.name, valueType, value);
    if (err !== "") {
        setError(err);
        data.value = "";
    } else {
        if (error !== "") {
            setError("");
        }
    }
    props.onRowDataChange(data);
}

function TypedInput({props}: TypedInputProps) {
    const classes = useStyles();
    const [valueType, setValueType] = React.useState(ValueType(props.rowData.data));
    const [value, setValue] = React.useState(props.rowData.value);
    const [error, setError] = React.useState('');

    const handleSelectChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        const valType = event.target.value as string;
        updateRowValue(error, setError, valType, value, props);
        setValueType(valType);
    };

    const handleValueChange = (e: React.ChangeEvent<{ value: unknown }>) => {
        const stringVal = e.target.value as string;
        updateRowValue(error, setError, valueType, stringVal, props);
        setValue(stringVal);
    };

    return <div>
        <TextField id="standard-basic"
                   label="Value"
                   value={value || ''}
                   onChange={handleValueChange}
                   error={error !== ""}
                   helperText={
                       error
                   }
        />
        <FormControl className={classes.typedField} disabled={value!==undefined}>
            <InputLabel>Type</InputLabel>
            <Select
                value={valueType}
                onChange={handleSelectChange}>
                <MenuItem value={"string"}>String</MenuItem>
                <MenuItem value={"number"}>Number</MenuItem>
                <MenuItem value={"slist"}>String List</MenuItem>
                <MenuItem value={"nlist"}>Numerical List</MenuItem>
            </Select>
        </FormControl>
    </div>;
}


function CustomTable({suffix, id, data}: CustomTableProps) {
    const [plainData, setPlainData] = useState(() => {
        const pd: TableData = [];
        plainDataFromObject(pd, data, "");
        return pd;
    });

    React.useEffect(() => {
        const pd: TableData = [];
        plainDataFromObject(pd, data, "");
        setPlainData(pd);
    }, [data]);


    return <MaterialTable
        editable={{
            onRowUpdate: (newData) =>
                new Promise((resolve, reject) => {
                    if (newData.value === "") {
                        reject();
                        return;
                    }
                    const obj: { [k: string]: any } = {};
                    obj[suffix + "." + newData.name] = newData.data;
                    newData.value = StringFromValue(newData.data);
                    return client.mutate({
                        mutation: UPDATE_ENTRY_FIELDS,
                        variables: {id: id, fields: obj},
                    }).then(() => {
                        setPlainData(plainData.map((item) => item.name === newData.name ? newData : item));
                        resolve(null);
                    }).catch((err) => {
                            reject();
                            console.log(err);
                        }
                    );
                }),
            onRowDelete: oldData => {
                let fields = [suffix + "." + oldData.name];
                if (plainData.length === 1 && suffix !== "customValues") {
                    fields = [suffix]; // we remove the whole section since it will be empty otherwise
                }
                return client.mutate({
                    mutation: DELETE_ENTRY_FIELDS,
                    variables: {id: id, fields: fields},
                }).then(() => {
                    setPlainData(plainData.filter(item => item.name !== oldData.name));
                }).catch((err) => console.log(err));
            },
            onRowAdd: (newData) =>
                new Promise((resolve, reject) => {
                    if (newData.value === "") {
                        reject();
                        return;
                    }
                    const obj: { [k: string]: any } = {};
                    obj[suffix + "." + newData.name] = newData.data;
                    newData.value = StringFromValue(newData.data);
                    return client.mutate({
                        mutation: ADD_ENTRY_FIELDS,
                        variables: {id: id, fields: obj},
                    }).then(() => {
                        setPlainData([...plainData,newData]);
//                        originalQuery.refetch();
                        resolve(null);
                    }).catch((err) => {
                            reject();
                            console.log(err);
                        }
                    );
                }),
        }}
        icons={{
            ...TableIcons, Add: forwardRef(() => (
                <AddCircleIcon data-mycustomid={"add-icon-handler"} color={'secondary'}/>
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
            {title: 'Name', field: 'name', editable: 'onAdd',initialEditValue:'',
                editComponent: props => (
                    <TextField
                               label="Name"
                               value={props.value || ''}
                               onChange={e => props.onChange(e.target.value)}
                    />
                )
            },
            {
                title: 'Value', field: 'value', editable: 'always',initialEditValue:undefined,
                editComponent: props => (
                    <TypedInput props={props}/>
                )
            },
        ]}
        data={plainData}
    />;
}

function StaticSection({meta, section, tableFromMeta, isBeamtime}: StaticSectionProps) {
    const classes = useStyles();
    return <Grid
        container
        direction="column"
        alignItems="stretch"
    >
        <Grid item xs={12}>
            <Typography variant="overline" align="center" className={classes.tableTitle}>
                {section}
            </Typography>
        </Grid>
        <Grid item xs={12}>
            <Paper className={classes.paper}>
                <Table meta={meta} tableFromMeta={tableFromMeta} section={section} isBeamtime={isBeamtime}/>
            </Paper>
        </Grid>
    </Grid>;
}

function StaticMeta({meta, tableFromMeta, isBeamtime}: StaticMetaProps) {
    const classes = useStyles();
    return <div>
        <div className={classes.imageBox}>
        <ImageList className={classes.imageList} rowHeight={120} cols={6} >
            {meta.attachments && meta.attachments.map((tile) => (
                tile.contentType.startsWith("image")&&
                <ImageListItem key={tile.id}>
                    <img className={classes.image} src={`${ApplicationApiBaseUrl}/attachments/raw/meta/${tile.id}`} alt={tile.name} />
                </ImageListItem>
            ))}
        </ImageList>
        </div>
        {isBeamtime ?
            <Grid container direction="row" alignItems="stretch" spacing={1}>
                <Grid item xs={12} sm={12} md={4}>
                    <StaticSection meta={meta} tableFromMeta={tableFromMeta} isBeamtime={isBeamtime}
                                   section="Beamtime"/>
                </Grid>
                <Grid item xs={12} sm={12} md={4}>
                    <StaticSection meta={meta} tableFromMeta={tableFromMeta} isBeamtime={isBeamtime}
                                   section="Proposal"/>
                </Grid>
                <Grid item xs={12} sm={12} md={4}>
                    <StaticSection meta={meta} tableFromMeta={tableFromMeta} isBeamtime={isBeamtime}
                                   section="Analysis"/>
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
    if (meta.customValues) {
        for (const [key, value] of Object.entries(meta.customValues as KvObj)) {
            if (value.constructor.name === "Object") {
                customCategories[key] = value;
            } else {
                mainCategory[key] = value;
            }
        }
    }

    let n = 0;
    const tValue = Object.entries(customCategories).length >= tabValue ? tabValue : 0;
    return <Grid container>
        <Grid item xs={2}>
            <Tabs
                orientation="vertical"
                variant="standard"
                value={tValue}
                onChange={handleTabChange}
                aria-label="Vertical tabs example"
                className={classes.tabs}
            >
                <Tab classes={{wrapper: classes.tabLabel}} label="general" {...a11yProps(0)}/>
                {
                    Object.entries(customCategories).map(([key]) => {
                            return <Tab classes={{wrapper: classes.tabLabel}} label={key} {...a11yProps(1)} key={key}/>;
                        }
                    )
                }

            </Tabs>
        </Grid>
        <Grid item xs={10}>
            <TabPanel value={tValue} index={n++} className={classes.tabPanel} key={n}>
                <CustomTable originalQuery={originalQuery} suffix={"customValues"} id={meta.id} data={mainCategory}/>
            </TabPanel>
            {
                Object.entries(customCategories).map(([key, value]) =>
                    <TabPanel value={tValue} index={n++} className={classes.tabPanel} key={n}>
                        <CustomTable originalQuery={originalQuery} suffix={"customValues." + key} id={meta.id}
                                     data={value}/>
                    </TabPanel>
                )
            }
        </Grid>
    </Grid>;
}

function PlainMeta({originalQuery, meta}: MetaViewProps) {
    return <Grid container>
        <Grid item xs={12}>
            <CustomTable originalQuery={originalQuery} suffix={"customValues"} id={meta.id}
                         data={meta.customValues as KvObj}/>
        </Grid>
    </Grid>;
}

function CustomMeta({originalQuery, meta}: MetaViewProps) {
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

function DetailedMetaTab({originalQuery, meta, tableFromMeta, isBeamtime}: StaticMetaProps): JSX.Element {
    return (
        <div>
            <StaticMeta originalQuery={originalQuery} meta={meta} tableFromMeta={tableFromMeta}
                        isBeamtime={isBeamtime}/>
            <CustomMeta originalQuery={originalQuery} meta={meta}/>
        </div>
    );
}


export default DetailedMetaTab;
