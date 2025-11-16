cmake_minimum_required(VERSION 3.16)
project(kiacha3d VERSION 2.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -O3")

# Enable PIE for security
if(UNIX AND NOT APPLE)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fPIE -fstack-protector-strong")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -pie")
endif()

# Find required packages
find_package(Vulkan REQUIRED)
find_package(glm REQUIRED)

# Vulkan detection
if(NOT Vulkan_FOUND)
    message(FATAL_ERROR "Vulkan SDK not found. Install from https://vulkan.lunarg.com/")
endif()

# GLM detection
if(NOT glm_FOUND)
    message(WARNING "GLM not found. Install: apt install libglm-dev (Linux) or vcpkg install glm (Windows)")
endif()

# Source files
set(SOURCES
    src/main.cpp
    src/renderer.cpp
    src/vulkan_backend.cpp
    src/scene_manager.cpp
    src/object_loader.cpp
)

set(HEADERS
    engine/renderer.hpp
    engine/vulkan_backend.hpp
    core/scene_manager.hpp
    core/object_loader.hpp
)

# Main executable
add_executable(kiacha3d ${SOURCES} ${HEADERS})

# Include directories
target_include_directories(kiacha3d PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${Vulkan_INCLUDE_DIRS}
    ${GLM_INCLUDE_DIRS}
)

# Link libraries
target_link_libraries(kiacha3d PRIVATE
    ${Vulkan_LIBRARIES}
    glm::glm
)

# Platform-specific settings
if(WIN32)
    target_compile_definitions(kiacha3d PRIVATE VK_USE_PLATFORM_WIN32_KHR)
elseif(APPLE)
    target_compile_definitions(kiacha3d PRIVATE VK_USE_PLATFORM_METAL_EXT)
elseif(UNIX)
    find_package(X11 REQUIRED)
    target_link_libraries(kiacha3d PRIVATE X11)
    target_compile_definitions(kiacha3d PRIVATE VK_USE_PLATFORM_XLIB_KHR)
endif()

# Optional: Build tests
if(BUILD_TESTING)
    enable_testing()
    add_executable(tests
        tests/test_scene_manager.cpp
        tests/test_object_loader.cpp
    )
    target_link_libraries(tests PRIVATE kiacha3d)
    add_test(NAME kiacha3d_tests COMMAND tests)
endif()

# Installation
install(TARGETS kiacha3d DESTINATION bin)
install(DIRECTORY ui/ DESTINATION share/kiacha3d/ui)
install(FILES requirements.txt DESTINATION share/kiacha3d)

# Summary
message(STATUS "========== KiachaOS 3D Engine ==========")
message(STATUS "Version: ${PROJECT_VERSION}")
message(STATUS "C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "Vulkan: ${Vulkan_FOUND}")
message(STATUS "GLM: ${glm_FOUND}")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "========================================")
