//! Scene management for longform projects.

use crate::error::{BismuthError, Result};
use super::Scene;
use std::path::Path;

/// Reorder scenes within a project by moving a scene to a new index.
pub fn reorder_scenes(scenes: &mut Vec<Scene>, from_index: usize, to_index: usize) -> Result<()> {
    if from_index >= scenes.len() || to_index >= scenes.len() {
        return Err(BismuthError::Validation("Scene index out of bounds".to_string()));
    }
    let scene = scenes.remove(from_index);
    scenes.insert(to_index, scene);
    // Update order fields
    for (i, s) in scenes.iter_mut().enumerate() {
        s.order = i;
    }
    Ok(())
}

/// Create a new scene file in the project directory.
pub fn create_scene(
    project_dir: &Path,
    title: &str,
    order: usize,
    template: Option<&str>,
) -> Result<Scene> {
    // Sanitize title for filename
    let safe_title: String = title.chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_' || *c == ' ')
        .collect();
    if safe_title.is_empty() {
        return Err(BismuthError::Validation("Invalid scene title".to_string()));
    }

    let filename = format!("{}.md", safe_title);
    let path = project_dir.join(&filename);

    let content = template.unwrap_or("---\n---\n\n");
    std::fs::write(&path, content)
        .map_err(|e| BismuthError::Io(format!("Create scene: {}", e)))?;

    Ok(Scene {
        title: title.to_string(),
        path: path.to_string_lossy().to_string(),
        order,
        word_count: 0,
        children: vec![],
        status: "todo".to_string(),
        draft_count: 0,
    })
}

/// Delete a scene file.
pub fn delete_scene(scene_path: &Path) -> Result<()> {
    if scene_path.exists() {
        std::fs::remove_file(scene_path)
            .map_err(|e| BismuthError::Io(format!("Delete scene: {}", e)))?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reorder_scenes() {
        let mut scenes = vec![
            Scene { title: "A".into(), path: "a.md".into(), order: 0, word_count: 0, children: vec![], status: String::new(), draft_count: 0 },
            Scene { title: "B".into(), path: "b.md".into(), order: 1, word_count: 0, children: vec![], status: String::new(), draft_count: 0 },
            Scene { title: "C".into(), path: "c.md".into(), order: 2, word_count: 0, children: vec![], status: String::new(), draft_count: 0 },
        ];
        reorder_scenes(&mut scenes, 0, 2).unwrap();
        assert_eq!(scenes[0].title, "B");
        assert_eq!(scenes[1].title, "C");
        assert_eq!(scenes[2].title, "A");
    }
}
