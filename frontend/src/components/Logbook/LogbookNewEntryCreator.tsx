import React, {ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState} from "react";
import LogbookMarkdownEditor from "./LogbookMarkdownEditor";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Chip,
    createStyles,
    Paper,
    TextField,
    Theme,
    Typography,
    withStyles
} from "@material-ui/core";
import {Autocomplete} from "@material-ui/lab";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import {makeStyles} from "@material-ui/core/styles";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {useMutation, useQuery} from "@apollo/client";
import {ADD_LOG_MESSAGE, LOG_GET_BEAMTIMES, LOG_GET_FACILITIES} from "../../graphQLSchemes";
import {ApplicationApiBaseUrl, EasyFileUpload, GetFilterString} from "../../common";
import {Query} from "../../generated/graphql";
import debounce from "lodash.debounce";
import {collectionFilterVar} from "../FilterBoxes";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
        },
        heading: {
            fontSize: theme.typography.pxToRem(15),
            fontWeight: theme.typography.fontWeightRegular,
        },
        paper: {
            padding: theme.spacing(1),
            margin: theme.spacing(0),
            color: theme.palette.text.primary,
            background: theme.palette.lightBackground.main,
        },
        uploadBox: {
            position: 'relative',
            backgroundColor: '#fff', // TODO Use Paper
            border: '1px solid rgba(0, 0, 0, 0.12)', // TODO Use Paper
            padding: theme.spacing(1),

            '& input[type=file]': {
                opacity: 0,
                position: 'absolute',
                height: '100%',
                width: '100%',
                top: 0,
                left: 0,
            }
        }
    }),
);

const MyAccordionSummary = withStyles({
    root: {
        backgroundColor: 'rgba(0, 0, 0, .03)',
        borderBottom: '1px solid rgba(0, 0, 0, .125)',
        marginBottom: -1,
        minHeight: 56,
        '&$expanded': {
            minHeight: 56,
        },
    },
    content: {
        '&$expanded': {
            margin: '12px 0',
        },
    },
    expanded: {
    }
})(AccordionSummary);

interface AttachedFileInfo {
    localId: string;
    id: string | null; // Might be null during upload
    uploadProgress: number; // from 0 to 1
    name: string;
}

interface LogbookNewEntryCreatorProps {
    prefilledFacillity?: string;
    prefilledBeamtime?: string;
}

