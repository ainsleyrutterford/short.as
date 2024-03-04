# `lambda`

This package contains both the Lambda source code. This Lambda makes use of the [LLRT runtime](https://github.com/awslabs/llrt).

## Testing

Download the LLRT binary for your system from the [LLRT releases](https://github.com/awslabs/llrt/releases):

```text
npm run install-llrt-test-runner-mac --scope=lambda
```

There is `install-llrt-test-runner-mac` for x86 macOS systems, and `install-llrt-test-runner-linux` for x86 Linux systems. You can replace the link in `package.json` with more recent versions and with the correct architecture for your machine (e.g. `arm64` rather than `x86`). Then run:

```text
npm run test
```
