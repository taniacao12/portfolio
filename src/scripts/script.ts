export function format(files: Record<string, any>) {
    return Object.values(files).map((mod) => ({
        href: mod.url,
        title: mod.frontmatter.title,
        coverImage: mod.frontmatter.coverImage,
    }));
}

export function GetProjects() {
    return format(import.meta.glob("@projects/*.astro", { eager: true }));
}

export function GetPublications() {
    return format(import.meta.glob("@publications/*.astro", { eager: true }));
}

declare global {
    interface Window {
        filterMode: any;
        heroTransitionStart: boolean;
        heroIsTransitioning: boolean;
        startGalleryTransition: () => void;
        highlightCanvasNode: (src: string | null) => void;
        clearCanvasHighlight: () => void;
    }
}