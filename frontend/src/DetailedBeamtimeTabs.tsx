import React from 'react';
import {makeStyles, Theme} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import {MetaDetails} from "./graphQLTypes";
import DetailedMetaTab from "./DetailedMetaTab"
import DatasetsTableTab from "./DatasetsTableTab";

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

type MetaViewProps = {
    meta: MetaDetails
}

function BeamtimeTabs({meta}: MetaViewProps) {
    const classes = useStyles();
    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setValue(newValue);
    };

    const showDataset = meta.childCollection && (meta.childCollection.length > 0);
    return (
        <div className={classes.root}>
            <AppBar position="static" color="default" className={classes.navBar}>
                <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
                    <Tab label="Metadata" {...a11yProps(0)} />
                    {showDataset && <Tab label={meta.childCollectionName} {...a11yProps(1)} />}
                    <Tab label="Logbook" {...a11yProps(2)} />
                </Tabs>
            </AppBar>
            <div className={classes.marginLeftRight}>
                <TabPanel value={value} index={0}>
                    <DetailedMetaTab meta={meta}/>
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