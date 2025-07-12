#include <node.h>
#include <node_buffer.h>
#include <v8.h>
#include <uv.h>
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <memory>
#include <chrono>
#include <thread>
#include <atomic>
#include <map>
#include <cstring>

#ifdef _WIN32
#include <windows.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#endif

using namespace v8;
using namespace node;

class NativeTransfer {
private:
    std::atomic<bool> initialized{false};
    std::atomic<int> maxSpeed{1000}; // MB/s
    std::map<std::string, std::shared_ptr<std::thread>> activeTransfers;
    
    struct TransferContext {
        std::string transferId;
        std::string targetIp;
        int targetPort;
        std::vector<std::string> filePaths;
        Persistent<Function> progressCallback;
        Persistent<Function> completeCallback;
        std::atomic<bool> cancelled{false};
        std::atomic<size_t> totalBytes{0};
        std::atomic<size_t> transferredBytes{0};
        std::chrono::steady_clock::time_point startTime;
        
        TransferContext() : startTime(std::chrono::steady_clock::now()) {}
    };

public:
    static void Initialize(Local<Object> exports) {
        Isolate* isolate = exports->GetIsolate();
        Local<Context> context = isolate->GetCurrentContext();
        
        // Initialize method
        exports->Set(context,
            String::NewFromUtf8(isolate, "initialize").ToLocalChecked(),
            FunctionTemplate::New(isolate, Initialize)->GetFunction(context).ToLocalChecked());
        
        // Get max speed method
        exports->Set(context,
            String::NewFromUtf8(isolate, "getMaxSpeed").ToLocalChecked(),
            FunctionTemplate::New(isolate, GetMaxSpeed)->GetFunction(context).ToLocalChecked());
        
        // Start transfer method
        exports->Set(context,
            String::NewFromUtf8(isolate, "startTransfer").ToLocalChecked(),
            FunctionTemplate::New(isolate, StartTransfer)->GetFunction(context).ToLocalChecked());
        
        // Save file method
        exports->Set(context,
            String::NewFromUtf8(isolate, "saveFile").ToLocalChecked(),
            FunctionTemplate::New(isolate, SaveFile)->GetFunction(context).ToLocalChecked());
        
        // Optimize system method
        exports->Set(context,
            String::NewFromUtf8(isolate, "optimizeSystem").ToLocalChecked(),
            FunctionTemplate::New(isolate, OptimizeSystem)->GetFunction(context).ToLocalChecked());
        
        // Cancel transfer method
        exports->Set(context,
            String::NewFromUtf8(isolate, "cancelTransfer").ToLocalChecked(),
            FunctionTemplate::New(isolate, CancelTransfer)->GetFunction(context).ToLocalChecked());
        
        // Cleanup method
        exports->Set(context,
            String::NewFromUtf8(isolate, "cleanup").ToLocalChecked(),
            FunctionTemplate::New(isolate, Cleanup)->GetFunction(context).ToLocalChecked());
    }
    
    static void Initialize(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        
        // Initialize native transfer system
        #ifdef _WIN32
        WSADATA wsaData;
        int result = WSAStartup(MAKEWORD(2, 2), &wsaData);
        if (result != 0) {
            isolate->ThrowException(Exception::Error(
                String::NewFromUtf8(isolate, "Failed to initialize Winsock").ToLocalChecked()));
            return;
        }
        #endif
        
        // Set socket buffer sizes for optimal performance
        SetSocketBufferSizes();
        
        // Detect maximum transfer speed based on system capabilities
        DetectMaxSpeed();
        
        GetInstance().initialized = true;
        
        Local<Object> result = Object::New(isolate);
        result->Set(isolate->GetCurrentContext(),
            String::NewFromUtf8(isolate, "success").ToLocalChecked(),
            Boolean::New(isolate, true));
        
        args.GetReturnValue().Set(result);
    }
    
    static void GetMaxSpeed(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        args.GetReturnValue().Set(Number::New(isolate, GetInstance().maxSpeed.load()));
    }
    
