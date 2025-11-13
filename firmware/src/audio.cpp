#include "audio.hpp"
#include <alsa/asoundlib.h>
#include <iostream>
#include <thread>
#include <chrono>

void audio_loop() {
  std::cout << "[AUDIO] Initializing...\n";
  
  snd_pcm_t *handle;
  snd_pcm_hw_params_t *params;
  
  snd_pcm_hw_params_alloca(&params);
  
  if (snd_pcm_open(&handle, "default", SND_PCM_STREAM_CAPTURE, 0) < 0) {
    std::cerr << "[AUDIO] Failed to open PCM device\n";
    return;
  }
  
  snd_pcm_hw_params_any(handle, params);
  snd_pcm_hw_params_set_access(handle, params, SND_PCM_ACCESS_RW_INTERLEAVED);
  snd_pcm_hw_params_set_format(handle, params, SND_PCM_FORMAT_S16_LE);
  snd_pcm_hw_params_set_channels(handle, params, 1);
  
  unsigned int rate = 16000;
  snd_pcm_hw_params_set_rate_near(handle, params, &rate, 0);
  snd_pcm_hw_params(handle, params);
  snd_pcm_prepare(handle);
  
  std::cout << "[AUDIO] Ready - 16kHz mono\n";
  
  short buffer[1024];
  while (true) {
    snd_pcm_readi(handle, buffer, 1024);
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
  }
  
  snd_pcm_close(handle);
}
