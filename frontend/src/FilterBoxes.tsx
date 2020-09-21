import React, {useCallback, useEffect} from 'react';
import Typography from '@material-ui/core/Typography';
import {makeStyles, createStyles, Theme, withStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from "@material-ui/core/Paper";
import {CollectionFilter} from "./common";
import debounce from 'lodash.debounce';
import {CollectionDetails, CollectionEntitiesDetails, GetUniqueNamesForField, UniqueField} from "./meta";
import {useQuery} from "@apollo/client";
import {COLLECTIONS} from "./graphQLSchemes";
import {Button, Chip, CircularProgress, IconButton, Menu, MenuItem, Popover} from "@material-ui/core";
import {MenuProps} from "@material-ui/core/Menu";
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import {DateRangePicker, DateRange} from "materialui-daterange-picker";
import DateRangeIcon from '@material-ui/icons/DateRange';
import {columnsVar} from "./CollectionListPage";
import SearchIcon from '@material-ui/icons/Search';
import Icon from '@material-ui/core/Icon';
import SettingsIcon from '@material-ui/icons/Settings';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import AddCircleTwoToneIcon from '@material-ui/icons/AddCircleTwoTone';
import MoreVertIcon from '@material-ui/icons/MoreVert';
const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
        },
        filtersFields: {
            marginLeft: theme.spacing(2),
        },
        rangeLabel: {
            marginLeft: theme.spacing(1),
        },
        filterPaper: {
            marginTop: theme.spacing(2),
        },
        filterBox: {
            alignItems:"center",
        },
        paper: {
            paddingTop: theme.spacing(1),
            padding: theme.spacing(2),
            margin: theme.spacing(0),
            textAlign: 'center',
            color: theme.palette.text.primary,
            background: theme.palette.lightBackground.main,
        },
        progress: {
            marginLeft: theme.spacing(2),
            width: "30%",
        },
        inline: {
            flex: 1,
            display: 'inline',
        },
        textField: {
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(2),
        },
    }),
);


function BeamtimeFilterBox() {
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <Grid container spacing={1} alignItems="flex-end">
                <Grid item xs={12}>
                    <Typography variant="h6" color="textSecondary">
                        Beamtimes
                    </Typography>
                </Grid>
                <Grid item md={6} sm={12} xs={12}>
                    <Typography variant="overline">
                        Quick Filters:
                    </Typography>
                </Grid>
                <Grid item md={6} xs={12}>
                    <Box
                        display="flex"
                        alignItems="flex-end"
                    >
                        <Typography noWrap={true} variant="overline" align={"right"}>
                            Quick Search :
                        </Typography>
                        <TextField className={classes.textField} id="standard-search" margin="dense"
                                   label="Search field" type="search"/>
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}

type CollectionFilterBoxProps = {
    filter: CollectionFilter
    setFilter: React.Dispatch<React.SetStateAction<CollectionFilter>>
    setCollections: React.Dispatch<React.SetStateAction<CollectionDetails[]>>
}

function getFilterString(filter: CollectionFilter) {
    let filterString = ""
    if (filter.showBeamtime && !filter.showSubcollections) {
        filterString = "type = 'beamtime'"
    }
    if (!filter.showBeamtime && filter.showSubcollections) {
        filterString = "type = 'collection'"
    }

    if (!filter.showBeamtime && !filter.showSubcollections) {
        filterString = "type = 'bla'"
    }

    if (filter.textSearch === "") {
        return filterString
    }

    if (filterString) {
        filterString = filterString + "AND jsonString regexp '" + filter.textSearch + "'"
    } else {
        filterString = "jsonString regexp '" + filter.textSearch + "'"
    }
    return filterString
}

interface SelectFieldsProps {
    alias: string
    uniqueFields: UniqueField
}

const StyledMenu = withStyles({
    paper: {
        border: '1px solid #d3d4d5',
    },
})((props: MenuProps) => (
    <Menu
        elevation={0}
        getContentAnchorEl={null}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
        }}
        {...props}
    />
));

function SelectFields({alias, uniqueFields}: SelectFieldsProps) {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };
    return (
        <div>
            <Button aria-controls="simple-menu" aria-haspopup="true" size="small" color="secondary"
                    endIcon={<ArrowDropDownIcon/>}
                    onClick={handleClick}
                    className={classes.filtersFields}
            >
                {alias}
            </Button>
            <StyledMenu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {uniqueFields.values.map(value => {
                    return <MenuItem onClick={handleClose}>{value}</MenuItem>;
                })}
            </StyledMenu>
        </div>
    );

}

function DataRangeToString(range: DateRange){
    if (!range || !range.startDate || !range.endDate) {
        return "";
    }
    return range.startDate.toLocaleDateString()+" - "+range.endDate.toLocaleDateString()
}

