# Voice Set Maker

A User Interface for the [Whisper](https://github.com/openai/whisper) application. This tool will automatically cut up and format the transcribed audio using Whisper and ffmpeg.

# How to set it up

1. Install [Whisper](https://github.com/openai/whisper#setup) and make sure you are able to run it from command prompt.
2. Install [ffmpeg](https://ffmpeg.org/download.html) and make sure you are able to run it from command prompt.
3. You might have issues using your graphics card with Whisper if so do `pip uninstall torch` and [manually install it](https://pytorch.org/get-started/locally/)

# Bugs

If you experience any bugs please open a issue on the [Github Issues tab](https://github.com/StianWiu/voiceset-maker/issues) or you can fix it yourself and make a pull request.

# Build

```bash
# Download repo
git clone https://github.com/StianWiu/voiceset-maker
# Install dependencies
npm install
# Run app in developement mode
npm run electron:serve
# Build app
npm run electron:build
```
