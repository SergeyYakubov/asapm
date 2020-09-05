import {useQuery} from "@apollo/react-hooks";
import {CollectionDetails, CollectionEntitiesDetails} from "./meta";
import {COLLECTIONS} from "./graphQLSchemes";
import Toolbar from "@material-ui/core/Toolbar";
import {CollectionFilterBox} from "./filterBox";
import Grid from "@material-ui/core/Grid";
import React from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import Divider from "@material-ui/core/Divider";
import CircularProgress from "@material-ui/core/CircularProgress";
import MaterialTable from "material-table";
import {TableIcons} from "./TableIcons";
import {IsoDateToStr} from "./common";
import {useHistory} from "react-router-dom";
import Paper from "@material-ui/core/Paper";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
            margin: theme.spacing(1),
            minWidth:0,
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

    }),
);

type CollectionProps = {
    collections: CollectionDetails[]
}

interface BasicCollectionDetails {
    id: String
    type: String
}

enum KeyType {
    String
}

type KeyList = {
    fieldName: string
    alias?: string
    type?: KeyType
}[]

function ValueToString(value:any,keyType:KeyType|undefined) {
    if (!value) {
        return "";
    }
    let strval = value.toString();
    if (keyType === KeyType.String) {
        strval = IsoDateToStr(strval)
    }
    return strval
}

function plainDataFromObject(plainData: BasicCollectionDetails, data:object,root:string,keys: KeyList) {
    for (const [key, value] of Object.entries(data)) {
        const fullKey = (root !== "" ? root+"." : "")+key
        if (!value) continue;
        if (value.constructor.name === "Object") {
            plainDataFromObject(plainData,value,fullKey,keys)
        } else {
            for (let i = 0; i < keys.length; i++) {
                if (fullKey === keys[i].fieldName) {
                    // @ts-ignore
                    plainData[fullKey]=ValueToString(value, keys[i].type)
                    break;
                }
            }
        }
    }
}

function TableDataFromCollections(collections: CollectionDetails[],keys: KeyList): BasicCollectionDetails[] {
    return collections.map(collection => {
            var res: BasicCollectionDetails = {id:collection.id,type:collection.type};
            plainDataFromObject(res,collection,"",keys);
            return res
        }
    )
}
function possibleKeyListfromCustomValues(vals: Object,root:string,keys:KeyList) {
    for (const [key, value] of Object.entries(vals)) {
        const fullKey = (root !== "" ? root+"." : "")+key
        if (!value) continue;
        if (value.constructor.name === "Object") {
            possibleKeyListfromCustomValues(value,fullKey,keys)
        } else {
            let found = false;
            for (let i = 0; i < keys.length; i++) {
                if ("customValues."+fullKey === keys[i].fieldName) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                keys.push({fieldName:"customValues."+fullKey,alias:fullKey})
            }
        }
    }

}

function PossibleKeyListfromCollections(collections:CollectionDetails[]) {
    let keys:KeyList = [
        {fieldName:"id",alias:"ID"},
        {fieldName:"title",alias:"Title"},
        {fieldName:"parentBeamtimeMeta.id",alias:"Beamtime ID"},
        {fieldName:"parentBeamtimeMeta.beamline",alias:"Beamline"},
        {fieldName:"parentBeamtimeMeta.facility",alias:"Facility"},
        {fieldName:"parentBeamtimeMeta.users.doorDb",alias:"Door users"},
        {fieldName:"eventStart",alias:"Started At",type:KeyType.String},
    ]
    collections.forEach(col => {
        possibleKeyListfromCustomValues(col.customValues,"",keys)
    })

    return keys

}

function CollectionTable({collections}:CollectionProps) {
    console.log(collections)
    const history = useHistory();
    const handleClick = (
        event?: React.MouseEvent,
        rowData?: BasicCollectionDetails,
        toggleDetailPanel?: (panelIndex?: number) => void
    ) => {
        const path = (rowData!.type ==="collection"?"/detailedcollection/":"/detailed/") + rowData!.id+"/meta";
        history.push(path);
    }
    const keys: KeyList = PossibleKeyListfromCollections(collections)

    return <div>
        <MaterialTable
        icons={TableIcons}
        onRowClick={handleClick}
        options={{
            filtering: false,
            header: true,
            showTitle: false,
            search: false,
            paging: false,
            toolbar: false,
            draggable: false,
            sorting: false,
            minBodyHeight: "50vh",
            headerStyle: {
                fontWeight: 'bold',
            }
        }}
        columns={keys.map(key => {return{title: key.alias || key.fieldName , field: key.fieldName}})}
        data={TableDataFromCollections(collections,keys)}
    />
    </div>
}

function ListCollections() {
    const classes = useStyles();

    const queryResult = useQuery<CollectionEntitiesDetails>(COLLECTIONS, {
        pollInterval: 5000,
        variables: {filter: "",orderBy:"id"}
    });
    if (queryResult.error) {
        console.log(queryResult.error.message)
    }
    if (queryResult.loading || queryResult.error) {
            return <div>
                {queryResult.loading ? <CircularProgress/> : <p>{queryResult.error!.message}...</p>}
            </div>
    }

    return (
        <div className={classes.root}>
            <Toolbar variant="dense"/>
            <CollectionFilterBox></CollectionFilterBox>
            <Grid container spacing={1}>
                <Grid item xs={12}>
                    <Divider></Divider>
                </Grid>
                <Grid item xs={12}>
                    <Paper className={classes.paper}>
                    <CollectionTable collections={queryResult.data!.collections }/>
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
}


export default ListCollections;
