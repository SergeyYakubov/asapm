import React from 'react';
import {makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import ImageList from '@material-ui/core/ImageList';
import ImageListItem from '@material-ui/core/ImageListItem';
import ImageListItemBar from '@material-ui/core/ImageListItemBar';

import MaterialTable from "material-table";
import {useHistory} from "react-router-dom";
import {TableIcons} from "../TableIcons";
import {ApplicationApiBaseUrl, IsoDateToStr} from "../common";
import {
    BaseCollectionEntry,
    BeamtimeMeta,
    CollectionEntry,
    Maybe,
    MutationUploadAttachmentArgs, Scalars, Attachment, UploadFile
} from "../generated/graphql";
import ListSubheader from '@material-ui/core/ListSubheader';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import { DropzoneArea } from 'material-ui-dropzone';
import Dropzone from 'react-dropzone'
import {UPLOAD_ATTACHMENT} from "../graphQLSchemes";
import {useMutation} from "@apollo/client";
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import {Link} from "@material-ui/core";
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
            gridList: {
            },
            icon: {
                color: 'rgba(255, 255, 255, 0.54)',
            },
        }),
);


type MetaViewProps = {
    meta: BeamtimeMeta | CollectionEntry
}

interface TableEntry {
    id: string
    title: Maybe<string>
    eventStart: Maybe<string>
    eventEnd: Maybe<string>
}

type TableData = Array<TableEntry>

function TableDataFromDataset(meta: BeamtimeMeta | CollectionEntry): TableData {
    if (!meta.childCollection) {
        return [];
    }
    return (meta.childCollection as BaseCollectionEntry[]).map(collection => {
            return {
                id: collection.id,
                title: collection.title,
                eventStart: IsoDateToStr(collection.eventStart),
                eventEnd: IsoDateToStr(collection.eventEnd)
            };
        }
    );
}

function DatasetTable({meta}: MetaViewProps) {
    const history = useHistory();
    const handleClick = (
        event?: React.MouseEvent,
        rowData?: TableEntry,
    ) => {
        const path = "/detailedcollection/" + rowData?.id + "/meta";
        history.push(path);
    };

    return <MaterialTable
        icons={TableIcons}
        onRowClick={handleClick}
        options={{
            filtering: false,
            header: true,
            showTitle: false,
            search: true,
            paging: false,
            toolbar: true,
            draggable: false,
            minBodyHeight: "50vh",
            headerStyle: {
                fontWeight: 'bold',
            }
        }}
        columns={[
            {title: 'ID', field: 'id'},
            {title: 'Title', field: 'title'},
            {title: 'Start time', field: 'eventStart'},
            {title: 'End time', field: 'eventEnd'},
        ]}
        data={TableDataFromDataset(meta)}
    />;
}

function ListOfImages({meta}: MetaViewProps) {
    const classes = useStyles();
    const [mutate, { data, loading, error }] = useMutation<Attachment, MutationUploadAttachmentArgs>(UPLOAD_ATTACHMENT);

    if (loading) console.log('Submitting...');
    if (error) console.log(`Submission error! ${error.message}`);

    function onChange(files:File[]) {
        if (files.length==0) {
            return;
        }
        const upload: UploadFile = {
            entryId: meta.id,
            file: files[0]
        };
        mutate({ variables: { req: upload } }) .then(({ data }) => {
            console.log("uploaded ",data);
        })
            .catch(e => {
                // you can do something with the error here
            })
    }

    return (
        <div className={classes.root}>
            <ImageList cols={1} >
                {meta.attachments && meta.attachments.map((tile) => (
                    tile.contentType.startsWith("image")&&
                    <ImageListItem key={tile.id}>
                        <img src={`${ApplicationApiBaseUrl}/attachments/raw/meta/${tile.id}`} alt={tile.name} />
                        <ImageListItemBar
                            title={tile.name}
                            actionIcon={
                                <a href={`${ApplicationApiBaseUrl}/attachments/raw/meta/${tile.id}`} download={tile.name}>
                                    <IconButton className={classes.icon}>
                                        <CloudDownloadIcon />
                                    </IconButton>
                                </a>
                            }
                        />
                    </ImageListItem>
                ))}
            </ImageList>

            <ImageList key="Subheader2" cols={2} style={{ height: 'auto'}}>
                    <ListSubheader component="div">Other files</ListSubheader>
                    {meta.attachments && meta.attachments.map((attachment) => (
                        !attachment.contentType.startsWith("image")&&
                        <ImageListItem key={attachment.id}>
                            <img src={process.env.PUBLIC_URL + '/file.svg'} alt={attachment.name} />
                            <ImageListItemBar
                                title={attachment.name}
                                actionIcon={
                                    <Link href={`${ApplicationApiBaseUrl}/attachments/raw/meta/${attachment.id}`} download={attachment.name}>
                                        <IconButton className={classes.icon} >
                                            <CloudDownloadIcon />
                                        </IconButton>
                                    </Link>
                                }
                            />

                        </ImageListItem>
                    ))}
                </ImageList>
            <DropzoneArea
                showPreviewsInDropzone={false}
                onChange={onChange}
                filesLimit={1}
                maxFileSize={5000000}
                showAlerts={['error']}
            />
        </div>
    );
}


function AttachmentsTab({meta}: MetaViewProps): JSX.Element {
    return (
        <div>
            <ListOfImages meta={meta}/>
        </div>
    );
}


export default AttachmentsTab;
