import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Section {
    id: string;
    project_id: string;
    section_type: string;
    content_markdown: string;
    status: string;
    order_index: number;
}

export function useProjectData(projectId: string) {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSections = useCallback(async () => {
        if (!projectId) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('sections')
                .select('*')
                .eq('project_id', projectId)
                .order('order_index');

            if (error) throw error;

            if (data) {
                setSections(data);
            }
        } catch (error) {
            console.error('Error fetching sections:', error);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    const updateSectionContent = async (sectionType: string, content: string) => {
        try {
            // Optimistic update
            setSections(prev => prev.map(s =>
                s.section_type === sectionType ? { ...s, content_markdown: content } : s
            ));

            // Find section ID
            const section = sections.find(s => s.section_type === sectionType);
            if (!section) return;

            const { error } = await supabase
                .from('sections')
                .update({ content_markdown: content, status: 'In Progress' })
                .eq('id', section.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating section:', error);
            // Revert on error (optional)
            fetchSections();
        }
    };

    return {
        sections,
        loading,
        updateSectionContent,
        refresh: fetchSections
    };
}
