import React, { useState, useEffect } from "react";
import {
  BiCopy,
  BiFolderOpen,
  BiPlus,
  BiSave,
  BiSend,
  BiTrash,
  BiGlobe,
  BiCog,
  BiEdit,
  BiCheck,
  BiX,
  BiImport,
} from "react-icons/bi";

interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  description?: string;
}

interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
  baseUrl?: string;
  description?: string;
}

interface RequestData {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: KeyValue[];
  queryParams: KeyValue[];
  body: string;
  bodyType: "json" | "text";
  timestamp: number;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  duration: number;
}

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
];

const DEFAULT_ENVIRONMENTS: Environment[] = [
  {
    id: "dev",
    name: "Development",
    variables: [
      {
        id: "1",
        key: "API_URL",
        value: "http://localhost:3000",
        description: "Local development server",
      },
      {
        id: "2",
        key: "API_KEY",
        value: "dev-key-123",
        description: "Development API key",
      },
    ],
    baseUrl: "http://localhost:3000",
    description: "Local development environment",
  },

];

const RequestComposer: React.FC = () => {
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState<KeyValue[]>([
    { id: "1", key: "Content-Type", value: "application/json", enabled: true },
  ]);
  const [queryParams, setQueryParams] = useState<KeyValue[]>([]);
  const [body, setBody] = useState(
    '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}'
  );
  const [bodyType, setBodyType] = useState<"json" | "text">("json");
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRequests, setSavedRequests] = useState<RequestData[]>([]);
  const [requestName, setRequestName] = useState("");

  // Environment management state
  const [environments, setEnvironments] =
    useState<Environment[]>(DEFAULT_ENVIRONMENTS);
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment>(
    DEFAULT_ENVIRONMENTS[0]
  );
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [newEnvName, setNewEnvName] = useState("");
  const [newEnvDescription, setNewEnvDescription] = useState("");

  // Load saved data on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedRequests") || "[]");
    setSavedRequests(saved);

    const savedEnvs = JSON.parse(localStorage.getItem("environments") || "[]");
    if (savedEnvs.length > 0) {
      setEnvironments(savedEnvs);
      const savedCurrentEnv = localStorage.getItem("currentEnvironment");
      if (savedCurrentEnv) {
        const currentEnv = savedEnvs.find(
          (env: Environment) => env.id === savedCurrentEnv
        );
        if (currentEnv) {
          setCurrentEnvironment(currentEnv);
        }
      }
    }
  }, []);

  // Save environments when they change
  useEffect(() => {
    localStorage.setItem("environments", JSON.stringify(environments));
    localStorage.setItem("currentEnvironment", currentEnvironment.id);
  }, [environments, currentEnvironment]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Environment variable interpolation
  const interpolateVariables = (text: string): string => {
    let result = text;
    currentEnvironment.variables.forEach((variable) => {
      const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, "g");
      result = result.replace(regex, variable.value);
    });
    return result;
  };

  const addKeyValue = (
    list: KeyValue[],
    setter: React.Dispatch<React.SetStateAction<KeyValue[]>>
  ) => {
    const newItem: KeyValue = {
      id: generateId(),
      key: "",
      value: "",
      enabled: true,
    };
    setter([...list, newItem]);
  };

  const updateKeyValue = (
    id: string,
    field: keyof KeyValue,
    value: string | boolean,
    list: KeyValue[],
    setter: React.Dispatch<React.SetStateAction<KeyValue[]>>
  ) => {
    const updated = list.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setter(updated);
  };

  const removeKeyValue = (
    id: string,
    list: KeyValue[],
    setter: React.Dispatch<React.SetStateAction<KeyValue[]>>
  ) => {
    setter(list.filter((item) => item.id !== id));
  };

  const buildUrl = () => {
    const interpolatedUrl = interpolateVariables(url.trim());
    const enabledParams = queryParams.filter(
      (p) => p.enabled && p.key && p.value
    );

    if (enabledParams.length === 0) return interpolatedUrl;

    const params = new URLSearchParams();
    enabledParams.forEach((param) => {
      params.append(param.key, interpolateVariables(param.value));
    });

    return `${interpolatedUrl}${
      interpolatedUrl.includes("?") ? "&" : "?"
    }${params.toString()}`;
  };

  const buildHeaders = () => {
    const result: Record<string, string> = {};
    headers
      .filter((h) => h.enabled && h.key)
      .forEach((header) => {
        result[header.key] = interpolateVariables(header.value);
      });
    return result;
  };

  const validateJson = (text: string): boolean => {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  };

  const sendRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const startTime = Date.now();
      const requestUrl = buildUrl();
      const requestHeaders = buildHeaders();

      const options: RequestInit = {
        method,
        headers: requestHeaders,
      };

      if (method !== "GET" && method !== "HEAD" && body.trim()) {
        const interpolatedBody = interpolateVariables(body);
        if (bodyType === "json" && !validateJson(interpolatedBody)) {
          throw new Error("Invalid JSON in request body");
        }
        options.body = interpolatedBody;
      }

      const res = await fetch(requestUrl, options);
      const endTime = Date.now();

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseBody = await res.text();

      const responseData: ResponseData = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        timestamp: endTime,
        duration: endTime - startTime,
      };

      setResponse(responseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const saveRequest = () => {
    const name = requestName.trim() || `${method} ${url}`;
    const request: RequestData = {
      id: generateId(),
      name,
      url,
      method,
      headers: [...headers],
      queryParams: [...queryParams],
      body,
      bodyType,
      timestamp: Date.now(),
    };

    const updated = [...savedRequests, request];
    setSavedRequests(updated);
    localStorage.setItem("savedRequests", JSON.stringify(updated));
    setRequestName("");
  };

  const loadRequest = (request: RequestData) => {
    setUrl(request.url);
    setMethod(request.method);
    setHeaders(request.headers);
    setQueryParams(request.queryParams);
    setBody(request.body);
    setBodyType(request.bodyType);
  };

  const deleteRequest = (id: string) => {
    const updated = savedRequests.filter((r) => r.id !== id);
    setSavedRequests(updated);
    localStorage.setItem("savedRequests", JSON.stringify(updated));
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response.body);
    }
  };

  // Environment management functions
  const switchEnvironment = (env: Environment) => {
    setCurrentEnvironment(env);
  };

  const createEnvironment = () => {
    if (!newEnvName.trim()) return;

    const newEnv: Environment = {
      id: generateId(),
      name: newEnvName,
      variables: [],
      description: newEnvDescription,
    };

    setEnvironments([...environments, newEnv]);
    setNewEnvName("");
    setNewEnvDescription("");
    setShowEnvModal(false);
  };

  const updateEnvironment = (env: Environment) => {
    const updated = environments.map((e) => (e.id === env.id ? env : e));
    setEnvironments(updated);
    if (currentEnvironment.id === env.id) {
      setCurrentEnvironment(env);
    }
  };

  const deleteEnvironment = (id: string) => {
    if (environments.length <= 1) return; // Keep at least one environment

    const updated = environments.filter((e) => e.id !== id);
    setEnvironments(updated);

    if (currentEnvironment.id === id) {
      setCurrentEnvironment(updated[0]);
    }
  };

  const addEnvironmentVariable = (envId: string) => {
    const env = environments.find((e) => e.id === envId);
    if (!env) return;

    const newVar: EnvironmentVariable = {
      id: generateId(),
      key: "",
      value: "",
      description: "",
    };

    const updatedEnv = {
      ...env,
      variables: [...env.variables, newVar],
    };

    updateEnvironment(updatedEnv);
  };

  const updateEnvironmentVariable = (
    envId: string,
    varId: string,
    field: keyof EnvironmentVariable,
    value: string
  ) => {
    const env = environments.find((e) => e.id === envId);
    if (!env) return;

    const updatedVars = env.variables.map((v) =>
      v.id === varId ? { ...v, [field]: value } : v
    );

    const updatedEnv = {
      ...env,
      variables: updatedVars,
    };

    updateEnvironment(updatedEnv);
  };

  const removeEnvironmentVariable = (envId: string, varId: string) => {
    const env = environments.find((e) => e.id === envId);
    if (!env) return;

    const updatedVars = env.variables.filter((v) => v.id !== varId);
    const updatedEnv = {
      ...env,
      variables: updatedVars,
    };

    updateEnvironment(updatedEnv);
  };

  const KeyValueTable: React.FC<{
    data: KeyValue[];
    setter: React.Dispatch<React.SetStateAction<KeyValue[]>>;
    title: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
  }> = ({
    data,
    setter,
    title,
    keyPlaceholder = "Key",
    valuePlaceholder = "Value",
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">{title}</h3>
        <button
          onClick={() => addKeyValue(data, setter)}
          className="flex items-center gap-1 px-2 py-1 text-blue-500  rounded-full hover:bg-blue-600"
        >
          <BiPlus size={14} />
        
        </button>
      </div>
      <div className="space-y-1">
        {data.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(e) =>
                updateKeyValue(
                  item.id,
                  "enabled",
                  e.target.checked,
                  data,
                  setter
                )
              }
              className="w-4 h-4"
            />
            <input
              type="text"
              placeholder={keyPlaceholder}
              value={item.key}
              onChange={(e) =>
                updateKeyValue(item.id, "key", e.target.value, data, setter)
              }
              className="flex-1 px-2 py-1 border rounded"
            />
            <input
              type="text"
              placeholder={valuePlaceholder}
              value={item.value}
              onChange={(e) =>
                updateKeyValue(item.id, "value", e.target.value, data, setter)
              }
              className="flex-1 px-2 py-1 border rounded"
            />
            <button
              onClick={() => removeKeyValue(item.id, data, setter)}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <BiTrash size={14} />
            </button>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-gray-500 italic">
            No {title.toLowerCase()} added
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {/* Environment Bar */}
      <div className="bg-gray-200/20 border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BiGlobe className="text-gray-600" size={20} />
          <span className="font-medium text-gray-700">Environment:</span>
          <select
            value={currentEnvironment.id}
            onChange={(e) => {
              const env = environments.find((env) => env.id === e.target.value);
              if (env) switchEnvironment(env);
            }}
            className="px-3 py-1 border rounded-full bg-white"
          >
            {environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
          </select>
          <span className=" text-gray-500">
            {currentEnvironment.description}
          </span>
        </div>
        <button
          onClick={() => setShowEnvModal(true)}
          className="flex items-center gap-1 px-3 py-1 text-blue-500 bg-blue-300/10 border border-blue-500 rounded-full hover:bg-blue-600"
        >
          <BiCog size={14} />
          Manage Environments
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        {/* Request Panel */}
        <div className="flex flex-col h-full">
          <div className="rounded p-4">
            <h2 className="font-bold mb-4 text-gray-800">Request Composer</h2>

            {/* URL and Method */}
            <div className="flex gap-2 mb-4">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="px-3 py-1 border rounded-full font-medium"
              >
                {HTTP_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL (use {{variable}} for environment variables)"
                className="flex-1 px-3 py-1 border rounded-full"
              />
            </div>

            {/* Environment Variables Preview */}
            {currentEnvironment.variables.length > 0 && (
              <div className="mb-4 p-2 bg-blue-50 rounded border">
                <h4 className=" font-medium text-blue-800 mb-1">
                  Available Variables:
                </h4>
                <div className=" text-blue-600 flex flex-wrap gap-2">
                  {currentEnvironment.variables.map((variable) => (
                    <span
                      key={variable.id}
                      className="bg-blue-100 px-2 py-1 rounded"
                    >
                      {`{{${variable.key}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Headers */}
            <KeyValueTable
              data={headers}
              setter={setHeaders}
              title="Headers"
              keyPlaceholder="Header name"
              valuePlaceholder="Header value (use {{variable}} for env vars)"
            />

            {/* Query Parameters */}
            <div className="mt-4">
              <KeyValueTable
                data={queryParams}
                setter={setQueryParams}
                title="Query Parameters"
                keyPlaceholder="Parameter name"
                valuePlaceholder="Parameter value (use {{variable}} for env vars)"
              />
            </div>

            {/* Request Body */}
            {method !== "GET" && method !== "HEAD" && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700">Request Body</h3>
                  <div className="flex bg-gray-100 rounded">
                    <button
                      onClick={() => setBodyType("json")}
                      className={`px-3 py-1 rounded ${
                        bodyType === "json"
                          ? "bg-blue-500 text-white"
                          : "text-gray-600"
                      }`}
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => setBodyType("text")}
                      className={`px-3 py-1 rounded ${
                        bodyType === "text"
                          ? "bg-blue-500 text-white"
                          : "text-gray-600"
                      }`}
                    >
                      Text
                    </button>
                  </div>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    bodyType === "json"
                      ? "Enter JSON... (use {{variable}} for env vars)"
                      : "Enter text... (use {{variable}} for env vars)"
                  }
                  className="w-full h-32 px-3 py-1 border rounded font-mono"
                />
                {bodyType === "json" &&
                  body &&
                  !validateJson(interpolateVariables(body)) && (
                    <div className="text-red-500">
                      Invalid JSON format after variable interpolation
                    </div>
                  )}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={sendRequest}
              disabled={loading || !url.trim()}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-400"
            >
              <BiSend size={16} />
              {loading ? "Sending..." : "Send Request"}
            </button>

            {/* Save Request */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
                placeholder="Request name (optional)"
                className="flex-1 px-3 py-1 border rounded-full"
              />
              <button
                onClick={saveRequest}
                className="flex items-center gap-1 px-3 py-1 text-blue-500  rounded-full hover:bg-blue-600"
              >
                <BiSave size={14} />
           
              </button>
            </div>
          </div>

          {/* Saved Requests */}
          {savedRequests.length > 0 && (
            <div className="  p-4">
              <h3 className="font-semibold text-gray-700 mb-3">
                Saved Requests
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {savedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <BiFolderOpen size={14} className="text-gray-500" />
                    <span className="flex-1 truncate">{req.name}</span>
                    <button
                      onClick={() => loadRequest(req)}
                      className="px-2 py-1 text-blue-500 rounded-full hover:bg-blue-600"
                    >
                      <BiImport/>
                    </button>
                    <button
                      onClick={() => deleteRequest(req.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <BiTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showEnvModal && (
            <div onClick={ () => {setShowEnvModal(false)}} className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
            <div className="p-4">
              {/* Create New Environment */}
              <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-400/20">
                <h3 className="font-semibold mb-2">Create New Environment</h3>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newEnvName}
                    onChange={(e) => setNewEnvName(e.target.value)}
                    placeholder="Environment name"
                    className="flex-1 px-3 py-1 border rounded"
                  />
                  <input
                    type="text"
                    value={newEnvDescription}
                    onChange={(e) => setNewEnvDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="flex-1 px-3 py-1 border rounded"
                  />
                  <button
                    onClick={createEnvironment}
                    className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Create
                  </button>
                </div>
              </div>

              {/* Environment List */}
            </div>
            </div>
          )}
        </div>

        {/* Response Panel */}
        <div className="space-y-6 border-l h-full">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Response</h2>
              {response && (
                <button
                  onClick={copyResponse}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded-full hover:bg-gray-600"
                >
                  <BiCopy size={14} />
                  Copy
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                {error}
              </div>
            )}

            {response && (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-4">
                  <div
                    className={`px-3 py-1 rounded-full font-medium ${
                      response.status >= 200 && response.status < 300
                        ? "bg-blue-100 text-blue-800"
                        : response.status >= 400
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {response.status} {response.statusText}
                  </div>
                  <div className="text-gray-500">{response.duration}ms</div>
                </div>

                {/* Response Headers */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Response Headers
                  </h4>
                  <div className="bg-gray-50 rounded p-3 font-mono max-h-32 overflow-y-auto border border-gray-400/20">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="text-blue-600 mr-2">{key}:</span>
                        <span className="text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response Body */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Response Body
                  </h4>
                  <div className="bg-gray-50 rounded p-3 font-mono max-h-32 overflow-y-auto border border-gray-400/20">
                    <pre className="whitespace-pre-wrap break-words max-h-[20vh] overflow-y-auto">
                      {response.body || "No response body"}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  {environments.map((env) => (
                    <div key={env.id} className="border rounded p-4 border-gray-400/20 bg-gray-200/20">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-sm ">{env.name}</h3>
                          {env.description && (
                            <p className=" text-gray-600">{env.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {currentEnvironment.id === env.id && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full ">
                              Active
                            </span>
                          )}
                          <button
                            onClick={() => switchEnvironment(env)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                          >
                            Use
                          </button>
                          {environments.length > 1 && (
                            <button
                              onClick={() => deleteEnvironment(env.id)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <BiTrash size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Environment Variables */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Variables</h4>
                          <button
                            onClick={() => addEnvironmentVariable(env.id)}
                            className="flex items-center gap-1 px-2 py-1 text-blue-500  rounded-full hover:bg-blue-600"
                          >
                            <BiPlus size={14} />
                            Add Variable
                          </button>
                        </div>
                        <div className="space-y-2">
                          {env.variables.map((variable) => (
                            <div
                              key={variable.id}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                placeholder="Variable name"
                                value={variable.key}
                                onChange={(e) =>
                                  updateEnvironmentVariable(
                                    env.id,
                                    variable.id,
                                    "key",
                                    e.target.value
                                  )
                                }
                                className="flex-1 px-2 py-1 border rounded"
                              />
                              <input
                                type="text"
                                placeholder="Value"
                                value={variable.value}
                                onChange={(e) =>
                                  updateEnvironmentVariable(
                                    env.id,
                                    variable.id,
                                    "value",
                                    e.target.value
                                  )
                                }
                                className="flex-1 px-2 py-1 border rounded"
                              />
                              <input
                                type="text"
                                placeholder="Description"
                                value={variable.description || ""}
                                onChange={(e) =>
                                  updateEnvironmentVariable(
                                    env.id,
                                    variable.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                className="flex-1 px-2 py-1 border rounded"
                              />
                              <button
                                onClick={() =>
                                  removeEnvironmentVariable(env.id, variable.id)
                                }
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                <BiTrash size={14} />
                              </button>
                            </div>
                          ))}
                          {env.variables.length === 0 && (
                            <div className="text-gray-500 italic">
                              No variables defined
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!response && !error && !loading && (
              <div className="text-gray-500 text-center py-8">
                Send a request to see the response here
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <div className="mt-2 text-gray-600">Sending request...</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Environment Management Modal */}
    </div>
  );
};

export default RequestComposer;
