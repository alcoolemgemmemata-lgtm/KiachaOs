#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <linux/i2c-dev.h>
#include <iostream>
#include <cstdint>

int i2c_read(int addr, int reg) {
  int fd = open("/dev/i2c-1", O_RDWR);
  if (fd < 0) {
    std::cerr << "[I2C] Failed to open I2C device\n";
    return -1;
  }
  
  ioctl(fd, I2C_SLAVE, addr);
  
  uint8_t value;
  if (write(fd, (char*)&reg, 1) != 1) {
    close(fd);
    return -1;
  }
  if (read(fd, (char*)&value, 1) != 1) {
    close(fd);
    return -1;
  }
  
  close(fd);
  return value;
}

int i2c_write(int addr, int reg, int value) {
  int fd = open("/dev/i2c-1", O_RDWR);
  if (fd < 0) return -1;
  
  ioctl(fd, I2C_SLAVE, addr);
  
  uint8_t data[2] = {(uint8_t)reg, (uint8_t)value};
  if (write(fd, (char*)data, 2) != 2) {
    close(fd);
    return -1;
  }
  
  close(fd);
  return 0;
}