    static void StartTransfer(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        Local<Context> context = isolate->GetCurrentContext();
        
        if (args.Length() < 3) {
            isolate->ThrowException(Exception::Error(
                String::NewFromUtf8(isolate, "Invalid arguments").ToLocalChecked()));
            return;
        }
        
        // Parse arguments
        String::Utf8Value transferId(isolate, args[0]->ToString(context).ToLocalChecked());
        Local<Object> targetDevice = args[1]->ToObject(context).ToLocalChecked();
        Local<Array> files = Local<Array>::Cast(args[2]);
        
        // Extract target device info
        String::Utf8Value targetIp(isolate, 
            targetDevice->Get(context, String::NewFromUtf8(isolate, "ip").ToLocalChecked())
                .ToLocalChecked()->ToString(context).ToLocalChecked());
        int targetPort = targetDevice->Get(context, String::NewFromUtf8(isolate, "port").ToLocalChecked())
            .ToLocalChecked()->Int32Value(context).ToChecked();
        
        // Create transfer context
        auto transferContext = std::make_shared<TransferContext>();
        transferContext->transferId = *transferId;
        transferContext->targetIp = *targetIp;
        transferContext->targetPort = targetPort;
        
        // Extract file paths
        for (uint32_t i = 0; i < files->Length(); i++) {
            Local<Object> file = files->Get(context, i).ToLocalChecked()->ToObject(context).ToLocalChecked();
            String::Utf8Value path(isolate, 
                file->Get(context, String::NewFromUtf8(isolate, "path").ToLocalChecked())
                    .ToLocalChecked()->ToString(context).ToLocalChecked());
            transferContext->filePaths.push_back(*path);
        }
        
        // Start transfer in separate thread
        auto transferThread = std::make_shared<std::thread>([transferContext]() {
            PerformTransfer(transferContext);
        });
        
        GetInstance().activeTransfers[transferContext->transferId] = transferThread;
        
        Local<Object> result = Object::New(isolate);
        result->Set(context,
            String::NewFromUtf8(isolate, "transferId").ToLocalChecked(),
            String::NewFromUtf8(isolate, transferContext->transferId.c_str()).ToLocalChecked());
        result->Set(context,
            String::NewFromUtf8(isolate, "status").ToLocalChecked(),
            String::NewFromUtf8(isolate, "started").ToLocalChecked());
        
        args.GetReturnValue().Set(result);
    }
    
    static void SaveFile(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        Local<Context> context = isolate->GetCurrentContext();
        
        if (args.Length() < 2) {
            isolate->ThrowException(Exception::Error(
                String::NewFromUtf8(isolate, "Invalid arguments").ToLocalChecked()));
            return;
        }
        
        String::Utf8Value transferId(isolate, args[0]->ToString(context).ToLocalChecked());
        
        // Get buffer data
        Local<Object> bufferObj = args[1]->ToObject(context).ToLocalChecked();
        char* bufferData = Buffer::Data(bufferObj);
        size_t bufferLength = Buffer::Length(bufferObj);
        
        // Generate filename
        std::string filename = "blinknet_" + std::string(*transferId) + ".bin";
        
        // Use high-performance file I/O
        bool success = FastSaveFile(filename, bufferData, bufferLength);
        
        Local<Object> result = Object::New(isolate);
        result->Set(context,
            String::NewFromUtf8(isolate, "success").ToLocalChecked(),
            Boolean::New(isolate, success));
        
        if (success) {
            result->Set(context,
                String::NewFromUtf8(isolate, "filename").ToLocalChecked(),
                String::NewFromUtf8(isolate, filename.c_str()).ToLocalChecked());
        }
        
        args.GetReturnValue().Set(result);
    }
    
    static void OptimizeSystem(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        Local<Context> context = isolate->GetCurrentContext();
        
        bool success = true;
        
        // Optimize socket buffers
        SetSocketBufferSizes();
        
        // Set high priority for current process
        #ifdef _WIN32
        SetPriorityClass(GetCurrentProcess(), HIGH_PRIORITY_CLASS);
        #else
        nice(-10); // Lower nice value = higher priority
        #endif
        
        // Optimize TCP settings
        OptimizeTcpSettings();
        
        Local<Object> result = Object::New(isolate);
        result->Set(context,
            String::NewFromUtf8(isolate, "success").ToLocalChecked(),
            Boolean::New(isolate, success));
        
        args.GetReturnValue().Set(result);
    }
    
    static void CancelTransfer(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        Local<Context> context = isolate->GetCurrentContext();
        
        if (args.Length() < 1) {
            isolate->ThrowException(Exception::Error(
                String::NewFromUtf8(isolate, "Transfer ID required").ToLocalChecked()));
            return;
        }
        
        String::Utf8Value transferId(isolate, args[0]->ToString(context).ToLocalChecked());
        
        auto& instance = GetInstance();
        auto it = instance.activeTransfers.find(*transferId);
        
        bool cancelled = false;
        if (it != instance.activeTransfers.end()) {
            // Signal cancellation and wait for thread
            if (it->second && it->second->joinable()) {
                it->second->join();
                instance.activeTransfers.erase(it);
                cancelled = true;
            }
        }
        
        args.GetReturnValue().Set(Boolean::New(isolate, cancelled));
    }
    
