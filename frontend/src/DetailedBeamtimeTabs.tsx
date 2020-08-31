import React from 'react';
import {makeStyles, Theme} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import {MetaDetails, TableDataFromMeta, TableDataFromCollection, CollectionDetails} from "./meta";
import DetailedMetaTab from "./DetailedMetaTab"
import DatasetsTableTab from "./DatasetsTableTab";
import {useHistory} from "react-router-dom";

interface TabPanelProps {
    children?: React.ReactNode;
    index: any;
    value: any;
}

function TabPanel(props: TabPanelProps) {
    const {children, value, index, ...other} = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box paddingTop={3}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: any) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
    },
    marginLeftRight: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
    },
    navBar: {},
}));

type BeamtimeTabsProps = {
    meta: MetaDetails | CollectionDetails
    isBeamtime: boolean
    section: string
}

function BeamtimeTabs({meta,isBeamtime,section}: BeamtimeTabsProps) {
    const classes = useStyles();
    let value=0;
    const showDataset = meta.childCollection && (meta.childCollection.length > 0);
    console.log(section,showDataset)
    switch(section) {
        case "meta": {
            value = 0;
            break;
        }
        case "collections": {
            value = 1;
            break;
        }
        case "logbook": {
            value = showDataset?2:1;
            break;
        }
        default: {
            value = 0;
            break;
        }
    }
    const history = useHistory();
    const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        let subpath="/meta";
        switch(newValue) {
            case 1: {
                subpath = showDataset?"/collections":"/logbook";
                break;
            }
            case 2: {
                subpath = "/logbook";
                break;
            }
        }
        const path = isBeamtime? "/detailed/" + meta.beamtimeId+subpath:"/detailedcollection/" + (meta as CollectionDetails).id+subpath;
        console.log(path)
        history.replace(path);
    };

    return (
        <div className={classes.root}>
            <AppBar position="static" color="default" className={classes.navBar}>
                <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
                    <Tab label="Metadata" {...a11yProps(0)} />
                    {showDataset && <Tab label={meta.childCollectionName} {...a11yProps(1)} />}
                    <Tab label="Logbook" {...a11yProps(showDataset ? 2 : 1)} />
                </Tabs>
            </AppBar>
            <div className={classes.marginLeftRight}>
                <TabPanel value={value} index={0}>
                    <DetailedMetaTab meta={meta} isBeamtime={isBeamtime} tableFromMeta={isBeamtime?TableDataFromMeta:TableDataFromCollection}/>
                </TabPanel>
                {showDataset &&
                <TabPanel value={value} index={1}>
                    <DatasetsTableTab meta={meta}/>
                </TabPanel>
                }
                <TabPanel value={value} index={showDataset ? 2 : 1}>
                    very cool logbook
                </TabPanel>
            </div>
        </div>
    );
}


export default BeamtimeTabs;