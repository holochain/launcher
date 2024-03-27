export const base64ToArrayBuffer = (base64: string) => {
	const binaryString = window.atob(base64);
	return new Uint8Array([...binaryString].map((char) => char.charCodeAt(0)));
};
