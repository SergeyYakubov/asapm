import React from "react";
import {Paper, Theme} from "@material-ui/core";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import {CustomFilter} from "../CustomFilter";
import {useQuery} from "@apollo/client";
import {BeamtimeFilterData, beamtimeFilterVar, GET_BEAMTIME_FILTER} from "../FilterBoxes";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        paper: {
            paddingTop: theme.spacing(1),
            padding: theme.spacing(2),
            marginTop: theme.spacing(2),
            textAlign: 'center',
            color: theme.palette.text.primary,
            background: theme.palette.lightBackground.main,
            borderRadius: 0,
        },
        filterPaper: {
            margin: 0,
            padding: 0,
        }
    }),
);

interface LogbookFilterProps {
    onQuickSearchChanged?: (input: string) => void;
}

function LogbookFilter({}: LogbookFilterProps): JSX.Element {
    const classes = useStyles();

    /*
    const [filter, setFilter] = useState<CollectionFilter>({
        showBeamtime: false,
        showSubcollections: false,
        textSearch: '',
        sortBy: 'date',
        sortDir: 'asc',
        fieldFilters: [],
        dateFrom: undefined,
        dateTo: undefined,
    });
     */

    const {data} = useQuery<BeamtimeFilterData>(GET_BEAMTIME_FILTER);
    const filter = data!.beamtimeFilter;

    return <Paper variant="outlined" className={classes.filterPaper}>
        <CustomFilter collections={undefined} currentFilter={filter} filterVar={beamtimeFilterVar} />
    </Paper>;
}

export default LogbookFilter;
