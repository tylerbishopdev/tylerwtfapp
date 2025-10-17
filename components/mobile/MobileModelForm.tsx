"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { LoraOption } from "@/lib/fal-utils";

// Simple toast implementation
const toast = {
    success: (message: string) => console.log('Success:', message),
    error: (message: string) => console.error('Error:', message),
};

interface Model {
    name: string;
    category: string;
    endpointId: string | null;
    isLora: boolean;
}

interface MobileModelFormProps {
    selectedModel: Model | null;
    onOutputGenerated: (output: any) => void;
    inModal?: boolean;
}

interface SchemaProperty {
    type?: string;
    description?: string;
    examples?: any[];
    enum?: string[];
    minimum?: number;
    maximum?: number;
    default?: any;
    title?: string;
}

interface ModelSchema {
    inputSchema: {
        properties: Record<string, SchemaProperty>;
        required?: string[];
    };
    documentationUrl?: string;
    playgroundUrl?: string;
}

export function MobileModelForm({ selectedModel, onOutputGenerated, inModal = false }: MobileModelFormProps) {
    const [schema, setSchema] = useState<ModelSchema | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loraOptions, setLoraOptions] = useState<LoraOption[]>([]);

    // Load Lora options on component mount
    useEffect(() => {
        fetch('/api/lora-options')
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setLoraOptions(data.loraOptions);
                }
            })
            .catch((error) => {
                console.error('Error fetching Lora options:', error);
            });
    }, []);

    // Fetch schema when model changes
    useEffect(() => {
        if (!selectedModel) {
            setSchema(null);
            setFormData({});
            return;
        }

        setLoading(true);
        const encodedModel = encodeURIComponent(selectedModel.name);

        fetch(`/api/models/${encodedModel}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setSchema(data);

                    // Initialize form with default values
                    const initialData: Record<string, any> = {};
                    const properties = data.inputSchema?.properties || {};

                    Object.entries(properties).forEach(([key, prop]) => {
                        const propTyped = prop as SchemaProperty;
                        if (propTyped.default !== undefined) {
                            initialData[key] = propTyped.default;
                        }
                    });

                    setFormData(initialData);
                } else {
                    toast.error("Failed to load model schema");
                }
            })
            .catch((error) => {
                console.error("Error fetching schema:", error);
                toast.error("Failed to load model schema");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [selectedModel]);

    const handleInputChange = (key: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleLoraSelection = (loraName: string) => {
        const selectedLora = loraOptions.find(option => option.name === loraName);
        if (selectedLora) {
            const currentLoras = formData.loras || [];
            const newLoras = [...currentLoras, { path: selectedLora.url, scale: 1 }];
            handleInputChange('loras', newLoras);
        }
    };

    const removeLora = (index: number) => {
        const currentLoras = formData.loras || [];
        const newLoras = currentLoras.filter((_: any, i: number) => i !== index);
        handleInputChange('loras', newLoras);
    };

    const updateLoraScale = (index: number, scale: number) => {
        const currentLoras = formData.loras || [];
        const newLoras = currentLoras.map((lora: any, i: number) =>
            i === index ? { ...lora, scale } : lora
        );
        handleInputChange('loras', newLoras);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedModel || !schema) return;

        setSubmitting(true);

        try {
            const encodedModel = encodeURIComponent(selectedModel.name);
            const response = await fetch(`/api/submit/${encodedModel}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                onOutputGenerated({
                    model: selectedModel.name,
                    requestId: data.request_id,
                    result: data.result,
                    timestamp: data.retrieved_at,
                });
                toast.success("Generation completed!");
            } else {
                toast.error(data.error || "Failed to submit request");
            }
        } catch (error) {
            console.error("Error submitting request:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to submit request"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const renderLoraInput = (key: string, property: SchemaProperty) => {
        const isRequired = schema?.inputSchema?.required?.includes(key) || false;
        const currentLoras = formData.loras || [];

        return (
            <div key={key} className="space-y-3">
                <Label htmlFor={key} className="text-sm">
                    {property.title || key}
                    {isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>

                <div className="space-y-2">
                    <Select onValueChange={handleLoraSelection}>
                        <SelectTrigger className="h-12">
                            <SelectValue placeholder="Choose a LoRA model..." />
                        </SelectTrigger>
                        <SelectContent>
                            {loraOptions.map((option) => (
                                <SelectItem key={option.name} value={option.name}>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{option.name}</span>
                                        {option.subjectReference && (
                                            <span className="text-xs text-muted-foreground">
                                                Subject: {option.subjectReference}
                                            </span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {currentLoras.length > 0 && (
                    <div className="space-y-2">
                        {currentLoras.map((lora: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-xs truncate">
                                        {loraOptions.find(opt => opt.url === lora.path)?.name || 'Unknown LoRA'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="4"
                                        step="0.1"
                                        value={lora.scale}
                                        onChange={(e) => updateLoraScale(index, parseFloat(e.target.value) || 1)}
                                        className="w-16 h-9 text-xs"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeLora(index)}
                                        className="h-9 w-9 p-0"
                                    >
                                        ✕
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {property.description && (
                    <p className="text-xs text-muted-foreground">
                        {property.description}
                    </p>
                )}
            </div>
        );
    };

    const renderInput = (key: string, property: SchemaProperty) => {
        const isRequired = schema?.inputSchema?.required?.includes(key) || false;
        const value = formData[key];

        // Handle Lora fields specially
        if (key === 'loras') {
            return renderLoraInput(key, property);
        }

        // Handle different input types
        if (property.enum) {
            return (
                <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-sm">
                        {property.title || key}
                        {isRequired && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Select
                        value={value || ""}
                        onValueChange={(val) => handleInputChange(key, val)}
                    >
                        <SelectTrigger className="h-12">
                            <SelectValue placeholder={`Select ${property.title || key}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {property.enum.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {property.description && (
                        <p className="text-xs text-muted-foreground">
                            {property.description}
                        </p>
                    )}
                </div>
            );
        }

        if (property.type === "string") {
            const isLongText = property.description?.toLowerCase().includes("prompt") ||
                property.description?.toLowerCase().includes("text") ||
                key.toLowerCase().includes("prompt");

            if (isLongText) {
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-sm">
                            {property.title || key}
                            {isRequired && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Textarea
                            id={key}
                            value={value || ""}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            placeholder={property.examples?.[0] || ""}
                            rows={4}
                            className="min-h-[100px] text-base"
                        />
                        {property.description && (
                            <p className="text-xs text-muted-foreground">
                                {property.description}
                            </p>
                        )}
                    </div>
                );
            }

            return (
                <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-sm">
                        {property.title || key}
                        {isRequired && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                        id={key}
                        type="text"
                        value={value || ""}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder={property.examples?.[0] || ""}
                        className="h-12 text-base"
                    />
                    {property.description && (
                        <p className="text-xs text-muted-foreground">
                            {property.description}
                        </p>
                    )}
                </div>
            );
        }

        if (property.type === "number" || property.type === "integer") {
            return (
                <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-sm">
                        {property.title || key}
                        {isRequired && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                        id={key}
                        type="number"
                        min={property.minimum}
                        max={property.maximum}
                        value={value || ""}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder={property.examples?.[0] || property.default?.toString()}
                        className="h-12 text-base"
                    />
                    {property.description && (
                        <p className="text-xs text-muted-foreground">
                            {property.description}
                        </p>
                    )}
                    {(property.minimum !== undefined || property.maximum !== undefined) && (
                        <p className="text-xs text-muted-foreground">
                            Range: {property.minimum || 0} - {property.maximum || "∞"}
                        </p>
                    )}
                </div>
            );
        }

        if (property.type === "boolean") {
            return (
                <div key={key} className="flex items-center space-x-3 py-2   text-accen">
                    <input
                        id={key}
                        type="checkbox"
                        checked={value || false}
                        onChange={(e) => handleInputChange(key, e.target.checked)}
                        className="border-accent border bg-accent/30 text-accent"
                    />
                    <Label htmlFor={key} className="text-sm">
                        {property.title || key}
                        {isRequired && <span className="text-destructive ml-1">*</span>}
                    </Label>
                </div>
            );
        }

        // Default fallback
        return (
            <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-sm">
                    {property.title || key}
                    {isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                    id={key}
                    type="text"
                    value={value || ""}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="h-12 text-base"
                />
                {property.description && (
                    <p className="text-xs text-muted-foreground">
                        {property.description}
                    </p>
                )}
            </div>
        );
    };

    if (!selectedModel) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                    <div className="text-4xl mb-4">📱</div>
                    <h3 className="text-lg font-medium mb-2">
                        Select a Model
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        Choose a model to get started
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    if (!schema) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="text-lg font-medium mb-2">
                        Failed to Load Model
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        Could not load {selectedModel.name}
                    </p>
                </div>
            </div>
        );
    }

    const properties = schema?.inputSchema?.properties || {};
    const requiredFields = schema?.inputSchema?.required || [];

    const requiredProperties = Object.entries(properties).filter(([key]) =>
        requiredFields.includes(key)
    );
    const optionalProperties = Object.entries(properties).filter(
        ([key]) => !requiredFields.includes(key)
    );

    return (
        <div className={inModal ? "p-4" : "p-4 h-full"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    {requiredProperties.map(([key, property]) =>
                        renderInput(key, property as SchemaProperty)
                    )}
                    {optionalProperties.length > 0 && (
                        <details className="mt-4">
                            <summary className="cursor-pointer text-sm font-medium py-2">
                                Advanced Options
                            </summary>
                            <div className="space-y-4 mt-4">
                                {optionalProperties.map(([key, property]) =>
                                    renderInput(key, property as SchemaProperty)
                                )}
                            </div>
                        </details>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={submitting || !selectedModel}
                    className="w-full h-12 text-base"
                    size="lg"
                >
                    {submitting ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating...
                        </div>
                    ) : (
                        "Generate"
                    )}
                </Button>
            </form>
        </div>
    );
}


