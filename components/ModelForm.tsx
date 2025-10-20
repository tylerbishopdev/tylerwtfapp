"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ExternalLink, Trash2, Upload } from "lucide-react";
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
    items?: {
        type?: string;
    };
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
    const [uploading, setUploading] = useState(false);
    const [loraOptions, setLoraOptions] = useState<LoraOption[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);

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

    const handleFileChange = (key: string, file: File | null) => {
        setFormData((prev) => ({
            ...prev,
            [key]: file,
        }));
    };

    const handleLoraSelection = (loraName: string) => {
        const selectedLora = loraOptions.find(option => option.name === loraName);
        if (selectedLora) {
            const currentLoras = formData.loras || [];
            // Add the selected Lora with default scale of 1
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
        setUploading(false);

        try {
            const processedFormData = { ...formData };

            // Handle single file uploads
            const fileFields = Object.keys(processedFormData).filter(key => processedFormData[key] instanceof File);

            // Handle array file uploads (keys ending with _files)
            const arrayFileFields = Object.keys(processedFormData).filter(key =>
                key.endsWith('_files') && Array.isArray(processedFormData[key]) && processedFormData[key].length > 0
            );

            if (fileFields.length > 0 || arrayFileFields.length > 0) {
                setUploading(true);

                // Upload single files
                await Promise.all(fileFields.map(async (key) => {
                    const file = processedFormData[key] as File;
                    const uploadFormData = new FormData();
                    uploadFormData.append("file", file);

                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: uploadFormData,
                    });

                    const result = await response.json();

                    if (result.success) {
                        processedFormData[key] = result.url;
                    } else {
                        throw new Error(`Failed to upload ${file.name}`);
                    }
                }));

                // Upload array files
                for (const fileFieldKey of arrayFileFields) {
                    const files = processedFormData[fileFieldKey] as File[];
                    const actualFieldKey = fileFieldKey.replace('_files', '');
                    const uploadedUrls = [];

                    for (const file of files) {
                        const uploadFormData = new FormData();
                        uploadFormData.append("file", file);

                        const response = await fetch('/api/upload', {
                            method: 'POST',
                            body: uploadFormData,
                        });

                        const result = await response.json();

                        if (result.success) {
                            uploadedUrls.push(result.url);
                        } else {
                            throw new Error(`Failed to upload ${file.name}`);
                        }
                    }

                    // Merge uploaded URLs with existing URLs
                    const existingUrls = processedFormData[actualFieldKey] || [];
                    processedFormData[actualFieldKey] = [...existingUrls, ...uploadedUrls];

                    // Remove the temporary _files field
                    delete processedFormData[fileFieldKey];
                }

                setUploading(false);
            }

            const encodedModel = encodeURIComponent(selectedModel.name);
            const response = await fetch(`/api/submit/${encodedModel}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(processedFormData),
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
            setUploading(false);
        }
    };

    const properties = schema?.inputSchema?.properties || {};
    const requiredFields = schema?.inputSchema?.required || [];

    const requiredProperties = Object.entries(properties).filter(([key]) =>
        requiredFields.includes(key)
    );
    const optionalProperties = Object.entries(properties).filter(
        ([key]) => !requiredFields.includes(key)
    );


    const renderLoraInput = (key: string, property: SchemaProperty) => {
        const isRequired = schema?.inputSchema?.required?.includes(key) || false;
        const currentLoras = formData.loras || [];

        return (
            <div key={key} className="space-y-4">
                <Label htmlFor={key}>
                    {property.title || key}
                    {isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>

                {/* Lora Selection Dropdown */}
                <div className="space-y-1">
                    <Label className="text-xs font-medium">Select LoRA:</Label>
                    <Select onValueChange={handleLoraSelection}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose a LoRA model..." />
                        </SelectTrigger>
                        <SelectContent>
                            {loraOptions.map((option) => (
                                <SelectItem key={option.name} value={option.name}>
                                    <div className="flex flex-col">
                                        <span>{option.name}</span>
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

                {/* Selected LoRAs */}
                {currentLoras.length > 0 && (
                    <div className="space-y-1">
                        <Label className="text-xs font-medium">Selected LoRAs:</Label>
                        <div className="space-y-1">
                            {currentLoras.map((lora: any, index: number) => (
                                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
                                    <div className="flex-1">
                                        <div className="font-medium text-xs">
                                            {loraOptions.find(opt => opt.url === lora.path)?.name || 'Unknown LoRA'}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {lora.path}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <Label className="text-xs">Scale:</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="4"
                                                step="0.1"
                                                value={lora.scale}
                                                onChange={(e) => updateLoraScale(index, parseFloat(e.target.value) || 1)}
                                                className="w-16 h-8 text-xs"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeLora(index)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {property.description && (
                    <p className="text-xs text-foreground ">
                        {property.description}
                    </p>
                )}
            </div>
        );
    };

    const renderFileInput = (key: string, property: SchemaProperty) => {
        const isRequired = schema?.inputSchema?.required?.includes(key) || false;
        const isArray = property.type === 'array';

        // Handle array fields differently
        if (isArray) {
            const currentUrls = formData[key] || [];
            const pendingFiles = formData[`${key}_files`] || [];

            return (
                <div key={key} className="space-y-1">
                    <Label htmlFor={key}>
                        {property.title || key}
                        {isRequired && <span className="text-destructive ml-1">*</span>}
                    </Label>

                    {/* Input for adding new URLs */}
                    <div className="relative">
                        <Input
                            id={key}
                            type="text"
                            placeholder="Enter URL or click to upload"
                            className="pr-24"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    if (input.value.trim()) {
                                        handleInputChange(key, [...currentUrls, input.value.trim()]);
                                        input.value = '';
                                    }
                                }
                            }}
                        />
                        <div className="absolute right-1 top-1 bottom-1">
                            <Button
                                asChild
                                variant="file"
                                size="sm"
                                className="h-full px-6"
                            >
                                <label htmlFor={`${key}-file-upload`} className="cursor-pointer">
                                    <Upload className="w-4 h-4" />
                                    <input
                                        id={`${key}-file-upload`}
                                        type="file"
                                        accept="image/*,video/*,audio/*"
                                        multiple={isArray}
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            if (files.length > 0) {
                                                // Store files temporarily
                                                handleInputChange(`${key}_files`, [...pendingFiles, ...files]);
                                            }
                                        }}
                                        className="sr-only"
                                    />
                                </label>
                            </Button>
                        </div>
                    </div>

                    {/* Display current URLs and pending files */}
                    {(currentUrls.length > 0 || pendingFiles.length > 0) && (
                        <div className="space-y-1">
                            {currentUrls.map((url: string, index: number) => (
                                <div key={`url-${index}`} className="text-xs text-muted-foreground flex items-center justify-between bg-muted/50 p-2 rounded">
                                    <span className="truncate">{url}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const newUrls = currentUrls.filter((_: string, i: number) => i !== index);
                                            handleInputChange(key, newUrls);
                                        }}
                                        className="h-6 w-6 p-0"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                            {pendingFiles.map((file: File, index: number) => (
                                <div key={`file-${index}`} className="text-xs text-muted-foreground flex items-center justify-between bg-accent/10 p-2 rounded">
                                    <span className="flex items-center gap-1">
                                        <Upload className="w-3 h-3" />
                                        {file.name} (pending upload)
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const newFiles = pendingFiles.filter((_: File, i: number) => i !== index);
                                            handleInputChange(`${key}_files`, newFiles);
                                        }}
                                        className="h-6 w-6 p-0"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {property.description && (
                        <p className="text-xs text-foreground ">
                            {property.description}
                        </p>
                    )}
                </div>
            );
        }

        // Handle single string fields
        const file = formData[key] as File | undefined;
        const currentValue = typeof formData[key] === 'string' ? formData[key] : '';

        return (
            <div key={key} className="space-y-1">
                <Label htmlFor={key}>
                    {property.title || key}
                    {isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>
                <div className="relative">
                    <Input
                        id={key}
                        type="text"
                        value={currentValue}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder="Enter URL or click to upload"
                        className="pr-24"
                    />
                    <div className="absolute right-1 top-1 bottom-1">
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-full px-3 hover:bg-accent/20"
                        >
                            <label htmlFor={`${key}-file-upload`} className="cursor-pointer">
                                <Upload className="w-4 h-4" />
                                <input
                                    id={`${key}-file-upload`}
                                    type="file"
                                    accept="image/*,video/*,audio/*"
                                    onChange={(e) => {
                                        const selectedFile = e.target.files?.[0];
                                        if (selectedFile) {
                                            handleFileChange(key, selectedFile);
                                            // Clear the text input when a file is selected
                                            handleInputChange(key, '');
                                        }
                                    }}
                                    className="sr-only"
                                />
                            </label>
                        </Button>
                    </div>
                </div>
                {file && (
                    <div className="text-xs text-muted-foreground flex items-center justify-between bg-muted/50 p-2 rounded">
                        <span className="flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            {file.name}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileChange(key, null)}
                            className="h-6 w-6 p-0"
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                )}
                {property.description && (
                    <p className="text-xs text-foreground ">
                        {property.description}
                    </p>
                )}
            </div>
        )
    }

    const renderInput = (key: string, property: SchemaProperty) => {
        const isRequired = schema?.inputSchema?.required?.includes(key) || false;
        const value = formData[key];

        // Handle Lora fields specially
        if (key === 'loras') {
            return renderLoraInput(key, property);
        }

        // More intelligent detection of media input fields
        // Check both string fields and array fields that contain URLs
        const isStringOrArrayOfStrings = property.type === 'string' ||
            (property.type === 'array' && property.items?.type === 'string');

        if (isStringOrArrayOfStrings) {
            const keyLower = key.toLowerCase();
            const descLower = property.description?.toLowerCase() || '';
            const titleLower = property.title?.toLowerCase() || '';

            // Check if this is a media/file input field
            const isMediaField =
                // Check field names with underscores
                keyLower.includes('image_url') ||
                keyLower.includes('video_url') ||
                keyLower.includes('audio_url') ||
                keyLower.includes('file_url') ||
                keyLower.includes('mask_url') ||
                // Check field names without underscores
                keyLower.includes('imageurl') ||
                keyLower.includes('videourl') ||
                keyLower.includes('audiourl') ||
                keyLower.includes('fileurl') ||
                // Check generic patterns
                (keyLower.includes('url') && (keyLower.includes('image') || keyLower.includes('video') || keyLower.includes('audio') || keyLower.includes('mask'))) ||
                keyLower === 'image' ||
                keyLower === 'video' ||
                keyLower === 'audio' ||
                keyLower === 'file' ||
                // Check description content
                descLower.includes('url of') ||
                descLower.includes('image url') ||
                descLower.includes('video url') ||
                descLower.includes('audio url') ||
                descLower.includes('file url') ||
                descLower.includes('upload') ||
                descLower.includes('image') && descLower.includes('jpeg') ||
                descLower.includes('png') ||
                descLower.includes('webp') ||
                // Check title content
                titleLower.includes('image') && titleLower.includes('url') ||
                titleLower.includes('video') && titleLower.includes('url') ||
                titleLower.includes('audio') && titleLower.includes('url') ||
                titleLower.includes('file') && titleLower.includes('url') ||
                titleLower.includes('mask') && titleLower.includes('url');

            if (isMediaField) {
                return renderFileInput(key, property);
            }
        }

        // Handle different input types
        if (property.enum) {
            return (
                <div key={key} className="space-y-1">
                    <Label htmlFor={key}>
                        {property.title || key}
                        {isRequired && <span className="text-destructive ml-1">*</span>}
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
                        <p className="text-xs text-foreground ">
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
                    <div key={key} className="space-y-1">
                        <Label htmlFor={key}>
                            {property.title || key}
                            {isRequired && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Textarea
                            id={key}
                            value={value || ""}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            placeholder={property.examples?.[0] || ""}
                            rows={4}
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
                <div key={key} className="space-y-1">
                    <Label htmlFor={key}>
                        {property.title || key}
                        {isRequired && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                        id={key}
                        type="text"
                        value={value || ""}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder={property.examples?.[0] || ""}
                    />
                    {property.description && (
                        <p className="text-xs text-foreground ">
                            {property.description}
                        </p>
                    )}
                </div>
            );
        }

        if (property.type === "number" || property.type === "integer") {
            return (
                <div key={key} className="space-y-1">
                    <Label htmlFor={key}>
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
                    />
                    {property.description && (
                        <p className="text-xs text-foreground ">
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
                <div key={key} className="flex items-center space-x-2 text-accent">
                    <input
                        id={key}
                        type="checkbox"
                        checked={value || false}
                        onChange={(e) => handleInputChange(key, e.target.checked)}
                        className="border-accent border bg-accent/30 text-accent"
                    />
                    <Label htmlFor={key}>
                        {property.title || key}
                        {isRequired && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {property.description && (
                        <p className="text-xs text-foreground ">
                            {property.description}
                        </p>
                    )}
                </div>
            );
        }

        // Default fallback
        return (
            <div key={key} className="space-y-1">
                <Label htmlFor={key}>
                    {property.title || key}
                    {isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                    id={key}
                    type="text"
                    value={value || ""}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                />
                {property.description && (
                    <p className="text-xs text-foreground ">
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
                    <div className="text-4xl mb-4 w-12 mx-auto"><svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M19 4h2v2h-2V4zm-2 4V6h2v2h-2zm-2 0h2v2h-2V8zm0 0h-2V6h2v2zM3 6h8v2H3V6zm8 10H3v2h8v-2zm7 2v-2h2v-2h-2v2h-2v-2h-2v2h2v2h-2v2h2v-2h2zm0 0v2h2v-2h-2z" fill="currentColor" className="w-1/12" /> </svg></div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                        Select a Model
                    </h3>
                    <p className="text-muted-foreground">
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
                    <div className="text-destructive text-4xl mb-4">⚠️</div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                        Failed to Load Model
                    </h3>
                    <p className="text-muted-foreground">
                        Could not load configuration for {selectedModel.name}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col mt-2 ml-2 ">
            {/* Header */}
            <div className="p-0 border-b-2 border-border">
                <div className="flex items-center w-full justify-start gap-8">
                    <div>
                        <h3 className=" font-semibold font-mono time-counter rounded-t-2xl border p-3 w-max-[500px] w-[500px] mx-auto text-center  text-foreground">
                            {selectedModel.name}
                        </h3>
                        <div className=" text-center font-mono uppercase border px-1 text-xs bg-primary/20 text-secondary p-0.5">
                            {selectedModel.category}
                        </div>
                    </div>
                    <div className="flex gap-2 mr-4">
                        {schema.documentationUrl && (
                            <button

                                className="group relative inline-flex h-8 opacity-70 items-center text-xs justify-center overflow-hidden rounded-md px-2 font-medium text-foreground bg-background hover:bg-background transition-all hover:opacity-100 active:translate-y-[2px] active:shadow-none"
                                onClick={() => window.open(schema.documentationUrl, "_blank")}
                            >
                                <ExternalLink className="pr-2" />
                                Model Docs
                            </button>
                        )}

                    </div>
                </div>

                {/* Status */}
                {/* The status display is removed as per the edit hint */}
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto pt-2 pb-12">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <Card className="bg-gradient-to-br from-zinc-950 to-zinc-800/90  border-r-4 border-b-6 border-l-2">
                        <CardHeader>
                            <CardTitle className="text-base font-mono text-primary">Model Inputs</CardTitle>
                            <CardDescription>
                                <span className="text-xs font-mono text-muted-foreground">Configure the parameters for {selectedModel.name}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {requiredProperties.map(([key, property]) =>
                                renderInput(key, property as SchemaProperty)
                            )}
                            {showAdvanced && optionalProperties.map(([key, property]) =>
                                renderInput(key, property as SchemaProperty)
                            )}
                        </CardContent>
                        {optionalProperties.length > 0 && (
                            <CardFooter>
                                <Button
                                    type="button"
                                    variant="link"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                >
                                    {showAdvanced ? "Hide advanced options" : "Show advanced options"}
                                </Button>
                            </CardFooter>
                        )}
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={submitting || !selectedModel}
                            className=""
                            size="sm"
                        >


                            {submitting ? (
                                <div className="flex items-center gap-2 time-counter">
                                    <span className=" flex-inline">  <Loader2 className="w-4 h-5 mr-2 animate-spin" /></span>
                                    Fingers crossed, no promises...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">


                                    Generate

                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </div >
        </div >
    );
}
