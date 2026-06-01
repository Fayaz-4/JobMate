import Vapi from '@vapi-ai/web';

// Safe check to handle ESM/CommonJS default export nesting in Vite bundler
const VapiClass = typeof Vapi === 'function' ? Vapi : (Vapi.default || Vapi);

const vapiPublicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY || "59f4bb5d-fd3d-4f30-8485-21d5b8f1750c";

const vapi = new VapiClass(vapiPublicKey);

export default vapi;
