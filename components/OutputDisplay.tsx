"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Clock, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

interface Output {
    model: string;
    requestId: string;
    result: any;
    timestamp: string;
}

interface OutputDisplayProps {
    outputs: Output[];
}

export function OutputDisplay({ outputs }: OutputDisplayProps) {
    const [selectedOutput, setSelectedOutput] = useState<Output | null>(null);

    const renderMedia = (result: any) => {
        const mediaElements: JSX.Element[] = [];

        // Handle images
        if (result.images && Array.isArray(result.images)) {
            result.images.forEach((image: any, index: number) => {
                if (image.url || image.stored_url) {
                    mediaElements.push(
                        <div key={`image-${index}`} className="flex flex-col group">
                            <Image
                                src={image.stored_url || image.url}
                                alt={`Generated image ${index + 1}`}
                                width={300}
                                height={300}
                                className="w-full h-48 object-cover rounded-lg"
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    // Fallback to original URL if stored URL fails
                                    if (image.stored_url && image.url && e.currentTarget.src !== image.url) {
                                        e.currentTarget.src = image.url;
                                    }
                                }}
                            />
                            <div className="flex flex-col inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg  items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => window.open(image.stored_url || image.url, "_blank")}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                            const link = document.createElement("a");
                                            link.href = image.stored_url || image.url;
                                            link.download = `generated-image-${index + 1}.jpg`;
                                            link.click();
                                        }}
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                }
            });
        }

        // Handle single image
        if (result.image && !result.images) {
            const image = result.image;
            if (image.url || image.stored_url) {
                mediaElements.push(
                    <div key="single-image" className="relative group">
                        <Image
                            src={image.stored_url || image.url}
                            alt="Generated image"
                            width={400}
                            height={400}
                            className="w-full h-64 object-cover rounded-lg"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                if (image.stored_url && image.url && e.currentTarget.src !== image.url) {
                                    e.currentTarget.src = image.url;
                                }
                            }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => window.open(image.stored_url || image.url, "_blank")}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                        const link = document.createElement("a");
                                        link.href = image.stored_url || image.url;
                                        link.download = "generated-image.jpg";
                                        link.click();
                                    }}
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            }
        }

        // Handle video
        if (result.video) {
            const video = result.video;
            if (video.url || video.stored_url) {
                mediaElements.push(
                    <div key="video" className="relative">
                        <video
                            src={video.stored_url || video.url}
                            controls
                            className="w-full h-64 rounded-lg"
                            onError={(e: React.SyntheticEvent<HTMLVideoElement>) => {
                                if (video.stored_url && video.url && e.currentTarget.src !== video.url) {
                                    e.currentTarget.src = video.url;
                                }
                            }}
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => window.open(video.stored_url || video.url, "_blank")}
                            >
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = video.stored_url || video.url;
                                    link.download = "generated-video.mp4";
                                    link.click();
                                }}
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                );
            }
        }

        // Handle audio
        if (result.audio) {
            const audio = result.audio;
            if (audio.url || audio.stored_url) {
                mediaElements.push(
                    <div key="audio" className="p-4 bg-muted rounded-lg">
                        <audio
                            src={audio.stored_url || audio.url}
                            controls
                            className="w-full"
                            onError={(e: React.SyntheticEvent<HTMLAudioElement>) => {
                                if (audio.stored_url && audio.url && e.currentTarget.src !== audio.url) {
                                    e.currentTarget.src = audio.url;
                                }
                            }}
                        />
                        <div className="flex gap-2 mt-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(audio.stored_url || audio.url, "_blank")}
                            >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Open
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = audio.stored_url || audio.url;
                                    link.download = "generated-audio.wav";
                                    link.click();
                                }}
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                            </Button>
                        </div>
                    </div>
                );
            }
        }

        // Handle arrays of videos/audios
        if (result.videos && Array.isArray(result.videos)) {
            result.videos.forEach((video: any, index: number) => {
                if (video.url || video.stored_url) {
                    mediaElements.push(
                        <div key={`video-${index}`} className="relative">
                            <video
                                src={video.stored_url || video.url}
                                controls
                                className="w-full h-48 rounded-lg"
                                onError={(e: React.SyntheticEvent<HTMLVideoElement>) => {
                                    if (video.stored_url && video.url && e.currentTarget.src !== video.url) {
                                        e.currentTarget.src = video.url;
                                    }
                                }}
                            />
                            <div className="absolute top-2 right-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => window.open(video.stored_url || video.url, "_blank")}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    );
                }
            });
        }

        if (result.audios && Array.isArray(result.audios)) {
            result.audios.forEach((audio: any, index: number) => {
                if (audio.url || audio.stored_url) {
                    mediaElements.push(
                        <div key={`audio-${index}`} className="p-3 bg-muted rounded-lg">
                            <audio
                                src={audio.stored_url || audio.url}
                                controls
                                className="w-full"
                                onError={(e: React.SyntheticEvent<HTMLAudioElement>) => {
                                    if (audio.stored_url && audio.url && e.currentTarget.src !== audio.url) {
                                        e.currentTarget.src = audio.url;
                                    }
                                }}
                            />
                        </div>
                    );
                }
            });
        }

        return mediaElements;
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    if (outputs.length === 0) {
        return (
            <div className="flex items-center justify-center h-full time-counter">
                <div className="text-center">
                    <div className="text-4xl mb-4 font-mono w-12 mx-auto"><svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M5 3H3v18h18V3H5zm14 2v14H5V5h14zm-8 4H9V7H7v2h2v2h2v2H9v2H7v2h2v-2h2v-2h2v2h2v2h2v-2h-2v-2h-2v-2h2V9h2V7h-2v2h-2v2h-2V9z" fill="currentColor" /> </svg></div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                        No Outputs Yet
                    </h3>
                    <p className="text-muted-foreground">
                        Generated content will appear here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border bg-card">
                <h2 className="text-lg font-semibold text-foreground">
                    Generated Outputs
                </h2>
                <p className="text-sm text-muted-foreground">
                    {outputs.length} generation{outputs.length !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Outputs Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {outputs.map((output, index) => (
                        <Card
                            key={`${output.requestId}-${index}`}
                            className={`cursor-pointer transition-all hover:shadow-md ${selectedOutput?.requestId === output.requestId
                                ? "ring-2 ring-accent"
                                : ""
                                }`}
                            onClick={() => setSelectedOutput(selectedOutput?.requestId === output.requestId ? null : output)}
                        >
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    {/* Model and timestamp */}
                                    <div className="flex items-center justify-between">
                                        <Badge variant="default" className="text-xs">
                                            {output.model.split("/").pop()}
                                        </Badge>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {formatTimestamp(output.timestamp)}
                                        </div>
                                    </div>

                                    {/* Media preview */}
                                    <div className="space-y-2">
                                        {renderMedia(output.result).slice(0, 1)} {/* Show first media item */}
                                        {renderMedia(output.result).length > 1 && (
                                            <div className="text-xs text-muted-foreground text-center">
                                                +{renderMedia(output.result).length - 1} more
                                            </div>
                                        )}
                                    </div>

                                    {/* Request ID */}
                                    <div className="text-xs text-muted-foreground font-mono">
                                        {output.requestId.slice(-8)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Expanded view */}
            {selectedOutput && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-4 border-b border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-foreground">
                                        {selectedOutput.model}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Generated {formatTimestamp(selectedOutput.timestamp)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedOutput(null)}
                                >
                                    ✕
                                </Button>
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderMedia(selectedOutput.result)}
                            </div>

                            {/* Raw result data */}
                            <details className="mt-4">
                                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                                    Raw Result Data
                                </summary>
                                <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
                                    {JSON.stringify(selectedOutput.result, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
