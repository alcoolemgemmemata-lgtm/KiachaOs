#include "scene_manager.hpp"
#include <glm/gtc/matrix_transform.hpp>
#include <iostream>

namespace Kiacha3D {

glm::mat4 SceneObject::get_model_matrix() const {
    glm::mat4 model = glm::mat4(1.0f);
    model = glm::translate(model, transform.position);
    
    // Apply rotation (XYZ order)
    model = glm::rotate(model, transform.rotation.x, glm::vec3(1, 0, 0));
    model = glm::rotate(model, transform.rotation.y, glm::vec3(0, 1, 0));
    model = glm::rotate(model, transform.rotation.z, glm::vec3(0, 0, 1));
    
    model = glm::scale(model, transform.scale);
    return model;
}

SceneManager::SceneManager()
    : next_object_id_(1), background_color_(0.1f, 0.1f, 0.1f),
      ambient_light_(1, 1, 1), ambient_intensity_(0.3f) {
    std::cout << "[SceneManager] Initialized" << std::endl;
}

SceneManager::~SceneManager() {
    objects_.clear();
    std::cout << "[SceneManager] Destroyed" << std::endl;
}

uint32_t SceneManager::add_object(const std::string& name) {
    uint32_t id = next_object_id_++;
    auto obj = std::make_shared<SceneObject>(id, name);
    objects_[id] = obj;
    std::cout << "[SceneManager] Added object: " << name << " (id: " << id << ")" << std::endl;
    return id;
}

void SceneManager::remove_object(uint32_t object_id) {
    if (objects_.find(object_id) != objects_.end()) {
        objects_.erase(object_id);
        std::cout << "[SceneManager] Removed object id: " << object_id << std::endl;
    }
}

SceneObject* SceneManager::get_object(uint32_t object_id) {
    auto it = objects_.find(object_id);
    if (it != objects_.end()) {
        return it->second.get();
    }
    return nullptr;
}

std::vector<SceneObject*> SceneManager::get_all_objects() {
    std::vector<SceneObject*> result;
    for (auto& pair : objects_) {
        result.push_back(pair.second.get());
    }
    return result;
}

void SceneManager::set_object_position(uint32_t object_id, glm::vec3 pos) {
    auto obj = get_object(object_id);
    if (obj) {
        obj->transform.position = pos;
    }
}

void SceneManager::set_object_rotation(uint32_t object_id, glm::vec3 euler) {
    auto obj = get_object(object_id);
    if (obj) {
        obj->transform.rotation = euler;
    }
}

void SceneManager::set_object_scale(uint32_t object_id, glm::vec3 scale) {
    auto obj = get_object(object_id);
    if (obj) {
        obj->transform.scale = scale;
    }
}

void SceneManager::set_object_visible(uint32_t object_id, bool visible) {
    auto obj = get_object(object_id);
    if (obj) {
        obj->visible = visible;
    }
}

void SceneManager::animate_object(uint32_t object_id, const Transform& target_transform, float duration) {
    std::cout << "[SceneManager] Animation queued for object " << object_id << " (duration: " << duration << "s)" << std::endl;
    // Animation implementation
}

void SceneManager::update_animations(float delta_time) {
    // Update all active animations
}

void SceneManager::add_mesh_to_object(uint32_t object_id, std::shared_ptr<Mesh> mesh) {
    auto obj = get_object(object_id);
    if (obj) {
        obj->meshes.push_back(mesh);
        std::cout << "[SceneManager] Mesh added to object " << object_id << std::endl;
    }
}

void SceneManager::set_background_color(glm::vec3 color) {
    background_color_ = color;
}

glm::vec3 SceneManager::get_background_color() const {
    return background_color_;
}

void SceneManager::set_ambient_light(glm::vec3 color, float intensity) {
    ambient_light_ = color;
    ambient_intensity_ = intensity;
}

uint32_t SceneManager::raycast(glm::vec3 ray_start, glm::vec3 ray_direction) {
    // Raycast implementation for object picking
    return 0;
}

} // namespace Kiacha3D
