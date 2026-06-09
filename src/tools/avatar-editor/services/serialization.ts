export async function saveFileToDirectory(directoryHandle: FileSystemDirectoryHandle, file: File) {
    const fileHandle = await directoryHandle.getFileHandle(file.name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(await file.arrayBuffer());
    await writable.close();
}

export async function saveTextFile(suggestedName: string, content: string) {
    const pickerWindow = window as Window & {
        showSaveFilePicker?: (options: {
            suggestedName?: string;
            types?: Array<{ description: string; accept: Record<string, string[]> }>;
        }) => Promise<FileSystemFileHandle>;
    };

    if (pickerWindow.showSaveFilePicker) {
        const handle = await pickerWindow.showSaveFilePicker({
            suggestedName,
            types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return 'saved';
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = suggestedName;
    anchor.click();
    URL.revokeObjectURL(url);
    return 'downloaded';
}

export function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

export function readImageSizeFromDataUrl(src: string) {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            resolve({
                width: Math.max(1, Math.round(image.naturalWidth || image.width || 1)),
                height: Math.max(1, Math.round(image.naturalHeight || image.height || 1)),
            });
        };
        image.onerror = error => reject(error);
        image.src = src;
    });
}

export async function loadJsonFile<T>(file: File): Promise<T> {
    return JSON.parse(await file.text()) as T;
}
