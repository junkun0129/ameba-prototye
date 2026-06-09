import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AvatarEditorApp from '@/tools/avatar-editor/AvatarEditorApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AvatarEditorApp />
    </StrictMode>,
);