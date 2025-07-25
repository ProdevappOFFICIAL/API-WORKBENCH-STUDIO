import React, { useState, useRef, useEffect } from "react";
import { BiPlay, BiShield, BiSquare } from "react-icons/bi";
import { BsActivity } from "react-icons/bs";
import { CiSettings } from "react-icons/ci";
import { FiAlertTriangle, FiExternalLink, FiTarget } from "react-icons/fi";

interface TestConfig {
  targetUrl: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
  twoFaSelector?: string;
  tokenSelector?: string;
  delay: number;
  maxAttempts: number;
  useProxy: boolean;
}

interface Credential {
  username: string;
  password: string;
  twoFa?: string;
  token?: string;
}

interface TestResult {
  id: string;
  timestamp: string;
  username: string;
  password: string;
  statusCode: number;
  response: string;
  success: boolean;
  errorMessage?: string;
  responseTime: number;
}

export default function FormStorm() {
  const [config, setConfig] = useState<TestConfig>({
    targetUrl: "http://localhost:3000/login",
    usernameSelector: "#username",
    passwordSelector: "#password",
    submitSelector: "#submit",
    twoFaSelector: "",
    tokenSelector: "",
    delay: 2000,
    maxAttempts: 10,
    useProxy: false,
  });

  const [credentials, setCredentials] = useState<Credential[]>([
    { username: "admin", password: "admin" },
    { username: "admin", password: "password" },
    { username: "admin", password: "123456" },
    { username: "user", password: "user" },
    { username: "test", password: "test" },
    { username: "guest", password: "guest" },
  ]);

  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [currentCredential, setCurrentCredential] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "config" | "credentials" | "results" | "logs"
  >("config");
  const [logs, setLogs] = useState<string[]>([]);
  const [targetLoaded, setTargetLoaded] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs((prev) => [...prev, logEntry]);
    console.log(logEntry);
  };

  const updateConfig = (
    field: keyof TestConfig,
    value: string | number | boolean
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const addCredential = () => {
    setCredentials((prev) => [...prev, { username: "", password: "" }]);
  };

  const updateCredential = (
    index: number,
    field: keyof Credential,
    value: string
  ) => {
    setCredentials((prev) =>
      prev.map((cred, i) => (i === index ? { ...cred, [field]: value } : cred))
    );
  };

  const removeCredential = (index: number) => {
    setCredentials((prev) => prev.filter((_, i) => i !== index));
  };

  const injectFormScript = () => {
    if (!iframeRef.current) return;

    const script = `
      (function() {
        let isSubmitting = false;
        
        function findElement(selector) {
          try {
            return document.querySelector(selector);
          } catch (e) {
            console.log('Invalid selector:', selector);
            return null;
          }
        }

        function fillForm(data) {
          const usernameEl = findElement('${config.usernameSelector}');
          const passwordEl = findElement('${config.passwordSelector}');
          const twoFaEl = findElement('${config.twoFaSelector}');
          const tokenEl = findElement('${config.tokenSelector}');
          
          if (!usernameEl || !passwordEl) {
            return { success: false, error: 'Required form elements not found' };
          }

          // Fill username
          usernameEl.value = data.username;
          usernameEl.dispatchEvent(new Event('input', { bubbles: true }));
          usernameEl.dispatchEvent(new Event('change', { bubbles: true }));

          // Fill password
          passwordEl.value = data.password;
          passwordEl.dispatchEvent(new Event('input', { bubbles: true }));
          passwordEl.dispatchEvent(new Event('change', { bubbles: true }));

          // Fill 2FA if provided
          if (twoFaEl && data.twoFa) {
            twoFaEl.value = data.twoFa;
            twoFaEl.dispatchEvent(new Event('input', { bubbles: true }));
            twoFaEl.dispatchEvent(new Event('change', { bubbles: true }));
          }

          // Fill token if provided
          if (tokenEl && data.token) {
            tokenEl.value = data.token;
            tokenEl.dispatchEvent(new Event('input', { bubbles: true }));
            tokenEl.dispatchEvent(new Event('change', { bubbles: true }));
          }

          return { success: true };
        }

        function submitForm() {
          if (isSubmitting) return { success: false, error: 'Already submitting' };
          
          const submitEl = findElement('${config.submitSelector}');
          if (!submitEl) {
            return { success: false, error: 'Submit button not found' };
          }

          isSubmitting = true;
          
          try {
            // Try clicking the submit button
            submitEl.click();
            
            // Also try form submission if it's a form
            const form = submitEl.closest('form');
            if (form) {
              form.submit();
            }
            
            setTimeout(() => { isSubmitting = false; }, 2000);
            return { success: true };
          } catch (error) {
            isSubmitting = false;
            return { success: false, error: error.message };
          }
        }

        function analyzeResponse() {
          const body = document.body.innerText.toLowerCase();
          const html = document.documentElement.outerHTML.toLowerCase();
          
          // Common success indicators
          const successPatterns = [
            'welcome', 'dashboard', 'logged in', 'success', 'home',
            'profile', 'account', 'logout', 'sign out'
          ];
          
          // Common failure indicators
          const failurePatterns = [
            'invalid', 'incorrect', 'wrong', 'failed', 'error',
            'denied', 'forbidden', 'unauthorized', 'try again',
            'login failed', 'authentication failed', 'bad credentials'
          ];
          
          const hasSuccessPattern = successPatterns.some(pattern => body.includes(pattern));
          const hasFailurePattern = failurePatterns.some(pattern => body.includes(pattern));
          
          // Check for redirects or URL changes
          const currentUrl = window.location.href;
          const isRedirected = !currentUrl.includes('login') && !currentUrl.includes('signin');
          
          if (hasSuccessPattern || isRedirected) {
            return { success: true, response: 'Login appears successful' };
          } else if (hasFailurePattern) {
            return { success: false, response: 'Login failed - invalid credentials' };
          } else {
            return { success: false, response: 'Login status unclear' };
          }
        }

        // Listen for messages from parent
        window.addEventListener('message', function(event) {
          if (event.data.action === 'fillAndSubmit') {
            const startTime = Date.now();
            
            // Fill form
            const fillResult = fillForm(event.data.credentials);
            if (!fillResult.success) {
              event.source.postMessage({
                type: 'formResult',
                success: false,
                error: fillResult.error,
                responseTime: Date.now() - startTime
              }, '*');
              return;
            }

            // Submit form
            setTimeout(() => {
              const submitResult = submitForm();
              if (!submitResult.success) {
                event.source.postMessage({
                  type: 'formResult',
                  success: false,
                  error: submitResult.error,
                  responseTime: Date.now() - startTime
                }, '*');
                return;
              }

              // Wait for response and analyze
              setTimeout(() => {
                const analysis = analyzeResponse();
                event.source.postMessage({
                  type: 'formResult',
                  success: analysis.success,
                  response: analysis.response,
                  url: window.location.href,
                  responseTime: Date.now() - startTime
                }, '*');
              }, 1000);
            }, 500);
          }
        });

        // Signal that script is loaded
        parent.postMessage({ type: 'scriptLoaded' }, '*');
      })();
    `;

    try {
      const iframeDoc =
        iframeRef.current.contentDocument ||
        iframeRef.current.contentWindow?.document;
      if (iframeDoc) {
        const scriptEl = iframeDoc.createElement("script");
        scriptEl.textContent = script;
        iframeDoc.head.appendChild(scriptEl);
        addLog("✅ Injection script loaded");
      }
    } catch (error) {
      addLog(
        `❌ Failed to inject script: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const performRealFormSubmission = async (
    credential: Credential
  ): Promise<TestResult> => {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          username: credential.username,
          password: credential.password,
          statusCode: 408,
          response: "Request timeout",
          success: false,
          errorMessage: "Request timed out",
          responseTime: Date.now() - startTime,
        });
      }, 10000);

      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === "formResult") {
          clearTimeout(timeoutId);
          window.removeEventListener("message", messageHandler);

          resolve({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            username: credential.username,
            password: credential.password,
            statusCode: event.data.success ? 200 : 401,
            response:
              event.data.response || event.data.error || "Unknown response",
            success: event.data.success,
            errorMessage: event.data.error,
            responseTime: event.data.responseTime || Date.now() - startTime,
          });
        }
      };

      window.addEventListener("message", messageHandler);

      // Send form data to iframe
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            action: "fillAndSubmit",
            credentials: credential,
          },
          "*"
        );
      } else {
        clearTimeout(timeoutId);
        window.removeEventListener("message", messageHandler);
        resolve({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          username: credential.username,
          password: credential.password,
          statusCode: 500,
          response: "Iframe not available",
          success: false,
          errorMessage: "Iframe not available",
          responseTime: Date.now() - startTime,
        });
      }
    });
  };

  const startTest = async () => {
    if (credentials.length === 0) {
      addLog("❌ No credentials configured");
      return;
    }

    if (!targetLoaded) {
      addLog("❌ Target page not loaded");
      return;
    }

    setIsRunning(true);
    setCurrentAttempt(0);
    setCurrentCredential(0);
    setResults([]);
    addLog("🚀 Starting FormStorm test...");
    addLog(`Target: ${config.targetUrl}`);
    addLog(`Credentials: ${credentials.length}`);
    addLog(`Max attempts: ${config.maxAttempts}`);

    let attemptCount = 0;
    let credentialIndex = 0;

    const runAttempt = async () => {
      if (
        attemptCount >= config.maxAttempts ||
        credentialIndex >= credentials.length
      ) {
        stopTest();
        return;
      }

      const credential = credentials[credentialIndex];
      setCurrentCredential(credentialIndex);
      setCurrentAttempt(attemptCount + 1);

      addLog(
        `🔍 Attempt ${attemptCount + 1}: Testing ${credential.username}:${
          credential.password
        }`
      );

      try {
        const result = await performRealFormSubmission(credential);
        setResults((prev) => [...prev, result]);

        if (result.success) {
          addLog(`✅ Success! ${result.response} (${result.responseTime}ms)`);
        } else {
          addLog(`❌ Failed: ${result.response} (${result.responseTime}ms)`);
        }

        attemptCount++;
        credentialIndex = (credentialIndex + 1) % credentials.length;

        if (isRunning) {
          intervalRef.current = setTimeout(runAttempt, config.delay);
        }
      } catch (error) {
        addLog(
          `💥 Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        attemptCount++;
        if (isRunning) {
          intervalRef.current = setTimeout(runAttempt, config.delay);
        }
      }
    };

    runAttempt();
  };

  const stopTest = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    addLog("⏹️ Test stopped");
  };

  const clearResults = () => {
    setResults([]);
    setLogs([]);
    addLog("🧹 Results cleared");
  };

  const loadTarget = () => {
    if (iframeRef.current) {
      setTargetLoaded(false);
      addLog(`🌐 Loading target: ${config.targetUrl}`);
      iframeRef.current.src = config.targetUrl;
    }
  };

  const handleIframeLoad = () => {
    setTargetLoaded(true);
    addLog("✅ Target page loaded");

    // Inject script after a short delay
    setTimeout(() => {
      injectFormScript();
    }, 1000);
  };

  const handleIframeError = () => {
    setTargetLoaded(false);
    addLog("❌ Failed to load target page");
  };

  useEffect(() => {
    loadTarget();
  }, []);

  // Listen for script loaded message
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      if (event.data.type === "scriptLoaded") {
        addLog("🔧 Form automation script ready");
      }
    };

    window.addEventListener("message", messageHandler);
    return () => window.removeEventListener("message", messageHandler);
  }, []);

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;
  const avgResponseTime =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
        )
      : 0;

  return (
    <div className="flex flex-col w-full h-full  text-gray-700">
      {/* Header */}
      <div className="flex w-full border-b border-gray-400/20 ">
        <div className=" flex items-center justify-between">
          <div className="flex items-center space-x-3 p-3">
            <div>
              <p className="font-medium">Real Frontend Form Automation Tool</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className=" text-gray-400">
              Target:{" "}
              <span
                className={targetLoaded ? "text-green-400" : "text-red-400"}
              >
                {targetLoaded ? "Loaded" : "Not Loaded"}
              </span>
            </div>
            <div className=" text-gray-400">
              Status:{" "}
              <span className={isRunning ? "text-green-400" : "text-gray-300"}>
                {isRunning ? "Running" : "Stopped"}
              </span>
            </div>
            {isRunning && (
              <div className=" text-gray-400">
                Attempt: {currentAttempt}/{config.maxAttempts}
              </div>
            )}
          </div>
        </div>
      </div>


      <div className="pt-4">
        {/* Control Panel */}
        <div className=" rounded-md  mb-6 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className=" font-semibold flex items-center space-x-2">
              <FiTarget className="h-5 w-5" />
              <span>Control Panel</span>
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={loadTarget}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full transition-colors"
              >
                <FiExternalLink  />
                <span>Load Target</span>
              </button>
              <button
                onClick={startTest}
                disabled={isRunning || !targetLoaded}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white disabled: px-4 py-1 rounded-full transition-colors"
              >
                <BiPlay/>
                <span>Start Test</span>
              </button>
              <button
                onClick={stopTest}
                disabled={!isRunning}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white disabled: px-4 py-1 rounded-full transition-colors"
              >
                <BiSquare />
                <span>Stop</span>
              </button>
              <button
                onClick={clearResults}
                className="flex items-center space-x-2  hover: px-4 py-1 rounded-full transition-colors"
              >
                <span>Clear</span>
              </button>
            </div>
          </div>

        
        </div>

        <div className="grid grid-cols-2 gap-6 border-t border-gray-400/20 p-4">
          {/* Left Column - Configuration */}
          <div className="space-y-4">
            {/* Navigation Tabs */}
            <div className="flex space-x-1">
              {[
                { id: "config", label: "Config", icon: CiSettings },
                { id: "credentials", label: "Creds", icon: BiShield },
                    { id: "results", label: "Results", icon: FiTarget },
                { id: "logs", label: "Logs", icon: BsActivity },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3 py-1 transition-colors  ${
                    activeTab === tab.id
                      ? " border-b-2 border-blue-500 text-blue-500"
                      : " hover:bg-gray-200 hover:border-gray-400/20"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className=" rounded-md ">
              {activeTab === "config" && (
                <div className="space-y-4">
                  <h3 className=" font-semibold mb-4">Target Configuration</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block  font-medium mb-1">
                        Target URL
                      </label>
                      <input
                        type="text"
                        value={config.targetUrl}
                        onChange={(e) =>
                          updateConfig("targetUrl", e.target.value)
                        }
                        placeholder="http://localhost:3000/login"
                        className="w-full  border border-gray-400/20 rounded-md px-3 py-1 "
                      />
                    </div>
                    <div>
                      <label className="block  font-medium mb-1">
                        Username Selector
                      </label>
                      <input
                        type="text"
                        value={config.usernameSelector}
                        onChange={(e) =>
                          updateConfig("usernameSelector", e.target.value)
                        }
                        placeholder="#username"
                        className="w-full  border border-gray-400/20 rounded-md px-3 py-1 "
                      />
                    </div>
                    <div>
                      <label className="block  font-medium mb-1">
                        Password Selector
                      </label>
                      <input
                        type="text"
                        value={config.passwordSelector}
                        onChange={(e) =>
                          updateConfig("passwordSelector", e.target.value)
                        }
                        placeholder="#password"
                        className="w-full  border border-gray-400/20 rounded-md px-3 py-1 "
                      />
                    </div>
                    <div>
                      <label className="block  font-medium mb-1">
                        Submit Selector
                      </label>
                      <input
                        type="text"
                        value={config.submitSelector}
                        onChange={(e) =>
                          updateConfig("submitSelector", e.target.value)
                        }
                        placeholder="#submit"
                        className="w-full  border border-gray-400/20 rounded-md px-3 py-1 "
                      />
                    </div>
                    <div>
                      <label className="block  font-medium mb-1">
                        Delay (ms)
                      </label>
                      <input
                        type="number"
                        value={config.delay}
                        onChange={(e) =>
                          updateConfig("delay", parseInt(e.target.value))
                        }
                        min="500"
                        max="30000"
                        className="w-full  border border-gray-400/20 rounded-md px-3 py-1 "
                      />
                    </div>
                    <div>
                      <label className="block  font-medium mb-1">
                        Max Attempts
                      </label>
                      <input
                        type="number"
                        value={config.maxAttempts}
                        onChange={(e) =>
                          updateConfig("maxAttempts", parseInt(e.target.value))
                        }
                        min="1"
                        max="100"
                        className="w-full  border border-gray-400/20 rounded-md px-3 py-1 "
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "credentials" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className=" font-semibold">Credentials</h3>
                    <button
                      onClick={addCredential}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors "
                    >
                      Add
                    </button>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {credentials.map((credential, index) => (
                      <div key={index} className=" p-3 rounded-md">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={credential.username}
                            onChange={(e) =>
                              updateCredential(
                                index,
                                "username",
                                e.target.value
                              )
                            }
                            placeholder="Username"
                            className="w-full  border border-gray-400/20 rounded-md px-2 py-1 "
                          />
                          <input
                            type="text"
                            value={credential.password}
                            onChange={(e) =>
                              updateCredential(
                                index,
                                "password",
                                e.target.value
                              )
                            }
                            placeholder="Password"
                            className="w-full  border border-gray-400/20 rounded-md px-2 py-1 "
                          />
                          <button
                            onClick={() => removeCredential(index)}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-full transition-colors "
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
              <div className=" rounded-md p-4">
              {activeTab === "results" && (
                <div className="space-y-4">
                  <h3 className=" font-semibold">Test Results</h3>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.map((result) => (
                      <div
                        key={result.id}
                        className={`p-3 rounded-md border-l-4 ${
                          result.success
                            ? "bg-green-900/20 border-green-500"
                            : "bg-red-900/20 border-red-500"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-mono ">
                              {result.username}:{result.password}
                            </div>
                            <div className=" text-gray-400">
                              {result.response} ({result.responseTime}ms)
                            </div>
                          </div>
                          <div
                            className={` px-2 py-1 rounded ${
                              result.success ? "bg-green-600" : "bg-red-600"
                            }`}
                          >
                            {result.statusCode}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "logs" && (
                <div className="space-y-4">
                  <h3 className=" font-semibold">Activity Logs</h3>

                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className="font-mono  p-2  rounded"
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

  
          {/* Middle Column - Target Preview */}
          <div className=" p-4 border-x">
            <h3 className=" font-semibold mb-4">Target Preview</h3>
            <div className=" rounded-md overflow-hidden">
              <iframe
                ref={iframeRef}
                src={config.targetUrl}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                className="w-full h-96 border-0"
                sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation"
                title="Target Preview"
              />
            </div>
          </div>

        
      
        </div>
      </div>
    </div>
  );
}
