
# binding.gyp
{
  "targets": [
    {
      "target_name": "native_transfer",
      "sources": [
        "c++/transfer.cpp"
      ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ],
      "cflags": [
        "-O3",
        "-march=native",
        "-mtune=native",
        "-ffast-math",
        "-funroll-loops"
      ],
      "cflags_cc": [
        "-O3",
        "-march=native",
        "-mtune=native",
        "-ffast-math",
        "-funroll-loops",
        "-std=c++17"
      ],
      "conditions": [
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "Optimization": 3,
              "InlineFunctionExpansion": 2,
              "EnableIntrinsicFunctions": "true",
              "FavorSizeOrSpeed": 1,
              "AdditionalOptions": ["/std:c++17"]
            }
          },
          "libraries": [
            "ws2_32.lib"
          ]
        }],
        ["OS=='linux'", {
          "libraries": [
            "-lpthread"
          ]
        }],
        ["OS=='mac'", {
          "libraries": [
            "-lpthread"
          ],
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "CLANG_CXX_LANGUAGE_STANDARD": "c++17"
          }
        }]
      ]
    }
  ]
}