function LogbookNewEntryCreator(props: LogbookNewEntryCreatorProps): JSX.Element {
    const markdownEditor = useRef<any/*LogbookMarkdownEditorInterface*/>();
    const classes = useStyles();
    const [sendToApi] = useMutation<any/*TODO*/>(ADD_LOG_MESSAGE);

    const [sendMessageError, setSendMessageError] = useState<string>('');
    const [submitInProgress, setSubmitInProgress] = useState<boolean>(false);
    const [inputIsOkay, setInputIsOkay] = useState<boolean>(false);
    const [hasContent, setHasContent] = useState<boolean>(false);

    const [editorVersionCounter, setEditorVersionCounter] = useState<number>(0);

    const [facility, setFacility] = useState<string | null>('');
    const [beamtime, setBeamtime] = useState<string | null>('');

    const [autoCompleteFacilities, setAutoCompleteFacilities] = useState<string[]>([]);
    const [autoCompleteBeamtimes, setAutoCompleteBeamtimes] = useState<string[]>([]);

    const getFacilitiesQueryResult = useQuery<Query, { filter: string }>(LOG_GET_FACILITIES, {
        variables: {filter: props.prefilledBeamtime ? `id='${props.prefilledBeamtime}'` : ''},
    });
    const getBeamtimesQueryResult = useQuery<Query, { filter: string }>(LOG_GET_BEAMTIMES, {
        variables: {filter: facility?.length ? `facility='${facility}'` : ''},
    });

    useEffect(() => {
            if (getFacilitiesQueryResult.error) {
            } else if (!getFacilitiesQueryResult.loading && getFacilitiesQueryResult.data) {
                const values = getFacilitiesQueryResult.data.uniqueFields[0].values;
                setAutoCompleteFacilities(values);
                if (props.prefilledBeamtime && values.length == 1) {
                    setFacility(values[0]);
                }
            }
        },
        [getFacilitiesQueryResult.error, getFacilitiesQueryResult.loading, getFacilitiesQueryResult.data, setAutoCompleteFacilities]
    );
    useEffect(() => {
            if (getBeamtimesQueryResult.error) {
            } else if (!getBeamtimesQueryResult.loading && getBeamtimesQueryResult.data) {
                setAutoCompleteBeamtimes(getBeamtimesQueryResult.data.uniqueFields[0].values);
            }
        },
        [getBeamtimesQueryResult.error, getBeamtimesQueryResult.loading, getBeamtimesQueryResult.data, setAutoCompleteBeamtimes]
    );

    const updateBeamtimes = useCallback(debounce((lastInput) => {
        getBeamtimesQueryResult.refetch({
            filter: lastInput?.length ? `facility='${lastInput}'` : '',
        });
    }, 250), []);

    function onFacilityInputChanged(e: ChangeEvent<any>, value: string | null) {
        setFacility(value);
        updateBeamtimes(value);
    }

    function onBeamtimeInputChanged(e: ChangeEvent<any>, value: string | null) {
        setBeamtime(value);
    }

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (submitInProgress || !inputIsOkay) {
            return;
        }

        const message = markdownEditor!.current!.getRawContent();

        console.log('Would post new message', facility, beamtime, message);

        try {
            setSubmitInProgress(true);
            const files = attachedFiles.length
                ? Object.fromEntries(attachedFiles.map(x => [x.name, x.id]))
                : null;
            await sendToApi({variables: {
                facility,
                beamtime,
                message,
                attachments: files,
            }});
            setAttachedFiles([]);
            setEditorVersionCounter(editorVersionCounter + 1);
        }
        catch(e) {
            console.error('Error while sending message', e);
            setSendMessageError(e.message);
        }
        finally {
            setSubmitInProgress(false);
        }
    }

    const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);

    const [attachedFiles, setAttachedFiles] = useState<AttachedFileInfo[]>([]);

    useEffect(() => {
        setInputIsOkay(!!(hasContent && facility?.length));
    });

    async function uploadAndAppendFile(file: File) {
        {
            const existingFile = attachedFiles.find((f) => f.name == file.name);
            if (existingFile) {
                if (!confirm("Warning: The filename is already in use. Do you want to overwrite it?")) {
                    return; // User canceled upload
                }
                removeAttachment(existingFile.localId);
            }
        }

        const newFile: AttachedFileInfo = {
            localId: (String(Date.now())+(Math.random())), // We need a local id for ReactIds
            id: null,
            uploadProgress: 0,
            name: file.name,
        };

        try {
            setUploadErrorMessage(null);

            setAttachedFiles(attachedFiles.concat(newFile));

            const fileId = await EasyFileUpload(`${ApplicationApiBaseUrl}/attachments/upload`, file, (progress) => {
                console.log('upload progress ', progress, attachedFiles);
                newFile.uploadProgress = progress;
            });
            console.log(`Upload of file ${file.name} complete (fileId: ${fileId})`);
            newFile.id = fileId;
            newFile.uploadProgress = 1;
        }
        catch (e) {
            setUploadErrorMessage(e.message);
            removeAttachment(newFile.localId);
        }
    }

    function removeAttachment(localId: string) {
        setAttachedFiles(attachedFiles.filter(f => f.localId != localId));
        // TODO Search in text for this attachment and remove it there!
    }

    return <Accordion>
        <MyAccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className={classes.heading}>Compose new log entry</Typography>
        </MyAccordionSummary>
        <AccordionDetails>
            <form style={{width: '100%'}} onSubmit={onSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={3}>
                        <Autocomplete
                            id="facility-input"
                            freeSolo
                            options={autoCompleteFacilities}
                            onInputChange={onFacilityInputChanged}
                            value={facility}
                            renderInput={(params) => (
                                <TextField {...params} required label="Facility" margin="dense" variant="outlined" />
                            )}
                            disabled={!!props.prefilledFacillity || !!props.prefilledBeamtime}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <Autocomplete
                            id="beamtime-input"
                            freeSolo
                            options={autoCompleteBeamtimes}
                            onInputChange={onBeamtimeInputChanged}
                            renderInput={(params) => (
                                <TextField {...params} label="Beamtime" margin="dense" variant="outlined"/>
                            )}
                            value={props.prefilledBeamtime}
                            disabled={!!props.prefilledBeamtime}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <Typography color="error">{sendMessageError}</Typography>
                    </Grid>
                    <Grid item xs={2} style={{textAlign: 'right'}}>
                        <Button variant="contained" color="primary" type="submit" disabled={!inputIsOkay || submitInProgress} style={{height: 45}}>
                            Send
                        </Button>
                    </Grid>
                </Grid>
                <LogbookMarkdownEditor
                    key={editorVersionCounter}
                    ref={markdownEditor}
                    onFileUpload={(file) => {uploadAndAppendFile(file);}}
                    onHasContent={(hasContent) => {setHasContent(hasContent);}}
                />

                {
                    (attachedFiles.length > 0 || uploadErrorMessage) &&
                    <Paper variant="outlined" className={classes.paper}>
                        <Typography color="error">{uploadErrorMessage}</Typography>
                        <Box style={{marginTop: (attachedFiles.length ? '0.5em' : '0')}}>
                            {(attachedFiles.map((fi) => <Chip label={`${fi.name}`} key={fi.localId} onDelete={() => {
                                // TODO:  (${Math.trunc(fi.uploadProgress*100)}%)
                                removeAttachment(fi.localId);
                            }}/>))}
                        </Box>
                    </Paper>
                }
            </form>
        </AccordionDetails>
    </Accordion>;
}

export default LogbookNewEntryCreator;
