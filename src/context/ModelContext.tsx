"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface Model {
    id: string;
    name: string;
    provider: string;
    description: string;
    isActive: boolean;
    modelId: string;
    supportsImages: boolean;
    maxTokens: number;
}

interface ModelContextType {
    models: Model[];
    selectedModels: string[];
    setSelectedModels: (modelIds: string[]) => void;
    toggleModel: (modelId: string) => void;
    isLoading: boolean;
    refreshModels: () => Promise<void>;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const useModel = () => {
    const context = useContext(ModelContext);
    if (!context) {
        throw new Error("useModel must be used within a ModelProvider");
    }
    return context;
};

interface ModelProviderProps {
    children: ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
    const { data: session } = useSession();
    const [models, setModels] = useState<Model[]>([]);
    const [selectedModels, setSelectedModels] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchModels = async () => {
        if (!session || isLoading) return; // Prevent multiple simultaneous calls

        setIsLoading(true);
        try {
            const response = await fetch("/api/models");
            if (response.ok) {
                const data = await response.json();
                setModels(data);
                // Auto-select first model from each provider if none selected
                if (data.length > 0 && selectedModels.length === 0) {
                    const firstModels = Object.values(
                        data.reduce((acc: any, model: any) => {
                            if (!acc[model.provider]) {
                                acc[model.provider] = model.id;
                            }
                            return acc;
                        }, {})
                    ) as string[];
                    setSelectedModels(firstModels.slice(0, 3)); // Select up to 3 models initially
                }
            } else {
                console.error("Failed to fetch models:", response.statusText);
            }
        } catch (error) {
            console.error("Failed to fetch models:", error);
            setModels([]); // Set empty array on error to stop loading state
        } finally {
            setIsLoading(false);
        }
    };

    const toggleModel = (modelId: string) => {
        setSelectedModels(prev => {
            if (prev.includes(modelId)) {
                return prev.filter(id => id !== modelId);
            } else {
                return [...prev, modelId];
            }
        });
    };

    useEffect(() => {
        if (session && !isLoading && models.length === 0) {
            fetchModels();
        }
    }, [session?.user?.id]); // Only depend on user ID, not session object

    const value: ModelContextType = {
        models,
        selectedModels,
        setSelectedModels,
        toggleModel,
        isLoading,
        refreshModels: fetchModels,
    };

    return (
        <ModelContext.Provider value={value}>
            {children}
        </ModelContext.Provider>
    );
};