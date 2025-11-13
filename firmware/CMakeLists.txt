cmake_minimum_required(VERSION 3.20)
project(kiacha-firmware CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -Wall -Wextra -pthread")

find_package(ALSA REQUIRED)
find_package(Threads REQUIRED)

add_executable(kiacha-firmware
  src/main.cpp
  src/audio.cpp
  src/camera.cpp
  src/led.cpp
  src/temp.cpp
  src/i2c.cpp
  src/updater.cpp
)

target_include_directories(kiacha-firmware PRIVATE src)
target_link_libraries(kiacha-firmware asound Threads::Threads)

install(TARGETS kiacha-firmware RUNTIME DESTINATION bin)