    static void Cleanup(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        
        auto& instance = GetInstance();
        
        // Cancel all active transfers
        for (auto& transfer : instance.activeTransfers) {
            if (transfer.second && transfer.second->joinable()) {
                transfer.second->join();
            }
        }
        instance.activeTransfers.clear();
        
        #ifdef _WIN32
        WSACleanup();
        #endif
        
        instance.initialized = false;
        
        args.GetReturnValue().Set(Boolean::New(isolate, true));
    }
    
private:
    static NativeTransfer& GetInstance() {
        static NativeTransfer instance;
        return instance;
    }
    
    static void PerformTransfer(std::shared_ptr<TransferContext> context) {
        int sock = socket(AF_INET, SOCK_STREAM, 0);
        if (sock < 0) {
            return;
        }
        
        // Set socket options for high performance
        int flag = 1;
        setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, (char*)&flag, sizeof(flag));
        
        // Large send/receive buffers
        int bufsize = 1024 * 1024; // 1MB
        setsockopt(sock, SOL_SOCKET, SO_SNDBUF, (char*)&bufsize, sizeof(bufsize));
        setsockopt(sock, SOL_SOCKET, SO_RCVBUF, (char*)&bufsize, sizeof(bufsize));
        
        struct sockaddr_in addr;
        addr.sin_family = AF_INET;
        addr.sin_port = htons(context->targetPort);
        inet_pton(AF_INET, context->targetIp.c_str(), &addr.sin_addr);
        
        if (connect(sock, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
            #ifdef _WIN32
            closesocket(sock);
            #else
            close(sock);
            #endif
            return;
        }
        
        // Calculate total size
        size_t totalSize = 0;
        for (const auto& filePath : context->filePaths) {
            std::ifstream file(filePath, std::ios::binary | std::ios::ate);
            if (file.good()) {
                totalSize += file.tellg();
            }
        }
        context->totalBytes = totalSize;
        
        // Send metadata
        std::string metadata = R"({"transferId":")" + context->transferId + 
                              R"(","size":)" + std::to_string(totalSize) + 
                              R"(,"filename":")" + context->filePaths[0] + R"("})";
        
        send(sock, metadata.c_str(), metadata.length(), 0);
        
        // Send files with high-performance I/O
        const size_t chunkSize = 64 * 1024; // 64KB chunks
        std::vector<char> buffer(chunkSize);
        
        for (const auto& filePath : context->filePaths) {
            if (context->cancelled) break;
            
            std::ifstream file(filePath, std::ios::binary);
            if (!file.good()) continue;
            
            while (file.good() && !context->cancelled) {
                file.read(buffer.data(), chunkSize);
                std::streamsize bytesRead = file.gcount();
                
                if (bytesRead > 0) {
                    ssize_t sent = send(sock, buffer.data(), bytesRead, 0);
                    if (sent > 0) {
                        context->transferredBytes += sent;
                    }
                }
            }
        }
        
        #ifdef _WIN32
        closesocket(sock);
        #else
        close(sock);
        #endif
    }
    
    static bool FastSaveFile(const std::string& filename, const char* data, size_t length) {
        #ifdef _WIN32
        HANDLE hFile = CreateFileA(filename.c_str(), GENERIC_WRITE, 0, NULL, 
                                  CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
        if (hFile == INVALID_HANDLE_VALUE) return false;
        
        DWORD bytesWritten;
        BOOL result = WriteFile(hFile, data, length, &bytesWritten, NULL);
        CloseHandle(hFile);
        
        return result && bytesWritten == length;
        #else
        int fd = open(filename.c_str(), O_CREAT | O_WRONLY | O_TRUNC, 0644);
        if (fd < 0) return false;
        
        ssize_t written = write(fd, data, length);
        close(fd);
        
        return written == static_cast<ssize_t>(length);
        #endif
    }
    
    static void SetSocketBufferSizes() {
        // Platform-specific socket optimizations would go here
        // This is a placeholder for system-level optimizations
    }
    
    static void DetectMaxSpeed() {
        // Detect system capabilities and set max speed
        // This could involve benchmarking disk I/O, network interfaces, etc.
        GetInstance().maxSpeed = 1000; // 1GB/s default
    }
    
    static void OptimizeTcpSettings() {
        // Platform-specific TCP optimizations
        // This would involve setting TCP window sizes, congestion control, etc.
    }
};

NODE_MODULE(native_transfer, NativeTransfer::Initialize)