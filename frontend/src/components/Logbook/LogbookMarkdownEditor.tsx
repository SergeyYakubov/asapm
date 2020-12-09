import * as ProseMirrorMarkdown from "prosemirror-markdown";
import * as ProseMirrorSchemaBasic from "prosemirror-schema-basic";
const baseSchema = (ProseMirrorSchemaBasic as any).schema;

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-menu/style/menu.css';
import './LogbookMarkdownEditor.css';

import {EditorState, PluginKey, Transaction} from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import React, {forwardRef, useEffect, useImperativeHandle, useRef} from "react";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import {Dropdown, MenuItem} from "prosemirror-menu";
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {exampleSetup, buildMenuItems} = require('prosemirror-example-setup');

const schema = new Schema({
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

function createMenu(onFileUpload: (file: File) => void): any {
    const menu = buildMenuItems(schema).fullMenu;
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

    // Push into the "insert" menu
    menu[1][0].content.push(new MenuItem({
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
        }}));
    menu[1][0].content.push(new MenuItem({
        label: 'File',
        run: () => {
            const tmpFileElement = document.createElement('input');
            tmpFileElement.type = 'file';

            tmpFileElement.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    onFileUpload(file);
                }
            };

            tmpFileElement.click();

            return true;
        }}));

    // Customize existing menu entries
    const foundTyping = menu[1].find((x: any) => x.options.label === 'Type...');
    if (foundTyping) {
        foundTyping.options.label = 'Style';
    }
    menu[4] = menu[4].filter((x: any) => x.spec.title !== 'Select parent node');

    return menu;
}

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
    onFileUpload: (file: File) => void;
    onHasContent: (hasContent: boolean) => void;
}
export interface LogbookMarkdownEditorInterface {
    getRawContent(): string;
}

const LogbookMarkdownEditor = forwardRef<LogbookMarkdownEditorInterface, LogbookMarkdownEditorProps>((props, ref) => {
    const classes = useStyles();

    const viewHost = useRef() as any;
    const view = useRef<EditorView>(null) as any;

    useImperativeHandle(ref, () => ({
        getRawContent(): string {
            console.log(ProseMirrorMarkdown.defaultMarkdownSerializer);
            ProseMirrorMarkdown.defaultMarkdownSerializer.nodes['table'] = function(state, node) {
                state.ensureNewLine();
                state.write('abc');
                state.closeBlock(node);
            };
            console.log(view.current.state.schema);
            return ProseMirrorMarkdown.defaultMarkdownSerializer.serialize(view.current.state.doc);
        },
    }));

    useEffect(() => { // initial render
        const state = EditorState.create({schema, plugins: [
            tableEditing(),
        ].concat(exampleSetup({schema, menuContent: createMenu(props.onFileUpload)}))});

        view.current = new EditorView(viewHost.current, {
            state,
            dispatchTransaction(transaction) { // proxy dispatchTransaction function, to check has content
                const { state, transactions } = view.current.state.applyTransaction(transaction);
                view.current.updateState(state);

                if (transactions.some((tr: Transaction) => tr.docChanged)) {
                    props.onHasContent(!!ProseMirrorMarkdown.defaultMarkdownSerializer.serialize(state.doc).length);
                }
            }
        });
        props.onHasContent(!!ProseMirrorMarkdown.defaultMarkdownSerializer.serialize(state.doc).length);

        return () => view.current.destroy();
    }, []);

    useEffect(() => { // every render
        const tr = view.current.state.tr.setMeta(reactPropsKey, {});
        view.current.dispatch(tr);
    });

    return <div id="editor" ref={viewHost} className={classes.editor} />;
});

export default LogbookMarkdownEditor;
