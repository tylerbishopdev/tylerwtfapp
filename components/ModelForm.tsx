"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, ExternalLink } from "lucide-react";
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

interface ModelFormProps {
    selectedModel: Model | null;
    onOutputGenerated: (output: any) => void;
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

export function ModelForm({ selectedModel, onOutputGenerated }: ModelFormProps) {
    const [schema, setSchema] = useState<ModelSchema | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [requestId, setRequestId] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

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
                        if (prop.default !== undefined) {
                            initialData[key] = prop.default;
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedModel || !schema) return;

        setSubmitting(true);
        setRequestId(null);
        setStatus(null);

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
                setRequestId(data.request_id);
                setStatus(data.status);
                toast.success("Request submitted successfully");

                // Start polling for status
                pollStatus(encodedModel, data.request_id);
            } else {
                toast.error(data.error || "Failed to submit request");
            }
        } catch (error) {
            console.error("Error submitting request:", error);
            toast.error("Failed to submit request");
        } finally {
            setSubmitting(false);
        }
    };

    const pollStatus = async (modelName: string, requestId: string) => {
        const poll = async () => {
            try {
                const response = await fetch(`/api/submit/${modelName}?request_id=${requestId}`);
                const data = await response.json();

                if (data.success) {
                    setStatus(data.status);

                    if (data.status === "COMPLETED") {
                        // Fetch final results
                        const resultResponse = await fetch(`/api/results/${modelName}/${requestId}`);
                        const resultData = await resultResponse.json();

                        if (resultData.success) {
                            onOutputGenerated({
                                model: modelName,
                                requestId,
                                result: resultData.result,
                                timestamp: resultData.retrieved_at,
                            });
                            toast.success("Generation completed!");
                        } else {
                            toast.error("Failed to fetch results");
                        }
                    } else if (data.status === "FAILED") {
                        toast.error("Generation failed");
                    } else {
                        // Continue polling
                        setTimeout(poll, 2000);
                    }
                }
            } catch (error) {
                console.error("Error polling status:", error);
                toast.error("Error checking status");
            }
        };

        poll();
    };

    const renderInput = (key: string, property: SchemaProperty) => {
        const isRequired = schema?.inputSchema?.required?.includes(key) || false;
        const value = formData[key];

        // Handle different input types
        if (property.enum) {
            return (
                <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                        {property.title || key}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Select
                        value={value || ""}
                        onValueChange={(val) => handleInputChange(key, val)}
                    >
                        <SelectTrigger>
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">
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
                        <Label htmlFor={key}>
                            {property.title || key}
                            {isRequired && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Textarea
                            id={key}
                            value={value || ""}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            placeholder={property.examples?.[0] || ""}
                            rows={4}
                        />
                        {property.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {property.description}
                            </p>
                        )}
                    </div>
                );
            }

            return (
                <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                        {property.title || key}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                        id={key}
                        type="text"
                        value={value || ""}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder={property.examples?.[0] || ""}
                    />
                    {property.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {property.description}
                        </p>
                    )}
                </div>
            );
        }

        if (property.type === "number" || property.type === "integer") {
            return (
                <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                        {property.title || key}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                        id={key}
                        type="number"
                        min={property.minimum}
                        max={property.maximum}
                        value={value || ""}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder={property.examples?.[0] || property.default?.toString()}
                    />
                    {property.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {property.description}
                        </p>
                    )}
                    {(property.minimum !== undefined || property.maximum !== undefined) && (
                        <p className="text-xs text-gray-400">
                            Range: {property.minimum || 0} - {property.maximum || "∞"}
                        </p>
                    )}
                </div>
            );
        }

        if (property.type === "boolean") {
            return (
                <div key={key} className="flex items-center space-x-2">
                    <input
                        id={key}
                        type="checkbox"
                        checked={value || false}
                        onChange={(e) => handleInputChange(key, e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <Label htmlFor={key}>
                        {property.title || key}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {property.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {property.description}
                        </p>
                    )}
                </div>
            );
        }

        // Default fallback
        return (
            <div key={key} className="space-y-2">
                <Label htmlFor={key}>
                    {property.title || key}
                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                    id={key}
                    type="text"
                    value={value || ""}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                />
                {property.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {property.description}
                    </p>
                )}
            </div>
        );
    };

    if (!selectedModel) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="text-4xl mb-4">🎨</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Select a Model
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Choose a model from the sidebar to get started
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading model configuration...</span>
                </div>
            </div>
        );
    }

    if (!schema) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Failed to Load Model
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Could not load configuration for {selectedModel.name}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {selectedModel.name}
                        </h3>
                        <Badge variant="secondary" className="mt-1">
                            {selectedModel.category}
                        </Badge>
                    </div>
                    <div className="flex gap-2">
                        {schema.documentationUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(schema.documentationUrl, "_blank")}
                            >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Docs
                            </Button>
                        )}
                        {schema.playgroundUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(schema.playgroundUrl, "_blank")}
                            >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Playground
                            </Button>
                        )}
                    </div>
                </div>

                {/* Status */}
                {status && (
                    <div className="mt-3 p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                            {status === "IN_QUEUE" && <Loader2 className="w-4 h-4 animate-spin" />}
                            {status === "IN_PROGRESS" && <Loader2 className="w-4 h-4 animate-spin" />}
                            {status === "COMPLETED" && <div className="w-4 h-4 bg-green-500 rounded-full" />}
                            {status === "FAILED" && <div className="w-4 h-4 bg-red-500 rounded-full" />}
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Status: {status}
                            </span>
                            {requestId && (
                                <span className="text-xs text-blue-700 dark:text-blue-300">
                                    ID: {requestId.slice(-8)}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Model Inputs</CardTitle>
                            <CardDescription>
                                Configure the parameters for {selectedModel.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(schema.inputSchema?.properties || {}).map(([key, property]) =>
                                renderInput(key, property)
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={submitting || !selectedModel}
                            className="min-w-[120px]"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Generate
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
