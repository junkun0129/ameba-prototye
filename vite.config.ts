import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const projectRoot = fileURLToPath(new URL('./', import.meta.url));
const avatarAssetRoot = path.join(projectRoot, 'public', 'avatar-editor-assets');
const overlayRoot = path.join(projectRoot, 'public', 'avatar-overlays');
const bodyBundleRoot = path.join(projectRoot, 'public', 'avatar-body-bundles');

function sanitizePathSegment(value: string) {
    return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function createAvatarAssetApiPlugin(): Plugin {
    const handleRequest = async (req: NodeJS.ReadableStream & { method?: string; url?: string }, res: NodeJS.WritableStream & { statusCode: number; setHeader: (name: string, value: string) => void; end: (chunk?: string) => void }, next: () => void) => {
        const requestUrl = req.url ?? '';
        const pathname = requestUrl ? new URL(requestUrl, 'http://localhost').pathname : '';
        if (!pathname.startsWith('/__avatar-editor/assets') && !pathname.startsWith('/__avatar-editor/overlays') && !pathname.startsWith('/__avatar-editor/body-bundles')) {
            next();
            return;
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        if (req.method === 'GET' && pathname === '/__avatar-editor/assets/list') {
            await mkdir(avatarAssetRoot, { recursive: true });
            const entries: Array<{ kind: string; partType: string; fileName: string; url: string }> = [];
            for (const kindEntry of await readdir(avatarAssetRoot, { withFileTypes: true })) {
                if (!kindEntry.isDirectory()) continue;
                const kindDir = path.join(avatarAssetRoot, kindEntry.name);
                for (const partEntry of await readdir(kindDir, { withFileTypes: true })) {
                    if (!partEntry.isDirectory()) continue;
                    const partDir = path.join(kindDir, partEntry.name);
                    for (const fileEntry of await readdir(partDir, { withFileTypes: true })) {
                        if (!fileEntry.isFile()) continue;
                        entries.push({
                            kind: kindEntry.name,
                            partType: partEntry.name,
                            fileName: fileEntry.name,
                            url: `/avatar-editor-assets/${kindEntry.name}/${partEntry.name}/${encodeURIComponent(fileEntry.name)}`,
                        });
                    }
                }
            }
            res.statusCode = 200;
            res.end(JSON.stringify({ entries }));
            return;
        }

        if (req.method === 'POST' && pathname === '/__avatar-editor/assets/upload') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }

            try {
                const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
                    kind?: string;
                    partType?: string;
                    fileName?: string;
                    dataUrl?: string;
                };

                if (!payload.kind || !payload.partType || !payload.fileName || !payload.dataUrl) {
                    throw new Error('Missing required upload fields');
                }

                const sanitizedKind = sanitizePathSegment(payload.kind);
                const sanitizedPartType = sanitizePathSegment(payload.partType);
                const sanitizedFileName = sanitizePathSegment(payload.fileName);
                const match = payload.dataUrl.match(/^data:(.+);base64,(.+)$/);
                if (!match) {
                    throw new Error('Invalid data URL');
                }

                const targetDir = path.join(avatarAssetRoot, sanitizedKind, sanitizedPartType);
                await mkdir(targetDir, { recursive: true });
                await writeFile(path.join(targetDir, sanitizedFileName), Buffer.from(match[2], 'base64'));

                res.statusCode = 200;
                res.end(
                    JSON.stringify({
                        fileName: sanitizedFileName,
                        url: `/avatar-editor-assets/${sanitizedKind}/${sanitizedPartType}/${encodeURIComponent(sanitizedFileName)}?v=${Date.now()}`,
                    }),
                );
                return;
            } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: String(error) }));
                return;
            }
        }

        if (req.method === 'GET' && pathname === '/__avatar-editor/overlays/list') {
            await mkdir(overlayRoot, { recursive: true });
            const entries: Array<{
                partType: string;
                name: string;
                slug: string;
                configUrl: string;
                thumbnailUrl: string;
                frontImageUrl?: string;
                backImageUrl?: string;
                updatedAt: string;
            }> = [];

            for (const partTypeEntry of await readdir(overlayRoot, { withFileTypes: true })) {
                if (!partTypeEntry.isDirectory()) continue;
                const partTypeDir = path.join(overlayRoot, partTypeEntry.name);
                for (const slugEntry of await readdir(partTypeDir, { withFileTypes: true })) {
                    if (!slugEntry.isDirectory()) continue;
                    const slugDir = path.join(partTypeDir, slugEntry.name);
                    const configPath = path.join(slugDir, 'config.json');
                    try {
                        const raw = await readFile(configPath, 'utf8');
                        const parsed = JSON.parse(raw) as {
                            name?: string;
                            front?: { imageUrl?: string };
                            back?: { imageUrl?: string };
                            updatedAt?: string;
                        };
                        const thumbnailUrl = parsed.front?.imageUrl || parsed.back?.imageUrl || '';
                        if (!thumbnailUrl) continue;
                        entries.push({
                            partType: partTypeEntry.name,
                            name: parsed.name || slugEntry.name,
                            slug: slugEntry.name,
                            configUrl: `/avatar-overlays/${partTypeEntry.name}/${slugEntry.name}/config.json`,
                            thumbnailUrl,
                            frontImageUrl: parsed.front?.imageUrl,
                            backImageUrl: parsed.back?.imageUrl,
                            updatedAt: parsed.updatedAt || new Date().toISOString(),
                        });
                    } catch {
                        // ignore broken config
                    }
                }
            }

            res.statusCode = 200;
            res.end(JSON.stringify({ entries }));
            return;
        }

        if (req.method === 'POST' && pathname === '/__avatar-editor/overlays/save') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }

            try {
                const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
                    partType?: string;
                    name?: string;
                    slug?: string;
                    front?: {
                        src?: string;
                        width?: number;
                        height?: number;
                        relativePosition?: { x: number; y: number };
                        zIndex?: number;
                        visible?: boolean;
                        selectedTarget?: { partType: string; boneName?: string };
                    };
                    back?: {
                        src?: string;
                        width?: number;
                        height?: number;
                        relativePosition?: { x: number; y: number };
                        zIndex?: number;
                        visible?: boolean;
                        selectedTarget?: { partType: string; boneName?: string };
                    };
                };

                if (!payload.partType || !payload.name || !payload.slug) {
                    throw new Error('Missing required overlay fields');
                }

                const partType = sanitizePathSegment(payload.partType);
                const slug = sanitizePathSegment(payload.slug);
                const targetDir = path.join(overlayRoot, partType, slug);
                await mkdir(targetDir, { recursive: true });
                const configPath = path.join(targetDir, 'config.json');

                let existingConfig: {
                    front?: {
                        imageUrl?: string;
                        width?: number;
                        height?: number;
                        relativePosition?: { x: number; y: number };
                        zIndex?: number;
                        visible?: boolean;
                        selectedTarget?: { partType: string; boneName?: string };
                    };
                    back?: {
                        imageUrl?: string;
                        width?: number;
                        height?: number;
                        relativePosition?: { x: number; y: number };
                        zIndex?: number;
                        visible?: boolean;
                        selectedTarget?: { partType: string; boneName?: string };
                    };
                } = {};
                try {
                    const rawExisting = await readFile(configPath, 'utf8');
                    existingConfig = JSON.parse(rawExisting) as typeof existingConfig;
                } catch {
                    // first save or broken file; continue with fresh config
                }

                const saveFacing = async (facing: 'front' | 'back', part?: {
                    src?: string;
                    width?: number;
                    height?: number;
                    relativePosition?: { x: number; y: number };
                    zIndex?: number;
                    visible?: boolean;
                    selectedTarget?: { partType: string; boneName?: string };
                }) => {
                    if (!part?.src || !part.src.startsWith('data:')) return undefined;
                    const match = part.src.match(/^data:(.+);base64,(.+)$/);
                    if (!match) return undefined;
                    const ext = match[1].includes('png') ? 'png' : match[1].includes('webp') ? 'webp' : 'jpg';
                    const fileName = `${facing}.${ext}`;
                    await writeFile(path.join(targetDir, fileName), Buffer.from(match[2], 'base64'));
                    return {
                        imageUrl: `/avatar-overlays/${partType}/${slug}/${fileName}`,
                        width: Math.max(1, Math.round(part.width || 1)),
                        height: Math.max(1, Math.round(part.height || 1)),
                        relativePosition: part.relativePosition || { x: 0, y: 0 },
                        zIndex: Math.round(part.zIndex || 0),
                        visible: part.visible !== false,
                        selectedTarget: part.selectedTarget || { partType: 'head' },
                    };
                };

                const frontSaved = await saveFacing('front', payload.front);
                const backSaved = await saveFacing('back', payload.back);

                const front = frontSaved ?? {
                    imageUrl: existingConfig.front?.imageUrl,
                    width: Math.max(1, Math.round(payload.front?.width ?? existingConfig.front?.width ?? 1)),
                    height: Math.max(1, Math.round(payload.front?.height ?? existingConfig.front?.height ?? 1)),
                    relativePosition: payload.front?.relativePosition ?? existingConfig.front?.relativePosition,
                    zIndex: Math.round(payload.front?.zIndex ?? existingConfig.front?.zIndex ?? 0),
                    visible: payload.front?.visible ?? existingConfig.front?.visible,
                    selectedTarget: payload.front?.selectedTarget ?? existingConfig.front?.selectedTarget,
                };

                const back = backSaved ?? {
                    imageUrl: existingConfig.back?.imageUrl,
                    width: Math.max(1, Math.round(payload.back?.width ?? existingConfig.back?.width ?? 1)),
                    height: Math.max(1, Math.round(payload.back?.height ?? existingConfig.back?.height ?? 1)),
                    relativePosition: payload.back?.relativePosition ?? existingConfig.back?.relativePosition,
                    zIndex: Math.round(payload.back?.zIndex ?? existingConfig.back?.zIndex ?? 0),
                    visible: payload.back?.visible ?? existingConfig.back?.visible,
                    selectedTarget: payload.back?.selectedTarget ?? existingConfig.back?.selectedTarget,
                };

                const normalizedFront = front.imageUrl ? front : undefined;
                const normalizedBack = back.imageUrl ? back : undefined;

                const config = {
                    version: 1,
                    partType,
                    name: payload.name,
                    slug,
                    front: normalizedFront,
                    back: normalizedBack,
                    thumbnailFacing: normalizedFront ? 'front' : 'back',
                    updatedAt: new Date().toISOString(),
                };

                await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');

                res.statusCode = 200;
                res.end(JSON.stringify({ ok: true, config }));
                return;
            } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: String(error) }));
                return;
            }
        }

        if (req.method === 'GET' && pathname === '/__avatar-editor/body-bundles/list') {
            await mkdir(bodyBundleRoot, { recursive: true });
            const entries: Array<{
                name: string;
                slug: string;
                bundleUrl: string;
                updatedAt: string;
            }> = [];

            for (const fileEntry of await readdir(bodyBundleRoot, { withFileTypes: true })) {
                if (!fileEntry.isFile() || !fileEntry.name.endsWith('.json') || fileEntry.name === 'default.json') continue;
                const filePath = path.join(bodyBundleRoot, fileEntry.name);
                try {
                    const raw = await readFile(filePath, 'utf8');
                    const parsed = JSON.parse(raw) as { name?: string; slug?: string; updatedAt?: string };
                    const slug = parsed.slug || fileEntry.name.replace(/\.json$/, '');
                    entries.push({
                        name: parsed.name || slug,
                        slug,
                        bundleUrl: `/avatar-body-bundles/${encodeURIComponent(fileEntry.name)}`,
                        updatedAt: parsed.updatedAt || new Date().toISOString(),
                    });
                } catch {
                    // ignore broken config
                }
            }

            entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

            let defaultSlug: string | null = null;
            try {
                const rawDefault = await readFile(path.join(bodyBundleRoot, 'default.json'), 'utf8');
                const parsedDefault = JSON.parse(rawDefault) as { slug?: string };
                defaultSlug = parsedDefault.slug || null;
            } catch {
                // no default
            }

            res.statusCode = 200;
            res.end(JSON.stringify({ entries, defaultSlug }));
            return;
        }

        if (req.method === 'POST' && pathname === '/__avatar-editor/body-bundles/save') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }

            try {
                const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
                    name?: string;
                    slug?: string;
                    rig?: unknown;
                    setAsDefault?: boolean;
                };

                if (!payload.name || !payload.slug || !payload.rig) {
                    throw new Error('Missing required body bundle fields');
                }

                await mkdir(bodyBundleRoot, { recursive: true });
                const slug = sanitizePathSegment(payload.slug);
                const fileName = `${slug}.json`;
                const filePath = path.join(bodyBundleRoot, fileName);
                const now = new Date().toISOString();
                const config = {
                    version: 1,
                    name: payload.name,
                    slug,
                    rig: payload.rig,
                    updatedAt: now,
                };
                await writeFile(filePath, JSON.stringify(config, null, 2), 'utf8');

                let defaultSlug: string | null = null;
                if (payload.setAsDefault) {
                    defaultSlug = slug;
                    await writeFile(path.join(bodyBundleRoot, 'default.json'), JSON.stringify({ slug, updatedAt: now }, null, 2), 'utf8');
                } else {
                    try {
                        const rawDefault = await readFile(path.join(bodyBundleRoot, 'default.json'), 'utf8');
                        const parsedDefault = JSON.parse(rawDefault) as { slug?: string };
                        defaultSlug = parsedDefault.slug || null;
                    } catch {
                        defaultSlug = null;
                    }
                }

                res.statusCode = 200;
                res.end(
                    JSON.stringify({
                        ok: true,
                        entry: {
                            name: payload.name,
                            slug,
                            bundleUrl: `/avatar-body-bundles/${encodeURIComponent(fileName)}`,
                            updatedAt: now,
                        },
                        defaultSlug,
                    }),
                );
                return;
            } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: String(error) }));
                return;
            }
        }

        if (req.method === 'POST' && pathname === '/__avatar-editor/body-bundles/default') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }

            try {
                const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { slug?: string };
                if (!payload.slug) {
                    throw new Error('Missing slug');
                }
                await mkdir(bodyBundleRoot, { recursive: true });
                const slug = sanitizePathSegment(payload.slug);
                const filePath = path.join(bodyBundleRoot, `${slug}.json`);
                await readFile(filePath, 'utf8');
                await writeFile(path.join(bodyBundleRoot, 'default.json'), JSON.stringify({ slug, updatedAt: new Date().toISOString() }, null, 2), 'utf8');

                res.statusCode = 200;
                res.end(JSON.stringify({ ok: true, defaultSlug: slug }));
                return;
            } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: String(error) }));
                return;
            }
        }

        next();
    };

    return {
        name: 'avatar-editor-assets-api',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                void handleRequest(req, res, next);
            });
        },
        configurePreviewServer(server) {
            server.middlewares.use((req, res, next) => {
                void handleRequest(req, res, next);
            });
        },
    };
}

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: fileURLToPath(new URL('./index.html', import.meta.url)),
                avatarEditor: fileURLToPath(new URL('./avatar-editor.html', import.meta.url)),
            },
        },
    },
    plugins: [react(), tailwindcss(), createAvatarAssetApiPlugin()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        host: true,
        port: 5175,
    },
});
