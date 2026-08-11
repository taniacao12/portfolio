function format(files: Record<string, any>, type: string) {
    return Object.values(files).map((mod) => {
        const rawDate = mod.frontmatter.date;
        const date = new Date(rawDate.replace(/\./g, "-"));

        return {
            date: date,
            type: type,
            href: mod.url,
            title: mod.frontmatter.title,
            coverImage: mod.frontmatter.coverImage,
        }
    });
}

export function getWorks() {
    const projects = format(import.meta.glob("@projects/*.astro", { eager: true }), "project");
    const publications = format(import.meta.glob("@publications/*.astro", { eager: true }), "publication");
    return [...projects, ...publications].sort((a, b) => b.date.getTime() - a.date.getTime());
}