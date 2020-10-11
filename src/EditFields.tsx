import {
  Checkbox,
  IconButton,
  Input,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableCellProps,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@material-ui/core";
import { Add, Close, Delete, Edit } from "@material-ui/icons";
import React, { memo, useCallback, useEffect } from "react";
import { useFormContext, UseFormMethods, useWatch } from "react-hook-form";
import {
  Cell,
  CellProps,
  Column,
  FilterProps,
  Row,
  SortByFn,
  TableInstance,
  useFilters,
  useSortBy,
  useTable,
} from "react-table";
import { defaultValues, Field } from "./App";
import { RouteComponentProps } from "@reach/router";

const booleanSort: SortByFn<Field> = (
  rowA: Row<Field>,
  rowB: Row<Field>,
  columnId: string
) => {
  const a: boolean = rowA.values[columnId];
  const b: boolean = rowB.values[columnId];
  if (a === b) {
    return 0;
  }
  if (a && !b) {
    return 1;
  }
  return -1;
};

const TextColumnFilter: React.FC<FilterProps<object>> = ({
  column: { Header, filterValue, setFilter },
}) => {
  let clearable = !!filterValue;
  return (
    <Input
      value={filterValue || ""}
      onChange={(e) => {
        setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
      }}
      placeholder={`search ${Header?.toString().toLowerCase()}`}
      endAdornment={
        clearable && (
          <IconButton onClick={() => setFilter(undefined)} size="small">
            <Close />
          </IconButton>
        )
      }
    />
  );
};

const booleanFields: { field: keyof Field; label: string }[] = [
  {
    field: "partOfKey",
    label: "Key?",
  },
  {
    field: "showInGrid",
    label: "Grid?",
  },
  {
    field: "showInPanel",
    label: "Panel?",
  },
  {
    field: "showInFilter",
    label: "Filter?",
  },
  {
    field: "showInBrowser",
    label: "Browser?",
  },
  {
    field: "required",
    label: "Required?",
  },
  {
    field: "readOnly",
    label: "Read Only?",
  },
  {
    field: "primaryName",
    label: "Primary Name?",
  },
];

const fieldColumns: Column<Field>[] = [
  {
    Header: "Name",
    id: "name",
    accessor: (row: Field) => row.name,
    Filter: TextColumnFilter,
  },
  ...booleanFields.map(({ field, label }) => ({
    Header: label,
    id: field,
    accessor: (row: any) => row[field],
    Cell: ({
      // value,
      row: { index },
    }: Cell<Field, boolean>) => {
      const formMethods = useFormContext();
      const { setValue, control } = formMethods;
      const key = `fields[${index}].${field}`;
      const value = useWatch({ name: key, control });
      return (
        <Checkbox
          checked={value}
          onChange={(_e, value) => {
            setValue(key, value);
            PerformanceHack(formMethods)();
          }}
        />
      );
    },
    sortType: booleanSort,
    disableFilters: true,
    CheckAll: ({ column }: { column: Column<Field> }) => {
      const formMethods = useFormContext();
      const values = formMethods.getValues().fields || empty;
      // reason why watchValues is not same as values is probably because
      // `watch` happened after `register`, and after register, it didn't
      // re-render, so watch never have a chance to get latest values
      // const watchValues = useWatch<Field[]>({
      useWatch<Field[]>({
        name: "fields",
        control: formMethods.control,
        defaultValue: empty,
      });
      const id = column.id as keyof Field;
      let all: boolean | undefined;
      let some: boolean | undefined;
      values.forEach((f: Field) => {
        if (f[id] as boolean) {
          some = true;
        } else {
          all = false;
        }
      });
      all = all === undefined && values.length !== 0;
      return (
        <Checkbox
          indeterminate={!all && some}
          checked={all}
          onChange={(_e, value) => {
            values.forEach((_f: Field, idx: number) => {
              const key = `fields[${idx}].${id}`;
              formMethods.setValue(key, value);
              PerformanceHack(formMethods)();
            });
          }}
        />
      );
    },
  })),
];

const useStyles = makeStyles({
  actions: {
    display: "flex",
  },
  headerCell: {
    whiteSpace: "nowrap",
  },
});

// in order to reduce re-render, we have to use a fake field to trigger dirty state
type PartialRequired<T, K extends keyof T> = Pick<T, K> & Partial<T>;
const PerformanceHackKey = "__internal_performance_hack";
const PerformanceHack = ({
  setValue,
}: PartialRequired<UseFormMethods, "setValue">) => () =>
  setValue(PerformanceHackKey, PerformanceHackKey, { shouldDirty: true });

const empty: Field[] = [];

export function EditFields(props: RouteComponentProps) {
  const classes = useStyles();
  const formMethods = useFormContext();
  const { register, getValues } = formMethods;

  const data = getValues().fields || empty;
  useEffect(() => {
    for (let i = 0; i < data.length; i++) {
      for (const k in defaultValues.fields[0]) {
        register(`fields[${i}].${k}`);
      }
    }
  }, [data.length, register]);

  useEffect(() => {
    register(PerformanceHackKey);
  }, [register]);

  // const {} = useFieldArray({ name: 'fields', control: form })

  // TODO: getTableProps changed during activate dialog box, investigate
  const {
    getTableProps, // this somehow changes even when data didn't change
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns: fieldColumns,
      data,
      getRowId: useCallback((row) => row.id, []),
    },
    useFilters,
    useSortBy,
    (hooks) => {
      hooks.allColumns.push((columns) => [
        {
          id: "editItem",
          Header: () => (
            <IconButton
              color="primary"
              aria-label="new"
              onClick={() => alert("todo")}
            >
              <Add />
            </IconButton>
          ),
          Cell: ({ row }: CellProps<Field>) => (
            <span className={classes.actions}>
              <IconButton
                color="primary"
                size="small"
                aria-label="edit"
                onClick={() => alert("TODO: edit")}
              >
                <Edit />
              </IconButton>
              <IconButton
                color="primary"
                size="small"
                aria-label="delete"
                onClick={() => alert("TODO: delete")}
              >
                <Delete />
              </IconButton>
            </span>
          ),
        },
        ...columns,
      ]);
      hooks.getHeaderProps.push((props, { column }) => {
        const extraProps: TableCellProps = {};
        if (column.id === "editItem") {
          extraProps.padding = "checkbox";
        }
        return { ...props, ...extraProps };
      });
      hooks.getCellProps.push((props, { cell }) => {
        const extraProps: TableCellProps = {};
        if (cell.column.id === "editItem") {
          extraProps.padding = "checkbox";
        }
        return { ...props, ...extraProps };
      });
    }
  );

  return (
    <TableContainer>
      {/*
      <Watched />
      <Button onClick={PerformanceHack(formMethods)}>test</Button>
       */}
      <FieldsTable
        headerGroups={headerGroups}
        rows={rows}
        prepareRow={prepareRow}
        classes={classes}
      />
    </TableContainer>
  );
}

