import React, {ChangeEvent, FormEvent, useRef, useState} from "react";
import LogbookMarkdownEditor from "./LogbookMarkdownEditor";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    createStyles, FormControl,
    TextField, Theme,
    Typography, withStyles
} from "@material-ui/core";
import {Autocomplete} from "@material-ui/lab";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import {makeStyles} from "@material-ui/core/styles";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {useMutation} from "@apollo/client";
import {ADD_LOG_MESSAGE} from "../../graphQLSchemes";

const facilities = [
    'xfel',
    'cfel',
    'desy',
    'facility1',
    'facility2',
    'facility3',
    'facility4',
    'facility4',
];

const beamtimes = [
    '1231330',
    '1231360',
    '1231130',
    '1231223',
];
const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
        },
        heading: {
            fontSize: theme.typography.pxToRem(15),
            fontWeight: theme.typography.fontWeightRegular,
        },
    }),
);

function LogbookNewEntryCreator(): JSX.Element {
    const markdownEditor = useRef() as any;
    const classes = useStyles();
    const [sendToApi] = useMutation(ADD_LOG_MESSAGE);

    const [facility, setFacility] = useState<string | null>('');
    const [beamtime, setBeamtime] = useState<string | null>('');

    function onFacilityInputChanged(e: ChangeEvent<any>, value: string | null) {
        setFacility(value);
    }

    function onBeamtimeInputChanged(e: ChangeEvent<any>, value: string | null) {
        setBeamtime(value);
    }

    function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const message = markdownEditor.current.getRawContent();

        console.log('Would post new message', facility, beamtime, message);
        /*
        try {
            disabled = true;
            await sendToApi({variables: {
                facility,
                beamtime,
                message,
            }});
        }
        catch(e) {
            errorPopup(e.message)
        }
        finally {
            disabled = false;
        }
         */
    }

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
        expanded: {},
    })(AccordionSummary);

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
                            options={facilities}
                            onInputChange={onFacilityInputChanged}
                            renderInput={(params) => (
                                <TextField {...params} required label="Facility" margin="dense" variant="outlined" />
                            )}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <Autocomplete
                            id="beamtime-input"
                            freeSolo
                            options={beamtimes}
                            onInputChange={onBeamtimeInputChanged}
                            renderInput={(params) => (
                                <TextField {...params} label="Beamtime" margin="dense" variant="outlined"/>
                            )}
                        />
                    </Grid>
                    <Grid item xs={4}>
                    </Grid>
                    <Grid item xs={2}>
                        <Button variant="contained" color="primary" type="submit" style={{height: 45}}>
                            Save in timeline
                        </Button>
                    </Grid>
                </Grid>
                <LogbookMarkdownEditor ref={markdownEditor} />
            </form>
        </AccordionDetails>
    </Accordion>;
}

export default LogbookNewEntryCreator;
