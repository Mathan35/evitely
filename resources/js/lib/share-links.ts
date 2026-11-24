export type ShareChannelLinks = {
    whatsapp: string;
    telegram: string;
    facebook: string;
    email: string;
    sms?: string;
};

/** Build share channel URLs from a message + invite URL (mirrors ShareMessageFactory). */
export function buildShareLinks(message: string, url: string): ShareChannelLinks {
    const text = message.trim() || url;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);

    return {
        whatsapp: `https://wa.me/?text=${encodedText}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        email: `mailto:?subject=${encodeURIComponent('You are invited')}&body=${encodedText}`,
        sms: `sms:?&body=${encodedText}`,
    };
}
