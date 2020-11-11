import * as ProseMirrorMarkdown from "prosemirror-markdown";
import * as ProseMirrorSchemaBasic from "prosemirror-schema-basic";
const baseSchema = (ProseMirrorSchemaBasic as any).schema;

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-menu/style/menu.css';
import './LogbookMarkdownEditor.css';

import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import React, {forwardRef, useEffect, useImperativeHandle, useRef} from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import {Dropdown, MenuItem} from "prosemirror-menu";
import {
    addColumnAfter,
    addColumnBefore,
    addRowAfter,
    addRowBefore,
    deleteColumn,
    deleteRow,
    deleteTable, fixTables, goToNextCell, isInTable,
    mergeCells,
    setCellAttr,
    splitCell,
    tableEditing,
    tableNodes,
    toggleHeaderCell,
    toggleHeaderColumn,
    toggleHeaderRow
} from "prosemirror-tables";
import {DOMParser, Schema, Fragment}  from "prosemirror-model";

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

console.log(schema.spec);

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
    item("Toggle header column", toggleHeaderColumn),
    item("Toggle header row", toggleHeaderRow),
    item("Toggle header cells", toggleHeaderCell),
    item("Make cell green", setCellAttr("background", "#dfd")),
    item("Make cell not-green", setCellAttr("background", null))
];
menu.splice(2, 0, [new Dropdown(tableMenu, {label: "Table"})]);
menu[1][0].content.push(new MenuItem({
    label: 'Table',
    select: (s) => !isInTable(s),
    run: (state, dispatch, view) => {
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
console.log(menu[1][0].content[1]);


const reactPropsKey = new PluginKey("reactProps");

function reactProps(initialProps: any) {
    return new Plugin({
        key: reactPropsKey,
        state: {
            init: () => initialProps,
            apply: (tr, prev) => tr.getMeta(reactPropsKey) || prev,
        },
    });
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        editor: {
            '& .ProseMirror': {
                maxHeight: '300px',
            }
        }
    })
);
const LogbookMarkdownEditor = forwardRef((props, ref) => {
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
        }
    }));

    useEffect(() => { // initial render
        let state = EditorState.create({schema, plugins: [
            tableEditing(),
        ].concat(exampleSetup({schema, menuContent: menu}))});

        const fix = fixTables(state);
        if (fix)
            state = state.apply(fix.setMeta("addToHistory", false));

        view.current = new EditorView(viewHost.current, { state });

        return () => view.current.destroy();
    }, []);

    useEffect(() => { // every render
        const tr = view.current.state.tr.setMeta(reactPropsKey, {});
        view.current.dispatch(tr);
    });

    return <div id="editor" ref={viewHost} className={classes.editor} />;
});

export default LogbookMarkdownEditor;
