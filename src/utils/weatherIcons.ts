const icons = import.meta.glob('../assets/icons/*.png', {
    eager: true,
    query: '?url',
    import: 'default',
}) as Record<string, string>

export const getIconUrl = (file: string) => 
    icons[`../assets/icons/${file}`] ?? icons['../assets/icons/clear-day.png']
