//import * as ProseMirrorMarkdown from "prosemirror-markdown";
import * as ProseMirrorSchemaBasic from "prosemirror-schema-basic";
const baseSchema = (ProseMirrorSchemaBasic as any).schema;

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-menu/style/menu.css';
import './LogbookMarkdownEditor.css';

import {EditorState, Plugin, PluginKey, Transaction} from "prosemirror-state";
import {Decoration, DecorationSet, EditorView} from "prosemirror-view";
import React, {forwardRef, MutableRefObject, useEffect, useImperativeHandle, useRef} from "react";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import {Dropdown, MenuItem, MenuItemSpec} from "prosemirror-menu";
import {
    addColumnAfter,
    addColumnBefore,
    addRowAfter,
    addRowBefore,
    deleteColumn,
    deleteRow,
    deleteTable,
    isInTable,
    mergeCells,
    splitCell,
    tableEditing,
    tableNodes,
} from "prosemirror-tables";
import {Schema, Fragment}  from "prosemirror-model";
import {ChangeableImageRef} from "./LogbookUtils";
import {useTheme} from "@material-ui/core";
import {ApplicationApiBaseUrl} from "../../common";
import {AttachedFileInfo} from "./LogbookNewEntryCreator";
import FormatBoldIcon from '@material-ui/icons/FormatBold';
import FormatItalicIcon from '@material-ui/icons/FormatItalic';
import LinkIcon from '@material-ui/icons/Link';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import FormatQuoteIcon from '@material-ui/icons/FormatQuote';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {exampleSetup, buildMenuItems} = require('prosemirror-example-setup');

export const schemaWithTable = new Schema({
    nodes: baseSchema.spec.nodes.append(tableNodes({
        tableGroup: "block",
        cellContent: "block+",
        cellAttributes: {
            background: {
                default: null,
                getFromDOM(dom) { return (dom as any).style.backgroundColor || null; },
                setDOMAttr(value, attrs) { if (value) attrs.style = (attrs.style || "") + `background-color: ${value};`; }
            }
        }
    })),
    marks: baseSchema.spec.marks
});

function createMenu(onFileUpload: (file: File) => Promise<AttachedFileInfo | undefined>, addNewChangeableImageHandle: () => ChangeableImageRef, iconPaths: {
    bold: string, italic: string, link: string, undo: string, redo: string, quote: string
}): any {
    const menu = buildMenuItems(schemaWithTable).fullMenu;
    function item(label: string, cmd: any) {
        return new MenuItem({label, select: cmd, run: cmd});
    }

    const tableMenu = [
        item("Insert column before", addColumnBefore),
        item("Insert column after", addColumnAfter),
        item("Delete column", deleteColumn),
        item("Insert row before", addRowBefore),
        item("Insert row after", addRowAfter),
        item("Delete row", deleteRow),
        item("Delete table", deleteTable),
        item("Merge cells", mergeCells),
        item("Split cell", splitCell),
        /*
        item("Toggle header column", toggleHeaderColumn),
        item("Toggle header row", toggleHeaderRow),
        item("Toggle header cells", toggleHeaderCell),
        item("Make cell green", setCellAttr("background", "#dfd")),
        item("Make cell not-green", setCellAttr("background", null)),
         */
    ];
    menu.splice(2, 0, [new Dropdown(tableMenu, {label: "Table"})]);

    function replaceIcon(button: MenuItem, newIconPath: string) {
        button.spec.icon = {
            height: 24, // material ui default size
            width: 24,
            path: newIconPath,
        };
    }

    replaceIcon(menu[0][0], iconPaths.bold);
    replaceIcon(menu[0][1], iconPaths.italic);
    replaceIcon(menu[0][3], iconPaths.link);
    replaceIcon(menu[3][0], iconPaths.undo);
    replaceIcon(menu[3][1], iconPaths.redo);
    replaceIcon(menu[4][0], iconPaths.quote);

    // Push into the "insert" menu
    const insertSubMenu = menu[1][0];

    const orgImageInsert = insertSubMenu.content.find((item: any) => item.spec.label === 'Image');
    const indexOfOrgImageInsert = insertSubMenu.content.indexOf(orgImageInsert);
    if (indexOfOrgImageInsert !== -1) {
        insertSubMenu.content.splice(indexOfOrgImageInsert, 1);
    }

    insertSubMenu.content.push(new MenuItem({
        label: 'Table',
        select: (s) => !isInTable(s),
        run: (state, dispatch) => {
            const tr = state.tr.replaceSelectionWith(
                state.schema.nodes.table.create(
                    undefined,
                    Fragment.fromArray([
                        state.schema.nodes.table_row.create(undefined, Fragment.fromArray([
                            state.schema.nodes.table_cell.createAndFill(),
                            state.schema.nodes.table_cell.createAndFill()
                        ]))
                    ])
                )
            );

            if (dispatch) {
                dispatch(tr);
            }

            return true;
        }
    }));
    insertSubMenu.content.push(new MenuItem({
        label: 'File upload',
        run: () => {
            const tmpFileElement = document.createElement('input');
            tmpFileElement.type = 'file';

            tmpFileElement.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    /* noawait */onFileUpload(file);
                }
            };

            tmpFileElement.click();

            return true;
        }
    }));
    insertSubMenu.content.push(new MenuItem({
        label: 'Image upload',
        run: () => {
            const tmpFileElement = document.createElement('input');
            tmpFileElement.type = 'file';
            tmpFileElement.accept = 'image/*';
            (tmpFileElement as any).capture = 'camera';

            tmpFileElement.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    let imageElement: ChangeableImageRef | undefined = undefined;
                    switch(file.type) {
                        case 'image/png':
                        case 'image/gif':
                        case 'image/jpeg':
                            imageElement = addNewChangeableImageHandle();
                            break;
                    }
                    const uploadedImage = await onFileUpload(file);
                    if (imageElement) {
                        if (uploadedImage) {
                            imageElement.changeSource(`${ApplicationApiBaseUrl}/attachments/raw/${uploadedImage.id}`);
                        } else {
                            imageElement.removeImage();
                        }
                    }
                }
            };

            tmpFileElement.click();

            return true;
        }
    }));
    insertSubMenu.content.push(new MenuItem({
        label: 'Image by URL',
        enable: orgImageInsert.spec.enable,
        run: orgImageInsert.spec.run,
    }));

    // Customize existing menu entries
    const foundTyping = menu[1].find((x: any) => x.options.label === 'Type...');
    if (foundTyping) {
        foundTyping.options.label = 'Style';
    }
    menu[4] = menu[4].filter((x: any) => x.spec.title !== 'Select parent node');

    return menu;
}


