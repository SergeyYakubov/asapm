import React from "react";
import {CollectionFilter, FieldFilter, RemoveDuplicates, ReplaceElement, StringFromFieldFilter} from "../common";
import {ColumnList, columnsVar, PossibleColumnListfromCollections} from "../pages/CollectionListPage";
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
        widthSetter: {
            width: "800px",
        },
        formContainer: {
            minWidth: "200px",
            maxWidth: "800px",
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
    collections: CollectionEntry[] | undefined
    fieldFilterToEdit?: FieldFilter
    currentFilter: CollectionFilter
    close: () => void
}

const emptyFieldFilter: FieldFilter = {
    alias: "",
    enabled: true,
    type: "string",
    value: "",
    op: "",
    key: "",
    filterString: ""
};

interface OpsChoiceProps {
    currentFieldFilter: FieldFilter
    availableKeys: ColumnList
    setCurrentFieldFilter: React.Dispatch<React.SetStateAction<FieldFilter>>
}


function OperatorList(currentKey: string | undefined, availableKeys: ColumnList) {
    const item = availableKeys.find((value) => value.fieldName === currentKey);
    if (!item) {
        return [];
    }
    switch (item.type) {
        case "string":
        case "String":
        case "Array":
            return ["equals", "not equals", "regexp", "not regexp"];
        case "number":
        case "Number":
            return ["equals", "not equals", "less than", "greater than"];
        default:
            return [];
    }
}

function OpsChoice({currentFieldFilter, setCurrentFieldFilter, availableKeys}: OpsChoiceProps) {
    const handleChangeOp = (event: React.ChangeEvent<{ value: unknown }>) => {
        setCurrentFieldFilter({...currentFieldFilter, op: event.target.value as string});
    };

    const opList = OperatorList(currentFieldFilter.key, availableKeys);

    return <FormControl fullWidth={true}>
        <InputLabel id="op-label">Operator</InputLabel>
        <Select
            labelId="op-label"
            id="op"
            value={availableKeys.length ? currentFieldFilter.op : ""}
            onChange={handleChangeOp}
            disabled={currentFieldFilter.key === "" || opList.length === 0}
        >
            {
                opList.map(value =>
                    <MenuItem key={value} value={value}>{value} </MenuItem>
                )
            }
        </Select>
    </FormControl>;
}

export function FilterForm({fieldFilterToEdit, close, collections, currentFilter}: FilterFormProps): JSX.Element {
    const classes = useStyles();

    const [availableKeys] = React.useState<ColumnList>(collections?
        PossibleColumnListfromCollections(columnsVar(), collections!).filter(value => value.type !== "Date"):[]);
    const [currentFieldFilter, setCurrentFieldFilter] = React.useState<FieldFilter>(fieldFilterToEdit || emptyFieldFilter);

    const [sqlMode, SetSqlMode] = React.useState(!!(fieldFilterToEdit?.filterString));

    const handleFilterFieldChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        const val = event.target.value as string;
        const field = availableKeys.find(key => key.fieldName === val);
        setCurrentFieldFilter({
            ...currentFieldFilter,
            key: field?.fieldName || "",
            alias: field?.alias || "",
            type: field?.type || "",
            op: "",
            value: ""
        });
    };

    const handleFilterValChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setCurrentFieldFilter({...currentFieldFilter, value: event.target.value as string});
    };

    const handleFilterStringChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setCurrentFieldFilter({...currentFieldFilter, filterString: event.target.value as string});
    };

    const addEnabled = currentFieldFilter.filterString !== "" || currentFieldFilter.value !== "";

    const handleClick = () => {
        let newFilters: FieldFilter[];
        if (fieldFilterToEdit) {
            newFilters = ReplaceElement(fieldFilterToEdit, currentFieldFilter, currentFilter.fieldFilters);
        } else {
            newFilters = [...(currentFilter.fieldFilters), currentFieldFilter];
        }
        collectionFilterVar({...currentFilter, fieldFilters: RemoveDuplicates(newFilters)});
        close();
    };

    const handleModeSwitch = () => {
        if (sqlMode) {
            setCurrentFieldFilter(emptyFieldFilter);
        } else {
            setCurrentFieldFilter({
                ...currentFieldFilter,
                key: "",
                op: "",
                value: "",
                filterString: StringFromFieldFilter(currentFieldFilter)
            });
        }
        SetSqlMode(!sqlMode);
    };

    return <Grid container spacing={0} className={classes.formContainer}>
        <Grid item xs={12}>
            <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} className={classes.formHeader}>
                <Typography variant={'subtitle2'} className={classes.bold}>
                    Edit filter
                </Typography>
                <Button size={"small"} color="primary"
                        onClick={handleModeSwitch}>{sqlMode ? "Switch to Form" : "Edit as SQL"}</Button>
            </Box>
        </Grid>
        <Grid item xs={12} className={classes.widthSetter}>
            <Divider/>
        </Grid>
        <Grid item xs={12} hidden={!sqlMode}>
            <Box className={classes.formControl}>
                <TextField id="standard-basic"
                           label="Query expresion"
                           fullWidth={true}
                           value={currentFieldFilter.filterString || ""}
                           multiline={true}
                           onChange={handleFilterStringChange}/>
            </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={4} hidden={sqlMode}>
            <Box className={classes.formControl}>
                <FormControl fullWidth={true}>
                    <InputLabel id="field-label">Field</InputLabel>
                    <Select
                        labelId="field-label"
                        id="field"
                        value={availableKeys.length ? currentFieldFilter.key : ""}
                        onChange={handleFilterFieldChange}
                    >
                        {availableKeys.map(value =>
                            <MenuItem key={value.fieldName}
                                      value={value.fieldName}>{value.alias || value.fieldName}</MenuItem>
                        )}
                    </Select>
                </FormControl>
            </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={4} hidden={sqlMode}>
            <Box className={classes.formControl}>
                <OpsChoice currentFieldFilter={currentFieldFilter} setCurrentFieldFilter={setCurrentFieldFilter}
                           availableKeys={availableKeys}/>
            </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={4} hidden={sqlMode}>
            <Box className={classes.formControl}>
                <TextField id="standard-basic"
                           label="Value"
                           fullWidth={true}
                           type={(currentFieldFilter.type === "Number" || currentFieldFilter.type === "number") ? "number" : "text"}
                           value={currentFieldFilter.value}
                           disabled={!currentFieldFilter.op}
                           onChange={handleFilterValChange}/>
            </Box>
        </Grid>
        <Grid item xs={12} style={{textAlign: 'end'}}>
            <Button size={"small"} color="secondary"
                    disabled={!addEnabled} variant="contained" onClick={handleClick}
                    className={classes.addButton}>{fieldFilterToEdit ? "Update" : "Add"}</Button>
        </Grid>
    </Grid>;
}

export function CustomFilter({currentFilter, collections}: CustomFilterProps): JSX.Element {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
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
        {anchorEl &&
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
            <FilterForm close={handleClose} currentFilter={currentFilter} collections={collections}/>
        </Popover>
        }
    </div>;
}

