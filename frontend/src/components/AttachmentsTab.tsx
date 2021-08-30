import React from 'react';
import {makeStyles, createStyles, useTheme, Theme} from '@material-ui/core/styles';
import Paper from "@material-ui/core/Paper";
import ImageList from '@material-ui/core/ImageList';
import ImageListItem from '@material-ui/core/ImageListItem';
import ImageListItemBar from '@material-ui/core/ImageListItemBar';
import {isWidthUp} from '@material-ui/core/withWidth';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import {Breakpoint} from '@material-ui/core/styles/createBreakpoints';

import {ApplicationApiBaseUrl} from "../common";
import {
    BeamtimeMeta,
    CollectionEntry,
    MutationUploadAttachmentArgs, Attachment, UploadFile
} from "../generated/graphql";
import IconButton from '@material-ui/core/IconButton';
import {DropzoneArea} from 'material-ui-dropzone';
import {UPLOAD_ATTACHMENT} from "../graphQLSchemes";
import {useMutation} from "@apollo/client";
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import {Link} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            root: {
                flexGrow: 1,
                margin: theme.spacing(0),
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
                paddingTop: theme.spacing(0),
                padding: theme.spacing(2),
                marginBottom: theme.spacing(2),
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
            icon: {
                color: 'rgba(255, 255, 255, 0.54)',
            },
            image: {
                height: '100%',
                width: '100%',
                objectFit: 'contain',
            },
            titleBar: {
                background:
                    'linear-gradient(to top, rgba(0,0,0,0.5) 0%, ' +
                    'rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.0) 100%)',
            },

        }),
);


type MetaViewProps = {
    meta: BeamtimeMeta | CollectionEntry
}

type BreakpointOrNull = Breakpoint | null;

function useWidth(): Breakpoint {
    const theme: Theme = useTheme();
    const keys: Breakpoint[] = [...theme.breakpoints.keys].reverse();
    return (
        keys.reduce((output: BreakpointOrNull, key: Breakpoint) => {
            const matches = useMediaQuery(theme.breakpoints.up(key));
            return !output && matches ? key : output;
        }, null) || 'xs'
    );
}

const getGridListCols = (width: Breakpoint) => {
    if (isWidthUp('xl', width)) {
        return 6;
    }

    if (isWidthUp('lg', width)) {
        return 4;
    }

    if (isWidthUp('md', width)) {
        return 2;
    }

    return 1;
};


function Attachments({meta}: MetaViewProps) {
    const classes = useStyles();
    const [mutate, {loading, error}] = useMutation<Attachment, MutationUploadAttachmentArgs>(UPLOAD_ATTACHMENT);
    const width = useWidth();

    if (loading) console.log('Submitting...');
    if (error) console.log(`Submission error! ${error.message}`);

    function onChange(files: File[]) {
        if (files.length == 0) {
            return;
        }
        const upload: UploadFile = {
            entryId: meta.id,
            file: files[0]
        };
        mutate({variables: {req: upload}}).then(({data}) => {
            console.log("uploaded ", data);
        })
            .catch(e => {
                console.log(e);
            });
    }

    return (
        <div>
            <Typography variant="overline" align="center" className={classes.tableTitle}>
                Images
            </Typography>
            <Paper className={classes.paper}>
                <ImageList rowHeight={200} gap={5} cols={getGridListCols(width)}>
                    {meta.attachments && meta.attachments.map((tile) => (
                        tile.contentType.startsWith("image") &&
                        <ImageListItem cols={1} key={tile.id}>
                            <img className={classes.image}
                                 src={`${ApplicationApiBaseUrl}/attachments/raw/meta/${tile.id}`} alt={tile.name}/>
                            <ImageListItemBar
                                title={tile.name}
                                position={'bottom'}
                                className={classes.titleBar}
                                actionIcon={
                                    <a href={`${ApplicationApiBaseUrl}/attachments/raw/meta/${tile.id}`}
                                       download={tile.name}>
                                        <IconButton className={classes.icon}>
                                            <CloudDownloadIcon/>
                                        </IconButton>
                                    </a>
                                }
                            />
                        </ImageListItem>
                    ))}
                </ImageList>
            </Paper>
            <Typography variant="overline" align="center" className={classes.tableTitle}>
                Other files
            </Typography>
            <Paper className={classes.paper}>
                <ImageList cols={getGridListCols(width)}>
                    {meta.attachments && meta.attachments.map((attachment) => (
                        !attachment.contentType.startsWith("image") &&
                        <ImageListItem cols={1} key={attachment.id}>
                            <img className={classes.image} src={process.env.PUBLIC_URL + '/file.svg'}
                                 alt={attachment.name}/>
                            <ImageListItemBar
                                title={attachment.name}
                                className={classes.titleBar}
                                actionIcon={
                                    <Link href={`${ApplicationApiBaseUrl}/attachments/raw/meta/${attachment.id}`}
                                          download={attachment.name}>
                                        <IconButton className={classes.icon}>
                                            <CloudDownloadIcon/>
                                        </IconButton>
                                    </Link>
                                }
                            />

                        </ImageListItem>
                    ))}
                </ImageList>
            </Paper>
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
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <Attachments meta={meta}/>
        </div>
    );
}


export default AttachmentsTab;
