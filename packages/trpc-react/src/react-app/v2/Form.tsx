import Editor from "@monaco-editor/react";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ClearIcon from "@mui/icons-material/Clear";
// Icons
import SendIcon from "@mui/icons-material/Send";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import JsonForm from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import {
  createProcedureFetcher,
  type TRPCErrorResponse,
} from "@src/client/fetcher";
import type { NormalizedFieldErrors } from "trpc-parser";
import { sample } from "@stoplight/json-schema-sampler";
import { JsonViewer } from "@textea/json-viewer";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";
import { useState } from "react";
import type { Procedure } from "trpc-parser";
import { useRenderOptions } from "../components/contexts/OptionsContext";
import { DocumentationSection } from "./DocumentationSection";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 1.5 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    "aria-controls": `simple-tabpanel-${index}`,
    id: `simple-tab-${index}`,
  };
}

// Convert tRPC fieldErrors to RJSF errors format
// RJSF expects nested objects: { parentField: { childField: { __errors: ["error"] } } }
// We convert dot-notation paths to nested structure
function convertFieldErrorsToRjsf(
  fieldErrors: NormalizedFieldErrors | undefined,
): Record<string, any> | undefined {
  if (!fieldErrors?.fieldErrors) return undefined;

  const result: Record<string, any> = {};

  for (const [dotPath, messages] of Object.entries(fieldErrors.fieldErrors)) {
    // Convert dot-notation path to nested structure
    const pathSegments = dotPath.split(".");
    let current: Record<string, any> = result;

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      if (!segment) continue;
      const isLast = i === pathSegments.length - 1;

      if (isLast) {
        current[segment] = { __errors: messages };
      } else {
        if (!current[segment]) {
          current[segment] = {};
        }
        current = current[segment];
      }
    }
  }

  return result;
}

export function Form({ procedure }: { procedure: Procedure }) {
  const { options } = useRenderOptions();

  const [data, setData] = useState<any>({});
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    data?: any;
    error?: TRPCErrorResponse;
    time?: number;
    size?: number;
  } | null>(null);

  const fetcher = createProcedureFetcher({
    baseUrl: options.url,
    transformer: options.transformer,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    void event; // unused but required by MUI Tabs API
    setTabValue(newValue);
  };

  const handleEditorChange = (value: string | undefined) => {
    try {
      const parsedData = JSON.parse(value ?? "{}");
      setData(parsedData);
    } catch (_e) {
      // Handle parsing error silently
    }
  };

  const handleClear = () => {
    setData({});
  };

  const handleAutofill = () => {
    if (procedure.schema) {
      try {
        const sampleData = sample(procedure.schema);
        setData(sampleData || {});
      } catch (e) {
        console.error("Error generating sample data:", e);
      }
    }
  };

  const handleSend = async () => {
    if (!procedure) return;

    setLoading(true);
    const startTime = Date.now();

    try {
      const result = await fetcher(procedure, {
        input: data,
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const responseSize = JSON.stringify(result).length;

      setResponse({
        data: result,
        size: responseSize,
        time: responseTime,
      });
    } catch (error) {
      console.log(error);
      setResponse({
        error: error as TRPCErrorResponse,
      });
    } finally {
      setLoading(false);
    }
  };

  // Get errors for the form (only show when in Form View tab and there's fieldErrors)
  // tRPC nests error data under .json property, but we also check .data for compatibility
  const fieldErrorsData =
    response?.error?.json?.data?.fieldErrors ??
    response?.error?.data?.fieldErrors;
  const formErrors =
    tabValue === 0 && fieldErrorsData
      ? convertFieldErrorsToRjsf(fieldErrorsData)
      : undefined;

  return (
    <div className="m-2 bg-white">
      {/* Documentation Section */}
      <DocumentationSection meta={procedure.meta} schema={procedure.schema} />

      {/* Input Section */}
      <Paper elevation={2} sx={{ mb: 2 }}>
        <Box sx={{ width: "100%" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="editing mode tabs"
            >
              {procedure.schema && <Tab label="Form View" {...a11yProps(0)} />}
              <Tab label="JSON View" {...a11yProps(procedure.schema ? 1 : 0)} />
            </Tabs>
          </Box>
          {procedure.schema && (
            <CustomTabPanel value={tabValue} index={0}>
              <JsonForm
                validator={validator}
                schema={procedure.schema}
                formData={data}
                extraErrors={formErrors}
                extraErrorsBlockSubmit={!!formErrors}
                onChange={({ formData }) => {
                  setData(formData || {});
                  // Clear errors when user modifies the form
                  if (response?.error) {
                    setResponse(null);
                  }
                }}
              >
                {/* This div is needed to ensure there is no default submit button */}
                <div />
              </JsonForm>
            </CustomTabPanel>
          )}
          <CustomTabPanel value={tabValue} index={procedure.schema ? 1 : 0}>
            <Editor
              defaultLanguage="json"
              options={{
                formatOnType: true,
                minimap: {
                  enabled: false,
                },
              }}
              height={"25vh"}
              // edit raw data
              value={JSON.stringify(data, null, 2)}
              onChange={handleEditorChange}
            />
          </CustomTabPanel>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              pb: 1.5,
              pt: 0.5,
              px: 2,
            }}
          >
            <ButtonGroup variant="outlined" size="small">
              <Button
                onClick={handleClear}
                startIcon={<ClearIcon />}
                size="small"
              >
                Clear
              </Button>
              {procedure.schema && (
                <Button
                  onClick={handleAutofill}
                  startIcon={<AutoFixHighIcon />}
                  size="small"
                >
                  Autofill
                </Button>
              )}
            </ButtonGroup>

            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleSend}
              startIcon={
                loading ? <CircularProgress size={16} /> : <SendIcon />
              }
              disabled={loading}
            >
              Send
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Response Section */}
      {response && (
        <Paper elevation={2}>
          <Box
            sx={{
              alignItems: "center",
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              px: 2,
              py: 1,
            }}
          >
            <Typography
              variant="body2"
              component="div"
              sx={{
                color: response.error ? "error.main" : "text.secondary",
                fontWeight: 500,
              }}
            >
              {response.error
                ? "Error"
                : `Response ${response.size ? `(${prettyBytes(response.size)})` : ""} ${response.time ? `(${prettyMs(response.time)})` : ""}`}
            </Typography>
          </Box>

          {response.error ? (
            <Box sx={{ p: 1.5 }}>
              <Typography color="error.main" variant="body2">
                {response.error.json?.message ||
                  response.error.message ||
                  "Unknown error occurred"}
              </Typography>
              {response.error.json?.data?.stack && (
                <Box
                  sx={{
                    bgcolor: "rgba(0, 0, 0, 0.03)",
                    borderRadius: 1,
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    mt: 1.5,
                    overflow: "auto",
                    p: 1.5,
                  }}
                >
                  <pre>{response.error.json.data.stack}</pre>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ p: 1.5 }}>
              <JsonViewer
                highlightUpdates
                rootName={false}
                value={response.data}
                quotesOnKeys={false}
                displayDataTypes={false}
                displaySize={false}
              />
            </Box>
          )}
        </Paper>
      )}
    </div>
  );
}
