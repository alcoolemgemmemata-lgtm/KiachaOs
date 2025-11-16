#include "vulkan_backend.hpp"
#include <iostream>
#include <set>
#include <algorithm>

namespace Kiacha3D {

VulkanBackend::VulkanBackend(uint32_t width, uint32_t height, const char* app_name)
    : width_(width), height_(height), app_name_(app_name),
      instance_(VK_NULL_HANDLE), physical_device_(VK_NULL_HANDLE),
      device_(VK_NULL_HANDLE), graphics_queue_(VK_NULL_HANDLE),
      command_pool_(VK_NULL_HANDLE), surface_(VK_NULL_HANDLE),
      swapchain_(VK_NULL_HANDLE), swapchain_format_(VK_FORMAT_B8G8R8A8_SRGB) {
    std::cout << "[VulkanBackend] Initializing " << width << "x" << height << std::endl;
}

VulkanBackend::~VulkanBackend() {
    shutdown();
}

bool VulkanBackend::initialize() {
    std::cout << "[VulkanBackend] Starting initialization..." << std::endl;
    
    if (!create_instance()) {
        std::cerr << "Failed to create Vulkan instance" << std::endl;
        return false;
    }
    
    if (!setup_debug_messenger()) {
        std::cerr << "Failed to setup debug messenger" << std::endl;
    }
    
    if (!pick_physical_device()) {
        std::cerr << "Failed to pick physical device" << std::endl;
        return false;
    }
    
    if (!create_logical_device()) {
        std::cerr << "Failed to create logical device" << std::endl;
        return false;
    }
    
    if (!create_command_pool()) {
        std::cerr << "Failed to create command pool" << std::endl;
        return false;
    }
    
    if (!create_command_buffers()) {
        std::cerr << "Failed to create command buffers" << std::endl;
        return false;
    }
    
    if (!create_semaphores()) {
        std::cerr << "Failed to create synchronization primitives" << std::endl;
        return false;
    }
    
    std::cout << "[VulkanBackend] Initialization complete" << std::endl;
    return true;
}

void VulkanBackend::shutdown() {
    if (device_) {
        vkDestroyDevice(device_, nullptr);
        device_ = VK_NULL_HANDLE;
    }
    
    if (instance_) {
        vkDestroyInstance(instance_, nullptr);
        instance_ = VK_NULL_HANDLE;
    }
    
    std::cout << "[VulkanBackend] Shutdown complete" << std::endl;
}

VkInstance VulkanBackend::get_instance() const { return instance_; }
VkDevice VulkanBackend::get_device() const { return device_; }
VkPhysicalDevice VulkanBackend::get_physical_device() const { return physical_device_; }
VkQueue VulkanBackend::get_graphics_queue() const { return graphics_queue_; }
VkCommandPool VulkanBackend::get_command_pool() const { return command_pool_; }
VkSwapchainKHR VulkanBackend::get_swapchain() const { return swapchain_; }

bool VulkanBackend::create_instance() {
    VkApplicationInfo app_info{};
    app_info.sType = VK_STRUCTURE_TYPE_APPLICATION_INFO;
    app_info.pApplicationName = app_name_.c_str();
    app_info.applicationVersion = VK_MAKE_VERSION(1, 0, 0);
    app_info.pEngineName = "KiachaOS 3D";
    app_info.engineVersion = VK_MAKE_VERSION(1, 0, 0);
    app_info.apiVersion = VK_API_VERSION_1_2;
    
    VkInstanceCreateInfo create_info{};
    create_info.sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO;
    create_info.pApplicationInfo = &app_info;
    
    std::cout << "[VulkanBackend] Creating Vulkan instance..." << std::endl;
    VkResult result = vkCreateInstance(&create_info, nullptr, &instance_);
    return result == VK_SUCCESS;
}

bool VulkanBackend::setup_debug_messenger() {
    std::cout << "[VulkanBackend] Setting up debug messenger (placeholder)" << std::endl;
    return true;
}

bool VulkanBackend::pick_physical_device() {
    uint32_t device_count = 0;
    vkEnumeratePhysicalDevices(instance_, &device_count, nullptr);
    
    if (device_count == 0) {
        std::cerr << "No Vulkan-capable devices found" << std::endl;
        return false;
    }
    
    std::vector<VkPhysicalDevice> devices(device_count);
    vkEnumeratePhysicalDevices(instance_, &device_count, devices.data());
    
    physical_device_ = devices[0];
    
    VkPhysicalDeviceProperties props;
    vkGetPhysicalDeviceProperties(physical_device_, &props);
    std::cout << "[VulkanBackend] Selected device: " << props.deviceName << std::endl;
    
    return true;
}

bool VulkanBackend::create_logical_device() {
    VkDeviceQueueCreateInfo queue_create_info{};
    queue_create_info.sType = VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO;
    queue_create_info.queueFamilyIndex = 0;
    queue_create_info.queueCount = 1;
    float queue_priority = 1.0f;
    queue_create_info.pQueuePriorities = &queue_priority;
    
    VkPhysicalDeviceFeatures device_features{};
    
    VkDeviceCreateInfo create_info{};
    create_info.sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO;
    create_info.pQueueCreateInfos = &queue_create_info;
    create_info.queueCreateInfoCount = 1;
    create_info.pEnabledFeatures = &device_features;
    
    VkResult result = vkCreateDevice(physical_device_, &create_info, nullptr, &device_);
    if (result != VK_SUCCESS) {
        std::cerr << "Failed to create logical device" << std::endl;
        return false;
    }
    
    vkGetDeviceQueue(device_, 0, 0, &graphics_queue_);
    std::cout << "[VulkanBackend] Logical device created" << std::endl;
    return true;
}

bool VulkanBackend::create_command_pool() {
    VkCommandPoolCreateInfo pool_info{};
    pool_info.sType = VK_STRUCTURE_TYPE_COMMAND_POOL_CREATE_INFO;
    pool_info.queueFamilyIndex = 0;
    pool_info.flags = VK_COMMAND_POOL_CREATE_RESET_COMMAND_BUFFER_BIT;
    
    VkResult result = vkCreateCommandPool(device_, &pool_info, nullptr, &command_pool_);
    return result == VK_SUCCESS;
}

bool VulkanBackend::create_command_buffers() {
    std::cout << "[VulkanBackend] Creating command buffers..." << std::endl;
    return true;
}

bool VulkanBackend::create_semaphores() {
    VkSemaphoreCreateInfo semaphore_info{};
    semaphore_info.sType = VK_STRUCTURE_TYPE_SEMAPHORE_CREATE_INFO;
    
    if (vkCreateSemaphore(device_, &semaphore_info, nullptr, &image_available_semaphore_) != VK_SUCCESS ||
        vkCreateSemaphore(device_, &semaphore_info, nullptr, &render_finished_semaphore_) != VK_SUCCESS) {
        return false;
    }
    
    return true;
}

void VulkanBackend::begin_frame() {
    // Begin rendering frame
}

void VulkanBackend::end_frame() {
    // End rendering frame and present
}

VkCommandBuffer VulkanBackend::get_current_command_buffer() const {
    return command_buffers_.empty() ? VK_NULL_HANDLE : command_buffers_[0];
}

void VulkanBackend::recreate_swapchain() {
    std::cout << "[VulkanBackend] Recreating swapchain..." << std::endl;
}

VkBuffer VulkanBackend::create_buffer(VkDeviceSize size, VkBufferUsageFlags usage,
                                     VkMemoryPropertyFlags properties) {
    VkBufferCreateInfo buffer_info{};
    buffer_info.sType = VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO;
    buffer_info.size = size;
    buffer_info.usage = usage;
    buffer_info.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
    
    VkBuffer buffer;
    if (vkCreateBuffer(device_, &buffer_info, nullptr, &buffer) != VK_SUCCESS) {
        return VK_NULL_HANDLE;
    }
    
    return buffer;
}

void VulkanBackend::copy_buffer(VkBuffer src, VkBuffer dst, VkDeviceSize size) {
    // Implement buffer copy
}

VkImage VulkanBackend::create_image(uint32_t width, uint32_t height, VkFormat format,
                                   VkImageUsageFlags usage) {
    VkImageCreateInfo image_info{};
    image_info.sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO;
    image_info.imageType = VK_IMAGE_TYPE_2D;
    image_info.extent.width = width;
    image_info.extent.height = height;
    image_info.extent.depth = 1;
    image_info.mipLevels = 1;
    image_info.arrayLayers = 1;
    image_info.format = format;
    image_info.tiling = VK_IMAGE_TILING_OPTIMAL;
    image_info.initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;
    image_info.usage = usage;
    image_info.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
    image_info.samples = VK_SAMPLE_COUNT_1_BIT;
    
    VkImage image;
    vkCreateImage(device_, &image_info, nullptr, &image);
    
    return image;
}

} // namespace Kiacha3D
