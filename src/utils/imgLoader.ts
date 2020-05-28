export default async function(url: string) {
    const image = new Image();

    const p = new Promise<HTMLImageElement>((resolve, reject) => {
        image.onload = () => {
            return resolve(image);
        }
        image.onerror = () => {
            return reject(new Error('load error'));
        }
    })

    image.src = url;

    return p;
}