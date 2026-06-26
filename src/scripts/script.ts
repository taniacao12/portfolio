function format(files: Record<string, any>, type: string) {
    return Object.values(files).map((mod) => ({
        order: mod.frontmatter.order,
        type: type,
        href: mod.url,
        title: mod.frontmatter.title,
        coverImage: mod.frontmatter.coverImage,
    }));
}

export function getWorks() {
    const projects = format(import.meta.glob("@projects/*.astro", { eager: true }), "project");
    const publications = format(import.meta.glob("@publications/*.astro", { eager: true }), "publication");
    const works = [...projects, ...publications].sort((a, b) => a.order - b.order)
    return works;
}