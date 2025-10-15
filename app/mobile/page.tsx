"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Settings, Sparkles } from "lucide-react";
import Image from "next/image";
import { MobileModelForm } from "@/components/mobile/MobileModelForm";
import { MobileOutputDisplay } from "@/components/mobile/MobileOutputDisplay";

interface Model {
    name: string;
    category: string;
    endpointId: string | null;
    isLora: boolean;
}

const categoryIcons: Record<string, string> = {
    "Image generation": "https://unpkg.com/pixelarticons@1.8.1/svg/camera.svg",
    "Trained models": "https://unpkg.com/pixelarticons@1.8.1/svg/zap.svg",
    "Video models": "https://unpkg.com/pixelarticons@1.8.1/svg/video.svg",
    "Avatar models": "https://unpkg.com/pixelarticons@1.8.1/svg/human.svg",
    "3D assets generation": "https://unpkg.com/pixelarticons@1.8.1/svg/suitcase.svg",
    "Audio Generation": "https://unpkg.com/pixelarticons@1.8.1/svg/headphone.svg",
    "Subject Training Models": "https://unpkg.com/pixelarticons@1.8.1/svg/teach.svg",
    "Utility models": "https://unpkg.com/pixelarticons@1.8.1/svg/sliders.svg",
    "LoRAs": "https://unpkg.com/pixelarticons@1.8.1/svg/users.svg",
};

export default function MobilePage() {
    const [models, setModels] = useState<Model[]>([]);
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);
    const [loading, setLoading] = useState(true);
    const [outputs, setOutputs] = useState<any[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
    const [inputsModalOpen, setInputsModalOpen] = useState(false);

    useEffect(() => {
        fetch("/api/models")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setModels(data.models);
                }
            })
            .catch((error) => {
                console.error("Error fetching models:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleModelSelect = (model: Model) => {
        setSelectedModel(model);
        setModelSelectorOpen(false);
    };

    const handleOutputGenerated = (output: any) => {
        setOutputs((prev) => [output, ...prev]);
        setInputsModalOpen(false);
    };

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading models...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Mobile Header */}
            <div className="sticky top-0 z-10 bg-card border-b border">
                <div className="flex items-center justify-between p-4">
                    <Image src="/logo.png" alt="Tylers.wtf" width={120} height={40} className="h-10 w-auto" />
                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => setModelSelectorOpen(true)}
                        className="text-base font-medium"
                    >
                        {selectedModel ? selectedModel.name.split("/").pop() : "Select Model"}
                        <ChevronDown className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            </div>

            {/* Output Display Area */}
            <div className="flex-1 overflow-hidden">
                <MobileOutputDisplay outputs={outputs} />
            </div>

            {/* Bottom Navigation */}
            <div className="sticky bottom-0 z-10 bg-card border-t border">
                <div className="flex items-center gap-3 p-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setInputsModalOpen(true)}
                        disabled={!selectedModel}
                        className="flex-1 h-14 text-base"
                    >
                        <Settings className="w-5 h-5 mr-2" />
                        Inputs
                    </Button>
                    <Button
                        size="lg"
                        disabled={!selectedModel}
                        className="flex-1 h-14 text-base bg-primary hover:bg-primary/90"
                        onClick={() => {
                            // Open inputs modal - user can review and submit
                            setInputsModalOpen(true);
                        }}
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate
                    </Button>
                </div>
            </div>

            {/* Model Selection Modal */}
            <Dialog open={modelSelectorOpen} onOpenChange={setModelSelectorOpen}>
                <DialogContent className="max-w-[95vw] max-h-[85vh] h-[85vh] p-0 gap-0">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>Select Model</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1">
                        {Object.entries(modelsByCategory).map(([category, categoryModels]) => (
                            <div key={category} className="border-b last:border-b-0">
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-accent/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={categoryIcons[category] || "https://unpkg.com/pixelarticons@1.8.1/svg/wrench.svg"}
                                            className="w-5 h-5"
                                            alt=""
                                        />
                                        <span className="font-medium">{category}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {categoryModels.length}
                                        </Badge>
                                    </div>
                                    <ChevronDown
                                        className={`w-5 h-5 transition-transform ${expandedCategories.has(category) ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>
                                {expandedCategories.has(category) && (
                                    <div className="bg-muted/30">
                                        {categoryModels.map((model) => (
                                            <button
                                                key={model.name}
                                                onClick={() => handleModelSelect(model)}
                                                className={`w-full text-left p-4 pl-12 hover:bg-accent/20 border-t ${selectedModel?.name === model.name ? "bg-accent/30" : ""
                                                    }`}
                                            >
                                                <div className="font-medium truncate">{model.name}</div>
                                                {model.endpointId && (
                                                    <div className="text-sm text-muted-foreground truncate mt-1">
                                                        {model.endpointId}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Inputs Modal */}
            <Dialog open={inputsModalOpen} onOpenChange={setInputsModalOpen}>
                <DialogContent className="max-w-[95vw] max-h-[85vh] h-[85vh] p-0 gap-0">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>Model Inputs</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1">
                        <MobileModelForm
                            selectedModel={selectedModel}
                            onOutputGenerated={handleOutputGenerated}
                            inModal={true}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
