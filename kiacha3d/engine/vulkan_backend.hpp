#ifndef KIACHA3D_VULKAN_BACKEND_HPP
#define KIACHA3D_VULKAN_BACKEND_HPP

#include <vulkan/vulkan.h>
#include <vector>
#include <memory>

namespace Kiacha3D {

class VulkanBackend {
public:
    VulkanBackend(uint32_t width, uint32_t height, const char* app_name = "KiachaOS 3D");
    ~VulkanBackend();
    
    bool initialize();
    void shutdown();
    
    // Device management
    VkInstance get_instance() const;
    VkDevice get_device() const;
    VkPhysicalDevice get_physical_device() const;
    VkQueue get_graphics_queue() const;
    VkCommandPool get_command_pool() const;
    
    // Swapchain operations
    void recreate_swapchain();
    VkSwapchainKHR get_swapchain() const;
    
    // Rendering
    void begin_frame();
    void end_frame();
    VkCommandBuffer get_current_command_buffer() const;
    
    // Resource creation helpers
    VkBuffer create_buffer(VkDeviceSize size, VkBufferUsageFlags usage,
                          VkMemoryPropertyFlags properties);
    void copy_buffer(VkBuffer src, VkBuffer dst, VkDeviceSize size);
    
    VkImage create_image(uint32_t width, uint32_t height, VkFormat format,
                        VkImageUsageFlags usage);
    
private:
    // Initialization steps
    bool create_instance();
    bool setup_debug_messenger();
    bool pick_physical_device();
    bool create_logical_device();
    bool create_swapchain();
    bool create_command_pool();
    bool create_command_buffers();
    bool create_semaphores();
    
    uint32_t width_, height_;
    std::string app_name_;
    
    VkInstance instance_;
    VkDebugUtilsMessengerEXT debug_messenger_;
    VkPhysicalDevice physical_device_;
    VkDevice device_;
    VkQueue graphics_queue_;
    VkCommandPool command_pool_;
    std::vector<VkCommandBuffer> command_buffers_;
    
    VkSurfaceKHR surface_;
    VkSwapchainKHR swapchain_;
    std::vector<VkImage> swapchain_images_;
    std::vector<VkImageView> swapchain_image_views_;
    VkFormat swapchain_format_;
    
    VkSemaphore image_available_semaphore_;
    VkSemaphore render_finished_semaphore_;
};

} // namespace Kiacha3D

#endif // KIACHA3D_VULKAN_BACKEND_HPP
