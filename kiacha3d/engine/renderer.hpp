#ifndef KIACHA3D_RENDERER_HPP
#define KIACHA3D_RENDERER_HPP

#include <string>
#include <vector>
#include <memory>
#include <glm/glm.hpp>

namespace Kiacha3D {

struct Camera {
    glm::vec3 position;
    glm::vec3 target;
    glm::vec3 up;
    float fov;
    float aspect;
    float near_plane;
    float far_plane;
    
    Camera(glm::vec3 pos = glm::vec3(0, 0, 5),
           glm::vec3 tgt = glm::vec3(0, 0, 0),
           float fov_deg = 45.0f)
        : position(pos), target(tgt), up(0, 1, 0),
          fov(fov_deg), aspect(16.0f/9.0f),
          near_plane(0.1f), far_plane(1000.0f) {}
};

struct Light {
    enum class Type { DIRECTIONAL, POINT, SPOT };
    Type type;
    glm::vec3 position;
    glm::vec3 direction;
    glm::vec3 color;
    float intensity;
    float range;
    
    Light(Type t = Type::DIRECTIONAL)
        : type(t), position(0), direction(0, -1, 0),
          color(1, 1, 1), intensity(1.0f), range(100.0f) {}
};

struct Material {
    glm::vec3 base_color;
    float metallic;
    float roughness;
    float ambient_occlusion;
    std::string texture_path;
    
    Material()
        : base_color(0.8f), metallic(0.0f),
          roughness(0.5f), ambient_occlusion(1.0f) {}
};

class Renderer {
public:
    Renderer(uint32_t width = 1920, uint32_t height = 1080);
    ~Renderer();
    
    // Window and rendering
    bool initialize();
    void shutdown();
    bool should_close() const;
    void poll_events();
    void render_frame();
    void set_clear_color(glm::vec3 color);
    
    // Camera control
    void set_camera(const Camera& cam);
    Camera get_camera() const;
    void move_camera(glm::vec3 delta);
    void rotate_camera(float yaw, float pitch);
    void zoom_camera(float factor);
    
    // Lighting
    uint32_t add_light(const Light& light);
    void remove_light(uint32_t light_id);
    void update_light(uint32_t light_id, const Light& light);
    
    // Rendering configuration
    void set_wireframe(bool enabled);
    void set_shadow_quality(int quality); // 0-3
    void enable_post_processing(bool enabled);
    
    // Rendering state info
    float get_frame_time() const;
    int get_fps() const;
    
private:
    uint32_t width_, height_;
    Camera camera_;
    std::vector<Light> lights_;
    bool wireframe_mode_;
    int shadow_quality_;
    bool post_processing_enabled_;
};

} // namespace Kiacha3D

#endif // KIACHA3D_RENDERER_HPP
