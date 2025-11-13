#!/bin/sh
set -e

DST="/opt/kiacha/models"
mkdir -p "$DST"
cd "$DST"

echo "📥 Downloading Kiacha OS Models..."

# Whisper.cpp
echo "• Downloading Whisper (base model)..."
wget -c https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin

# LLaMA
echo "• Downloading LLaMA 2 (7B quantized)..."
wget -c https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGML/resolve/main/llama-2-7b-chat.ggmlv3.q4_0.bin

# Piper TTS
echo "• Downloading Piper TTS (English - Amy)..."
wget -c https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-amy-low.tar.gz
tar -xzf voice-en-us-amy-low.tar.gz

echo "✅ All models downloaded successfully!"