interface PendingImageSpec {
    // eslint-disable-next-line @typescript-eslint/ban-types
    objRef: object; // Literally just the === check is used (ref check)
}
// Modified example from https://prosemirror.net/examples/upload/
const pendingImageManagerPlugin = new Plugin({
    state: {
        init() { return DecorationSet.empty; },
        apply(tr, set) {
            // Adjust decoration positions to changes made by the transaction
            set = set.map(tr.mapping, tr.doc);

            // See if the transaction adds or removes any placeholders
            const action = tr.getMeta(this);
            if (action && action.add) {
                const widget = document.createElement('placeholder');
                const deco = Decoration.widget(action.add.pos, widget, {objRef: action.add.objRef} as PendingImageSpec);
                set = set.add(tr.doc, [deco]);
            } else if (action && action.remove) {
                set = set.remove(set.find(null, null, (spec: PendingImageSpec) => spec.objRef == action.remove.objRef));
            }

            return set;
        }
    },
    props: {
        decorations(state) { return this.getState(state); }
    }
});

const reactPropsKey = new PluginKey("reactProps");

const useStyles = makeStyles(() =>
    createStyles({
        editor: {
            '& .ProseMirror': {
                maxHeight: '300px',
            }
        }
    })
);

interface LogbookMarkdownEditorProps {
    onFileUpload: (file: File) => Promise<AttachedFileInfo | undefined>;
    onHasContent: (hasContent: boolean) => void;
}
export interface LogbookMarkdownEditorInterface {
    getRawContent(): string;
    addNewChangeableImageHandle(): ChangeableImageRef;
}

// eslint-disable-next-line @typescript-eslint/ban-types
function findPlaceholder(state: EditorState, objRef: object) {
    const decos = pendingImageManagerPlugin.getState(state);
    const found = decos.find(null, null, (spec: PendingImageSpec) => spec.objRef == objRef);
    return found.length ? found[0].from : null;
}

