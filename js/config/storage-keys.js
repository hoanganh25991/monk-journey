/**
 * Centralized configuration for localStorage keys
 * This ensures consistency when reading/writing to localStorage
 */

export const STORAGE_KEYS = {
    // Audio settings
    AUDIO_SETTINGS: 'monk_journey_audio_settings',
    MUTED: 'monk_journey_muted',
    MUSIC_VOLUME: 'monk_journey_music_volume',
    SFX_VOLUME: 'monk_journey_sfx_volume',
    
    // Performance and quality settings
    QUALITY_LEVEL: 'monk_journey_quality_level',
    ADAPTIVE_QUALITY: 'monk_journey_adaptive_quality',
    TARGET_FPS: 'monk_journey_target_fps',
    SHOW_PERFORMANCE_INFO: 'monk_journey_show_performance_info',
    DEBUG_MODE: 'monk_journey_debug_mode',
    
    // Character settings
    CHARACTER_MODEL: 'monk_journey_character_model',
    MODEL_PREVIEW: 'monk_journey_model_preview',
    ANIMATION_PREVIEW: 'monk_journey_animation_preview',
    MODEL_ADJUSTMENTS: 'modelAdjustments',
    SELECTED_MODEL: 'monk_journey_selected_model',
    SELECTED_SIZE: 'monk_journey_selected_size',
    SELECTED_ANIMATION: 'monk_journey_selected_animation',
    
    // Game settings
    DIFFICULTY: 'monk_journey_difficulty',
    SELECTED_SKILLS: 'monk_journey_selected_skills',
    SELECTED_SKILL_PREVIEW: 'monk_journey_selected_skill_preview',
    SELECTED_SKILL_VARIANT: 'monk_journey_selected_skill_variant',
    SKILL_TREE_DATA: 'monk_journey_skill_tree_data',
    SELECTED_ENEMY_PREVIEW: 'monk_journey_selected_enemy_preview',
    SELECTED_ENEMY_ANIMATION: 'monk_journey_selected_enemy_animation',
    CUSTOM_SKILLS: 'monk_journey_custom_skills',
    CAMERA_ZOOM: 'monk_journey_camera_zoom',
    
    // Save system keys
    SAVE_DATA: 'monk_journey_save',
    CHUNK_PREFIX: 'monk_journey_chunk_',
    CHUNK_INDEX: 'monk_journey_chunk_index',
};