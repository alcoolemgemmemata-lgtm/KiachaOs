#include "updater.hpp"
#include <iostream>
#include <thread>
#include <chrono>

void updater_loop() {
  std::cout << "[OTA] Update checker started\n";
  
  while (true) {
    std::cout << "[OTA] Checking for updates...\n";
    std::this_thread::sleep_for(std::chrono::hours(1));
  }
}
