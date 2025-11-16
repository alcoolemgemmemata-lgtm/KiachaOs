#ifndef KIACHA3D_SCENE_MANAGER_HPP
#define KIACHA3D_SCENE_MANAGER_HPP

#include <string>
#include <vector>
#include <memory>
#include <map>
#include <glm/glm.hpp>

namespace Kiacha3D {

struct Transform {
    glm::vec3 position;
    glm::vec3 rotation;  // Euler angles (radians)
    glm::vec3 scale;
    
    Transform()
        : position(0), rotation(0), scale(1) {}
};

struct Mesh {
    uint32_t id;
    std::string name;
    std::vector<glm::vec3> vertices;
    std::vector<glm::vec3> normals;
    std::vector<glm::vec2> uvs;
    std::vector<uint32_t> indices;
    uint32_t material_id;
};

class SceneObject {
public:
    uint32_t id;
    std::string name;
    Transform transform;
    std::vector<std::shared_ptr<Mesh>> meshes;
    bool visible;
    bool cast_shadow;
    
    SceneObject(uint32_t obj_id, const std::string& obj_name)
        : id(obj_id), name(obj_name), visible(true), cast_shadow(true) {}
    
    glm::mat4 get_model_matrix() const;
};

class SceneManager {
public:
    SceneManager();
    ~SceneManager();
    
    // Object management
    uint32_t add_object(const std::string& name);
    void remove_object(uint32_t object_id);
    SceneObject* get_object(uint32_t object_id);
    std::vector<SceneObject*> get_all_objects();
    
    // Object manipulation
    void set_object_position(uint32_t object_id, glm::vec3 pos);
    void set_object_rotation(uint32_t object_id, glm::vec3 euler);
    void set_object_scale(uint32_t object_id, glm::vec3 scale);
    void set_object_visible(uint32_t object_id, bool visible);
    
    // Animation
    void animate_object(uint32_t object_id, const Transform& target_transform, float duration);
    void update_animations(float delta_time);
    
    // Mesh management
    void add_mesh_to_object(uint32_t object_id, std::shared_ptr<Mesh> mesh);
    
    // Scene properties
    void set_background_color(glm::vec3 color);
    glm::vec3 get_background_color() const;
    
    void set_ambient_light(glm::vec3 color, float intensity);
    
    // Collision and picking
    uint32_t raycast(glm::vec3 ray_start, glm::vec3 ray_direction);
    
private:
    uint32_t next_object_id_;
    std::map<uint32_t, std::shared_ptr<SceneObject>> objects_;
    glm::vec3 background_color_;
    glm::vec3 ambient_light_;
    float ambient_intensity_;
};

} // namespace Kiacha3D

#endif // KIACHA3D_SCENE_MANAGER_HPP
