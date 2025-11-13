#include "audio.hpp"
#include "camera.hpp"
#include "led.hpp"
#include "temp.hpp"
#include "updater.hpp"
#include <thread>
#include <iostream>

int main() {
  std::cout << "🚀 Kiacha Firmware starting...\n";
  
  std::jthread t1(audio_loop);
  std::jthread t2(camera_loop);
  std::jthread t3(led_loop);
  std::jthread t4(temp_loop);
  std::jthread t5(updater_loop);
  
  std::cout << "✅ All services started\n";
  
  while (true) {
    std::this_thread::sleep_for(std::chrono::seconds(60));
  }
  
  return 0;
}
