"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Zap, Palette, Video, User, Box, Music, GraduationCap, Wrench, Layers } from "lucide-react";

interface Model {
    name: string;
    category: string;
    endpointId: string | null;
    isLora: boolean;
}

interface ModelSidebarProps {
    models: Model[];
    onModelSelect: (model: Model) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
    "Image generation": <Palette className="w-4 h-4" />,
    "Reference / trained media models": <Zap className="w-4 h-4" />,
    "Video models": <Video className="w-4 h-4" />,
    "Avatar models": <User className="w-4 h-4" />,
    "3D assets generation": <Box className="w-4 h-4" />,
    "Audio Generation": <Music className="w-4 h-4" />,
    "Subject Training Models": <GraduationCap className="w-4 h-4" />,
    "Utility models": <Wrench className="w-4 h-4" />,
    "LoRAs": <Layers className="w-4 h-4" />,
};

export function ModelSidebar({ models, onModelSelect }: ModelSidebarProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);

    // Group models by category
    const modelsByCategory = models.reduce((acc, model) => {
        if (!acc[model.category]) {
            acc[model.category] = [];
        }
        acc[model.category].push(model);
        return acc;
    }, {} as Record<string, Model[]>);

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    const handleModelClick = (model: Model) => {
        setSelectedModel(model);
        onModelSelect(model);
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-accent">
            {/* Header */}
            <div className="p-4 border-b border-">
                <h2 className="text-lg text-accent font-semibold ">
                    tylers.wtf
                </h2>
                <p className="text-sm text-background">
                    Model Playground Supreme
                </p>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto">
                {Object.entries(modelsByCategory).map(([category, categoryModels]) => (
                    <div key={category} className="border-b last:border-b-0">
                        <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                {categoryIcons[category] || <Wrench className="w-4 h-4" />}
                                <span className="font-medium text-secondary dark:text-primary">
                                    {category}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                                    {categoryModels.length}
                                </span>
                            </div>
                            {expandedCategories.has(category) ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                        </button>

                        {expandedCategories.has(category) && (
                            <div className="bg-gray-50 dark:bg-gray-800">
                                {categoryModels.map((model) => (
                                    <button
                                        key={model.name}
                                        onClick={() => handleModelClick(model)}
                                        className={`w-full text-left p-3 pl-8 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${selectedModel?.name === model.name
                                            ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
                                            : ""
                                            }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {model.name}
                                            </span>
                                            {model.endpointId && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {model.endpointId}
                                                </span>
                                            )}
                                            {model.isLora && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 mt-1 w-fit">
                                                    LoRA
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
