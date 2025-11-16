#include "object_loader.hpp"
#include <fstream>
#include <sstream>
#include <iostream>
#include <algorithm>

namespace Kiacha3D {

std::string ObjectLoader::get_file_extension(const std::string& filepath) {
    size_t pos = filepath.find_last_of('.');
    if (pos != std::string::npos) {
        std::string ext = filepath.substr(pos + 1);
        // Convert to lowercase
        std::transform(ext.begin(), ext.end(), ext.begin(), ::tolower);
        return ext;
    }
    return "";
}

bool ObjectLoader::supports_format(const std::string& filepath) {
    std::string ext = get_file_extension(filepath);
    return ext == "obj" || ext == "gltf" || ext == "glb";
}

std::shared_ptr<Mesh> ObjectLoader::load_obj(const std::string& filepath) {
    return parse_obj(filepath);
}

std::shared_ptr<Mesh> ObjectLoader::load_gltf(const std::string& filepath) {
    std::cout << "[ObjectLoader] GLTF support placeholder: " << filepath << std::endl;
    // Full GLTF implementation would use tinygltf or similar
    return std::make_shared<Mesh>();
}

std::shared_ptr<Mesh> ObjectLoader::load_glb(const std::string& filepath) {
    std::cout << "[ObjectLoader] GLB support placeholder: " << filepath << std::endl;
    return std::make_shared<Mesh>();
}

std::shared_ptr<Mesh> ObjectLoader::parse_obj(const std::string& filepath) {
    auto mesh = std::make_shared<Mesh>();
    mesh->name = filepath;
    
    std::ifstream file(filepath);
    if (!file.is_open()) {
        std::cerr << "[ObjectLoader] Failed to open OBJ file: " << filepath << std::endl;
        return mesh;
    }
    
    std::vector<glm::vec3> temp_vertices;
    std::vector<glm::vec3> temp_normals;
    std::vector<glm::vec2> temp_uvs;
    
    std::string line;
    int line_num = 0;
    
    while (std::getline(file, line)) {
        line_num++;
        
        // Skip comments and empty lines
        if (line.empty() || line[0] == '#') continue;
        
        std::istringstream iss(line);
        std::string prefix;
        iss >> prefix;
        
        if (prefix == "v") {
            // Vertex position
            glm::vec3 vertex;
            iss >> vertex.x >> vertex.y >> vertex.z;
            temp_vertices.push_back(vertex);
            
        } else if (prefix == "vn") {
            // Vertex normal
            glm::vec3 normal;
            iss >> normal.x >> normal.y >> normal.z;
            temp_normals.push_back(glm::normalize(normal));
            
        } else if (prefix == "vt") {
            // Texture coordinate
            glm::vec2 uv;
            iss >> uv.x >> uv.y;
            temp_uvs.push_back(uv);
            
        } else if (prefix == "f") {
            // Face (triangle)
            std::string face_str;
            int vertex_count = 0;
            std::vector<uint32_t> face_indices;
            
            while (iss >> face_str && vertex_count < 3) {
                // Parse vertex/uv/normal indices
                std::stringstream ss(face_str);
                uint32_t v_idx = 0, uv_idx = 0, n_idx = 0;
                char slash;
                
                ss >> v_idx;
                if (ss.peek() == '/') {
                    ss >> slash >> uv_idx >> slash >> n_idx;
                }
                
                // Decrement indices (OBJ uses 1-based indexing)
                if (v_idx > 0) {
                    mesh->vertices.push_back(temp_vertices[v_idx - 1]);
                    face_indices.push_back(mesh->vertices.size() - 1);
                    
                    if (n_idx > 0 && n_idx <= temp_normals.size()) {
                        mesh->normals.push_back(temp_normals[n_idx - 1]);
                    }
                    if (uv_idx > 0 && uv_idx <= temp_uvs.size()) {
                        mesh->uvs.push_back(temp_uvs[uv_idx - 1]);
                    }
                }
                vertex_count++;
            }
            
            // Add face indices
            for (uint32_t idx : face_indices) {
                mesh->indices.push_back(idx);
            }
        }
    }
    
    file.close();
    
    std::cout << "[ObjectLoader] Loaded OBJ: " << filepath << std::endl;
    std::cout << "  Vertices: " << mesh->vertices.size() << std::endl;
    std::cout << "  Normals: " << mesh->normals.size() << std::endl;
    std::cout << "  UVs: " << mesh->uvs.size() << std::endl;
    std::cout << "  Indices: " << mesh->indices.size() << std::endl;
    
    return mesh;
}

} // namespace Kiacha3D