const LogbookMarkdownEditor = forwardRef<LogbookMarkdownEditorInterface, LogbookMarkdownEditorProps>((props, ref) => {
    const classes = useStyles();

    const viewHost = useRef() as any;

    // Since prosemirror requires us to directly use a SVG "path" when replacing the icons
    // we have to create a hidden image for each icon we want to replace, in order to get the path
    const $boldIcon = useRef() as MutableRefObject<HTMLDivElement>;
    const $italicIcon = useRef() as MutableRefObject<HTMLDivElement>;
    const $linkIcon = useRef() as MutableRefObject<HTMLDivElement>;
    const $undoIcon = useRef() as MutableRefObject<HTMLDivElement>;
    const $redoIcon = useRef() as MutableRefObject<HTMLDivElement>;
    const $quoteIcon = useRef() as MutableRefObject<HTMLDivElement>;


    const $view = useRef<EditorView>(null) as any;

    function addNewChangeableImageHandle(): ChangeableImageRef {
        const imageRef = {};

        // Replace the selection with a placeholder
        const tr = $view.current.state.tr;
        if (!tr.selection.empty) {
            tr.deleteSelection();
        }

        tr.setMeta(pendingImageManagerPlugin, {add: {objRef: imageRef, pos: tr.selection.from}});
        $view.current.dispatch(tr);

        return {
            removeImage() {
                $view.current.dispatch(tr.setMeta(pendingImageManagerPlugin, {remove: {objRef: imageRef}}));
            },
            changeSource(src: string) {
                const pos = findPlaceholder($view.current.state, imageRef);
                $view.current.dispatch($view.current.state.tr
                    .replaceWith(pos, pos, schemaWithTable.nodes.image.create({src}))
                    .setMeta(pendingImageManagerPlugin, {remove: {objRef: imageRef}}));
            }
        };
    }

    useImperativeHandle(ref, () => ({
        getRawContent(): string {
            // we have to stringify it twice in order to preserve a string in graphql
            return JSON.stringify(JSON.stringify($view.current.state.doc.toJSON()));
        },
        addNewChangeableImageHandle,
    }));

    // Get all the paths we want to use
    const boldIconPath = $boldIcon.current?.querySelector('svg > path')?.getAttribute('d');
    const italicIconPath = $italicIcon.current?.querySelector('svg > path')?.getAttribute('d');
    const linkIconPath = $linkIcon.current?.querySelector('svg > path')?.getAttribute('d');
    const undoIconPath = $undoIcon.current?.querySelector('svg > path')?.getAttribute('d');
    const redoIconPath = $redoIcon.current?.querySelector('svg > path')?.getAttribute('d');
    const quoteIconPath = $quoteIcon.current?.querySelector('svg > path')?.getAttribute('d');

    const hasAllIcons =
        !!boldIconPath &&
        !!italicIconPath &&
        !!linkIconPath &&
        !!undoIconPath &&
        !!redoIconPath &&
        !!quoteIconPath;

    useEffect(() => { // initial render
        if (!hasAllIcons) {
            return;
        }

        const state = EditorState.create({schema: schemaWithTable, plugins: [
            tableEditing(), pendingImageManagerPlugin
        ].concat(exampleSetup({
                schema: schemaWithTable,
                menuContent: createMenu(props.onFileUpload, addNewChangeableImageHandle, {
                    bold: boldIconPath as string,
                    italic: italicIconPath as string,
                    link: linkIconPath as string,
                    undo: undoIconPath as string,
                    redo: redoIconPath as string,
                    quote: quoteIconPath as string,
                })
        }))});


        const emptyDocString = '{"type":"doc","content":[{"type":"paragraph"}]}';

        $view.current = new EditorView(viewHost.current, {
            state,
            dispatchTransaction(transaction) { // proxy dispatchTransaction function, to check has content
                const { state, transactions } = $view.current.state.applyTransaction(transaction);
                $view.current.updateState(state);

                if (transactions.some((tr: Transaction) => tr.docChanged)) {
                    props.onHasContent(JSON.stringify($view.current.state.doc.toJSON()) != emptyDocString);
                }
            }
        });
        props.onHasContent(JSON.stringify($view.current.state.doc.toJSON()) != emptyDocString);

        return () => $view.current.destroy();
    }, [hasAllIcons]);

    useEffect(() => { // every render
        if (!$view.current) {
            return;
        }
        const tr = $view.current.state.tr.setMeta(reactPropsKey, {});
        $view.current.dispatch(tr);
    });

    const theme = useTheme();

    const styleVars = {
        '--prose-mirror-bg-color': theme.palette.background.paper,
        '--prose-mirror-text-color': theme.palette.text.primary,
    } as React.CSSProperties;

    return <React.Fragment>
            <div id="hiddenIcons" style={{display: 'none'}}>
                <div ref={$boldIcon}>
                    <FormatBoldIcon />
                </div>
                <div ref={$italicIcon}>
                    <FormatItalicIcon />
                </div>
                <div ref={$linkIcon}>
                    <LinkIcon />
                </div>
                <div ref={$undoIcon}>
                    <UndoIcon />
                </div>
                <div ref={$redoIcon}>
                    <RedoIcon />
                </div>
                <div ref={$quoteIcon}>
                    <FormatQuoteIcon />
                </div>
            </div>
            <div id="editor" ref={viewHost} style={styleVars} className={classes.editor} />
        </React.Fragment>;
});

export default LogbookMarkdownEditor;
