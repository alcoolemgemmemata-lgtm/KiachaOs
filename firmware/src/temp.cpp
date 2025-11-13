#include "temp.hpp"
#include <iostream>
#include <thread>
#include <chrono>
#include <cstdlib>
#include <ctime>

void temp_loop() {
  std::cout << "[TEMP] Temperature monitoring started\n";
  srand(time(0));
  
  while (true) {
    float temp = 35.0 + (rand() % 10);
    std::cout << "[TEMP] " << temp << "°C\n";
    std::this_thread::sleep_for(std::chrono::seconds(5));
  }
}
