"use client";

import { useState } from "react";
import Image from "next/image";



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
    "Image generation": <img src="https://unpkg.com/pixelarticons@1.8.1/svg/camera.svg" className="w-4 h-4" />,
    "Trained models": <img src="https://unpkg.com/pixelarticons@1.8.1/svg/zap.svg" className="w-4 h-4" />,
    "Video models": <img src="https://unpkg.com/pixelarticons@1.8.1/svg/video.svg" className="w-4 h-4" />,
    "Avatar models": <img src="https://unpkg.com/pixelarticons@1.8.1/svg/human.svg" className="w-4 h-4" />,
    "3D assets generation": <img src="https://unpkg.com/pixelarticons@1.8.1/svg/suitcase.svg" className="w-4 h-4" />,
    "Audio Generation": <img src="https://unpkg.com/pixelarticons@1.8.1/svg/headphone.svg" className="w-4 h-4" />,
    "Subject Training Models": <img src="https://unpkg.com/pixelarticons@1.8.1/svg/teach.svg" className="w-4 h-4" />,
    "Utility models": <img src="https://unpkg.com/pixelarticons@1.8.1/svg/sliders.svg" className="w-4 h-4" />,
    "LoRAs": <img src="https://unpkg.com/pixelarticons@1.8.1/svg/users.svg" className="w-4 h-4" />,
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
        <div className="flex flex-col h-full woody">


            <div className="pt-2 border-b border ">
                <Image src="/logo.png" alt="Tylers.wtf" width={150} height={150} className="mx-auto py-3" />
                <div className="px-3 pb-3 border-2 border-background align-items-center pt-4 bg-background/80 mb-2">
                    <p className="tracking-tighter   mb-1 time-counter  text-center mx-auto ">
                        Model Playgroud Supreme
                    </p>
                </div>
            </div>


            {/* Categories */}
            <div className="flex-1 overflow-y-auto ">
                {Object.entries(modelsByCategory).map(([category, categoryModels]) => (
                    <div key={category} className="border-y border border-zinc-900 last:border-b-4 first:border-t-4">
                        <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center justify-between p-3 hover:bg-secondary/10 analog-button vintage-button-active transition-colors pl-3"
                        >
                            <div className="flex items-center gap-3 justify-between">

                                {categoryIcons[category] || <img src="https://unpkg.com/pixelarticons@1.8.1/svg/wrench.svg" />}
                                <span className="text-[7px] screen-background font-lcd pt-1.5 font-bold text-primary/70 border px-1 border-border/50 rounded items-align-self w-8 mx-auto text-right">
                                    {categoryModels.length}
                                </span>
                                <span className="font-medium text-primary-foreground">
                                    {category}
                                </span>

                            </div>
                            {expandedCategories.has(category) ? (
                                <img src="https://unpkg.com/pixelarticons@1.8.1/svg/chevron-down.svg" className="w-4 h-4 text-muted" />
                            ) : (
                                <img src="https://unpkg.com/pixelarticons@1.8.1/svg/chevron-right.svg" className="w-4 h-4 text-muted" />
                            )}
                        </button>

                        {expandedCategories.has(category) && (
                            <div className="bg-black border-b border-border/50">
                                {categoryModels.map((model) => (
                                    <button
                                        key={model.name}
                                        onClick={() => handleModelClick(model)}
                                        className={`w-full text-left p-3 pl-2 hover:bg-accent/20 bg-black transition-colors   border-b-2 border screen-background border-muted ${selectedModel?.name === model.name
                                            ? "bg-accent   overflow-hidden scrollbar-hide"
                                            : " "
                                            }`}
                                    >
                                        <div className="flex flex-col  hover:text-accent group">
                                            <span className="text-sm font-medium text-primary/80 truncate  group-hover:text-accent ">
                                                {model.name}
                                            </span>
                                            {model.endpointId && (
                                                <span className="text-xs text-muted-foreground truncate  group-hover:text-accent ">
                                                    {model.endpointId}
                                                </span>
                                            )}
                                            {model.isLora && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent-foreground mt-1 w-fit">
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
