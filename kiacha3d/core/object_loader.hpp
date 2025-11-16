#ifndef KIACHA3D_OBJECT_LOADER_HPP
#define KIACHA3D_OBJECT_LOADER_HPP

#include "scene_manager.hpp"
#include <string>
#include <memory>

namespace Kiacha3D {

class ObjectLoader {
public:
    // Load 3D model files
    static std::shared_ptr<Mesh> load_obj(const std::string& filepath);
    static std::shared_ptr<Mesh> load_gltf(const std::string& filepath);
    static std::shared_ptr<Mesh> load_glb(const std::string& filepath);
    
    // Helper functions
    static bool supports_format(const std::string& filepath);
    static std::string get_file_extension(const std::string& filepath);
    
private:
    // OBJ parsing
    static std::shared_ptr<Mesh> parse_obj(const std::string& filepath);
};

} // namespace Kiacha3D

#endif // KIACHA3D_OBJECT_LOADER_HPP
