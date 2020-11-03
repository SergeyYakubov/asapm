import React from "react";
import {CollectionFilter, FieldFilter, RemoveDuplicates} from "../common";
import {ColumnItem, ColumnList, columnsVar, PossibleColumnListfromCollections} from "../pages/CollectionListPage";
import {
    Box,
    Button,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Popover,
    Select,
    TextField,
    Typography
} from "@material-ui/core";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import {CollectionEntry} from "../generated/graphql";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import {collectionFilterVar} from "./FilterBoxes";

interface CustomFilterProps {
    currentFilter: CollectionFilter
    collections: CollectionEntry[] | undefined
}


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        popover: {},
        bold: {
            fontWeight: 'bold',
        },
        formContainer: {
            Width: "600px",
            minWidth: "200px",
        },
        formHeader: {
            margin: theme.spacing(1),
        },
        formControl: {
            minWidth: "120px",
            margin: theme.spacing(2),
        },
        filterChip: {
            margin: "5px",
        },
        addButton: {
            margin: theme.spacing(2),
            marginTop: theme.spacing(4),
        },
    })
);

interface FilterFormProps {
    currentCustomFilter: CurrentCustomFilter
    currentFilter: CollectionFilter
    availableKeys: ColumnList
    setCurrentCustomFilter: React.Dispatch<React.SetStateAction<CurrentCustomFilter>>
    close: ()=>void
}

type CurrentCustomFilter = {
    value: string
    op: string
    field: ColumnItem | undefined
    filterString: string
}

const emptyCustomFilter: CurrentCustomFilter = {value: "", op: "", field: undefined, filterString: ""};

interface OpsChoiceProps {
    currentCustomFilter: CurrentCustomFilter
    availableKeys: ColumnList
    setCurrentCustomFilter: React.Dispatch<React.SetStateAction<CurrentCustomFilter>>
}


function OperatorList(currentKey: string | undefined, availableKeys: ColumnList) {
    const item = availableKeys.find((value) => value.fieldName === currentKey);
    if (!item) {
        return [];
    }
    switch (item.type) {
        case "string":
        case "String":
            return ["equals", "not equals", "regexp", "not regexp"];
        case "number":
        case "Number":
            return ["equals", "not equals", "less than", "greater than"];
        default:
            return [];
    }
}

function OpsChoice({currentCustomFilter, setCurrentCustomFilter, availableKeys}: OpsChoiceProps) {
    const handleChangeOp = (event: React.ChangeEvent<{ value: unknown }>) => {
        setCurrentCustomFilter({...currentCustomFilter, op: event.target.value as string, value: ""});
    };

    const opList = OperatorList(currentCustomFilter.field?.fieldName, availableKeys);

    return <FormControl fullWidth={true}>
        <InputLabel id="op-label">Operator</InputLabel>
        <Select
            labelId="op-label"
            id="op"
            value={currentCustomFilter.op}
            onChange={handleChangeOp}
            disabled={!currentCustomFilter.field || opList.length === 0}
        >
            {
                opList.map(value =>
                    <MenuItem key={value} value={value}>{value} </MenuItem>
                )
            }
        </Select>
    </FormControl>;
}

function FilterForm({close,availableKeys, currentFilter, currentCustomFilter, setCurrentCustomFilter}: FilterFormProps) {
    const classes = useStyles();

    const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        const val = event.target.value as string;
        const field = availableKeys.find(key => key.fieldName === val);
        setCurrentCustomFilter({...currentCustomFilter, field: field, op: "", value: ""});
    };

    const handleFilterValChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setCurrentCustomFilter({...currentCustomFilter, value: event.target.value as string});
    };


    const addEnabled = currentCustomFilter.filterString !== "" || currentCustomFilter.value !== "";

    const handleClick = () => {
        const fieldFilter: FieldFilter = {
            alias: currentCustomFilter.field?.alias || "",
            key: currentCustomFilter.field!.fieldName,
            value: currentCustomFilter.value,
            op : currentCustomFilter.op,
            negate: false,
            enabled: true,
            type: currentCustomFilter.field?.type
        };

        collectionFilterVar({...currentFilter, fieldFilters: RemoveDuplicates([...(currentFilter.fieldFilters), fieldFilter])});
        close();
    };

    return <Grid container spacing={0} className={classes.formContainer}>
        <Grid item xs={12}>
            <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} className={classes.formHeader}>
                <Typography variant={'subtitle2'} className={classes.bold}>
                    Edit filter
                </Typography>
                <Button size={"small"} color="primary">Edit as SQL</Button>
            </Box>
        </Grid>
        <Grid item xs={12}>
            <Divider/>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
            <Box className={classes.formControl}>
                <FormControl fullWidth={true}>
                    <InputLabel id="field-label">Field</InputLabel>
                    <Select
                        labelId="field-label"
                        id="field"
                        value={currentCustomFilter.field?.fieldName || ""}
                        onChange={handleChange}
                    >
                        {availableKeys.map(value =>
                            <MenuItem key={value.fieldName}
                                      value={value.fieldName}>{value.alias || value.fieldName}</MenuItem>
                        )}
                    </Select>
                </FormControl>
            </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
            <Box className={classes.formControl}>
                <OpsChoice currentCustomFilter={currentCustomFilter} setCurrentCustomFilter={setCurrentCustomFilter}
                           availableKeys={availableKeys}/>
            </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
            <Box className={classes.formControl}>
                <TextField id="standard-basic"
                           label="Value"
                           fullWidth={true}
                           type={(currentCustomFilter.field?.type==="Number" || currentCustomFilter.field?.type==="number") ?"number":"text"}
                           value={currentCustomFilter.value}
                           disabled={!currentCustomFilter.op}
                           onChange={handleFilterValChange}/>
            </Box>
        </Grid>
        <Grid item xs={12} style={{textAlign: 'end'}}>
            <Button size={"small"} color="secondary"
                    disabled={!addEnabled} variant="contained" onClick={handleClick} className={classes.addButton}>Add</Button>
        </Grid>
    </Grid>;
}

export function CustomFilter({currentFilter, collections}: CustomFilterProps): JSX.Element {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [availableKeys, SetAvailableKeys] = React.useState<ColumnList>([]);

    const [currentCustomFilter, setCurrentCustomFilter] = React.useState<CurrentCustomFilter>(emptyCustomFilter);

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (collections) {
            SetAvailableKeys(PossibleColumnListfromCollections(columnsVar(), collections).filter(value => value.type !== "Array" && value.type !== "Date"));
        }
        setCurrentCustomFilter(emptyCustomFilter);
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return <div>
        <Chip
            className={classes.filterChip}
            color="secondary"
            icon={<AddCircleIcon/>}
            label="Add custom filter"
            onClick={handleClick}
        />
        <Popover
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            className={classes.popover}
        >
            <FilterForm close={handleClose} setCurrentCustomFilter={setCurrentCustomFilter} currentFilter={currentFilter}
                        currentCustomFilter={currentCustomFilter} availableKeys={availableKeys}/>
        </Popover>
    </div>;
}

