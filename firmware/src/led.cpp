#include "led.hpp"
#include <iostream>
#include <thread>
#include <chrono>

void led_loop() {
  std::cout << "[LED] Breathing animation started\n";
  
  int brightness = 0;
  int direction = 1;
  
  while (true) {
    brightness += direction;
    if (brightness >= 255) direction = -1;
    if (brightness <= 0) direction = 1;
    
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
  }
}