type FieldTableProps = {
  classes: any;
  // createHandleCheck: (field: keyof Field) => (e: MouseEvent, checked: boolean) => void
} & PartialRequired<
  TableInstance<Field>,
  "headerGroups" | "rows" | "prepareRow"
>;

const FieldsTable = memo(
  ({ headerGroups, rows, prepareRow, classes }: FieldTableProps) => (
    <Table>
      <TableHead>
        {headerGroups.map((headerGroup) => (
          <TableRow {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <TableCell
                {...column.getHeaderProps(
                  column.getSortByToggleProps({ className: classes.headerCell })
                )}
              >
                {column.render("Header")}
                {column.canSort && (
                  <TableSortLabel
                    active={column.isSorted}
                    direction={column.isSortedDesc ? "desc" : "asc"}
                  />
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
        {headerGroups.map((headerGroup) => (
          <TableRow {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <TableCell {...column.getHeaderProps()}>
                {column.canFilter
                  ? column.render("Filter")
                  : column.canSort
                  ? column.render("CheckAll")
                  : null}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody>
        {rows.map((row) => {
          prepareRow(row);
          return (
            <TableRow {...row.getRowProps()}>
              {row.cells.map((cell) => (
                <TableCell {...cell.getCellProps()}>
                  {cell.render("Cell")}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  )
);
