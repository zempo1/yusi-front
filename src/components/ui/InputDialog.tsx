import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { X } from "lucide-react";

interface InputDialogProps {
    isOpen: boolean;
    title: string;
    description?: string;
    placeholder?: string;
    defaultValue?: string;
    inputType?: "text" | "textarea";
    confirmText?: string;
    cancelText?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

export const InputDialog = ({
    isOpen,
    title,
    description,
    placeholder = "",
    defaultValue = "",
    inputType = "text",
    confirmText = "确认",
    cancelText = "取消",
    onConfirm,
    onCancel,
}: InputDialogProps) => {
    const [value, setValue] = useState(defaultValue);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(value);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {description && (
                    <p className="text-sm text-muted-foreground mb-4">{description}</p>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        {inputType === "textarea" ? (
                            <Textarea
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={placeholder}
                                className="min-h-[100px]"
                                autoFocus
                            />
                        ) : (
                            <Input
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={placeholder}
                                autoFocus
                            />
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onCancel}>
                            {cancelText}
                        </Button>
                        <Button type="submit">
                            {confirmText}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
