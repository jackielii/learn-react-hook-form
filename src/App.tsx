import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  TextField,
  TextFieldProps,
  Typography,
  makeStyles,
} from "@material-ui/core";
import { navigate, RouteComponentProps, Router } from "@reach/router";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import { EditFields } from "./EditFields";

export type Field = {
  id: number;
  name: string;
  showInGrid: boolean;
  showInPanel: boolean;
  showInFilter: boolean;
  showInBrowser: boolean;
  partOfKey: boolean;
  required: boolean;
  readOnly: boolean;
  foreignKey: boolean;
  primaryName: boolean;
};

export type View = {
  id: number;
  name: string;
  label: string;
  fields: Field[];
};

export const defaultValues: View = {
  id: 1,
  name: "user",
  label: "User",
  fields: [],
};

for (let i = 1; i < 50; i++) {
  defaultValues.fields.push({
    id: i,
    name: `row_${i}`,
    showInGrid: false,
    showInPanel: false,
    showInFilter: false,
    showInBrowser: false,
    partOfKey: false,
    required: false,
    readOnly: false,
    foreignKey: false,
    primaryName: false,
  });
}

function mockData(): View {
  return {
    ...defaultValues,
    fields: defaultValues.fields.map((f) => ({
      ...f,
      showInGrid: Math.random() > 0.5,
      showInPanel: Math.random() > 0.5,
      showInFilter: Math.random() > 0.5,
      showInBrowser: Math.random() > 0.5,
      partOfKey: Math.random() > 0.5,
      required: Math.random() > 0.5,
      readOnly: Math.random() > 0.5,
      foreignKey: Math.random() > 0.5,
      primaryName: Math.random() > 0.5,
    })),
  };
}

function App() {
  // react-hook-form uses the instance of the data, hence the deep cloning
  const [data, setData] = useState(JSON.parse(JSON.stringify(defaultValues)));
  const formMethods = useForm({
    defaultValues: data,
    // somehow shouldUnregister needs to be here, otherwise fields
    // would be empty
    shouldUnregister: false,
  });
  useEffect(() => {
    // mock server data fetch
    setTimeout(() => setData(mockData()), 1000);
  }, []);
  useEffect(() => {
    reset(data);
  }, [data, reset]);
  const { reset, formState, handleSubmit, setValue } = formMethods;
  return (
    <FormProvider {...formMethods}>
      <Card style={{ margin: "16px" }}>
        <CardHeader
          title={
            <Typography variant="h6" noWrap>
              Edit View
            </Typography>
          }
          action={
            <>
              <Button onClick={() => navigate("/")}>General</Button>
              <Button onClick={() => navigate("fields")}>fields</Button>
            </>
          }
        />
        <CardContent>
          <Router>
            <GeneralForm path="/" />
            <EditFields path="fields" />
          </Router>
        </CardContent>
        <CardActions>
          <Button
            size="large"
            disabled={!formState.isDirty}
            color="primary"
            onClick={() => {
              reset(JSON.parse(JSON.stringify(defaultValues)));
              // reset doesn't seem to reset nested values. setting them manually
              for (let i = 0; i < defaultValues.fields.length; i++) {
                const field = defaultValues.fields[i];
                for (let [k, v] of Object.entries(field)) {
                  setValue(`fields[${i}].${k}`, v);
                }
              }
            }}
          >
            reset
          </Button>
          <Button
            size="large"
            disabled={!formState.isDirty}
            color="primary"
            onClick={handleSubmit(console.log)}
          >
            save
          </Button>
        </CardActions>
      </Card>
    </FormProvider>
  );
}

export type FieldConfig<D> = {
  name: keyof D | string;
  label: string;
} & TextFieldProps;

const useStyles = makeStyles({
  field: {
    marginTop: 16,
  },
});

const fields: FieldConfig<View>[] = [
  { name: "name", label: "Name", required: true },
  { name: "label", label: "Label", fullWidth: true },
];

function GeneralForm(props: RouteComponentProps) {
  const { control, errors } = useFormContext();
  const classes = useStyles();
  return (
    <>
      {fields.map(({ name, required, ...rest }) => (
        <Controller
          key={name}
          control={control}
          name={name}
          rules={{ required: required && `${name} is required` }} // TODO: translate
          render={({ onChange, onBlur, value }) => (
            <TextField
              {...rest}
              id={name}
              className={classes.field}
              name={name}
              required={required}
              error={!!errors[name]}
              helperText={errors[name]?.message}
              onChange={onChange}
              onBlur={onBlur}
              value={value}
              variant="outlined"
            />
          )}
        />
      ))}
    </>
  );
}

export default App;
