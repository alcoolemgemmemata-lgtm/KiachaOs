#include "camera.hpp"
#include <linux/videodev2.h>
#include <fcntl.h>
#include <unistd.h>
#include <iostream>
#include <thread>
#include <chrono>

void camera_loop() {
  std::cout << "[CAMERA] Initializing /dev/video0...\n";
  
  int fd = open("/dev/video0", O_RDWR);
  if (fd < 0) {
    std::cerr << "[CAMERA] Failed to open /dev/video0\n";
    return;
  }
  
  std::cout << "[CAMERA] Connected\n";
  
  while (true) {
    std::this_thread::sleep_for(std::chrono::seconds(1));
  }
  
  close(fd);
}