function CollectionFilterBox({filter, setFilter, setCollections}: CollectionFilterBoxProps) {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilter({...filter, [event.target.name]: event.target.checked});
    };

    const handler = useCallback(debounce(setFilter, 500), []);

    const handleTextSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handler({...filter, textSearch: event.target.value});
    }

    const handleDataRangeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const queryResult = useQuery<CollectionEntitiesDetails>(COLLECTIONS, {
        pollInterval: 5000,
        variables: {filter: getFilterString(filter), orderBy: "id"}
    });
    if (queryResult.error) {
        setCollections([])
        console.log(queryResult.error.message)
    }

    useEffect(() => {
        if (queryResult.loading === false && queryResult.data) {
            console.log("set collection");
            console.log(queryResult.data!.uniqueFields);
            setCollections(queryResult.data!.collections);
        }
    }, [queryResult.loading, queryResult.data, setCollections])

    const [dateRange, setDateRange] = React.useState<DateRange>({});
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const toggle = () => {
        setAnchorEl(null);
    }

    const handleDataRangeChange = (range: DateRange) => {
        setDateRange(range)
        toggle()
    }

    const handleRangeTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value === "") {
            setDateRange({})
        }
    };


    const handleAddFilterClick = () => {
    };


    const classes = useStyles();
    return (
        <div className={classes.root}>
            <Grid container spacing={1} alignItems="flex-end">
                <Grid item xs={12}>
                    <Box display="flex" alignItems="center">
                        <Typography variant="h6" color="textSecondary">
                            Collections
                        </Typography>
                        {
                            queryResult.loading &&
                            <CircularProgress size={20} className={classes.progress}/>
                        }
                    </Box>
                </Grid>
            </Grid>
            <Paper className={classes.paper}>
                <Grid container spacing={1} alignItems="flex-end">
                    <Grid item xs={12}>
                        <Box display="flex" alignItems="center">
                            <Typography variant="overline">
                                Scope:
                            </Typography>
                            <FormControlLabel
                                className={classes.filtersFields}
                                control={<Checkbox checked={filter.showBeamtime} onChange={handleChange}
                                                   name="showBeamtime"/>}
                                label="Beamtimes"
                            />
                            <FormControlLabel
                                className={classes.filtersFields}
                                control={<Checkbox checked={filter.showSubcollections} onChange={handleChange}
                                                   name="showSubcollections"/>}
                                label="Subcollections"
                            />
                        </Box>
                    </Grid>
                    <Grid item md={6} sm={12} xs={12}>
                        <Box display="flex">
                            <Typography variant="overline">
                                Add Filter:
                            </Typography>
                            <SelectFields alias={"facility"}
                                          uniqueFields={GetUniqueNamesForField(queryResult.data?.uniqueFields, "parentBeamtimeMeta.facility")}/>
                            <SelectFields alias={"beamline"}
                                          uniqueFields={GetUniqueNamesForField(queryResult.data?.uniqueFields, "parentBeamtimeMeta.beamline")}/>
                            <SelectFields alias={"door users"}
                                          uniqueFields={GetUniqueNamesForField(queryResult.data?.uniqueFields, "parentBeamtimeMeta.users.doorDb")}/>
                        </Box>
                    </Grid>
                    <Grid item md={3} sm={12} xs={12}>
                        <Box
                            display="flex"
                            alignItems="flex-end"
                        >
                            <Icon>
                                <SearchIcon/>
                            </Icon>
                            <TextField className={classes.textField} id="standard-search" margin="dense" fullWidth={true}
                                       label="Search field" type="search" onChange={handleTextSearchChange}/>
                        </Box>
                    </Grid>
                    <Grid item md={3} sm={12} xs={12}>
                        <Box
                            display="flex"
                            alignItems="flex-end"
                        >
                            <IconButton onClick={handleDataRangeClick} size={"small"}>
                                <DateRangeIcon/>
                            </IconButton>
                            <Popover
                                id="simple-menu"
                                anchorEl={anchorEl}
                                keepMounted
                                open={Boolean(anchorEl)}
                                onClose={toggle}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'left',
                                }}
                            >
                                <DateRangePicker
                                    open={true}
                                    closeOnClickOutside={true}
                                    toggle={toggle}
                                    onChange={handleDataRangeChange}
                                />
                            </Popover>
                            <TextField
                                className={classes.rangeLabel}
                                label="Time Range"
                                id="range-text"
                                value={DataRangeToString(dateRange)}
                                type="search"
                                margin="dense"
                                size="small"
                                fullWidth={true}
                                onChange={handleRangeTextChange}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Paper variant="outlined" className={classes.filterPaper}>
                            <Box display={'flex'} className={classes.filterBox} >
                                <IconButton>
                                    <MoreVertIcon/>
                                </IconButton>
                                <Chip
                                    color="secondary"
                                    icon={<AddCircleIcon />}
                                    label="Add custom filter"
                                    onClick={handleAddFilterClick}
                                />
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>
        </div>
    );
}

export {
    BeamtimeFilterBox,
    CollectionFilterBox
}

